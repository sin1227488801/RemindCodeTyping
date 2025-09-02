package com.rct.infrastructure.config;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** Manages sensitive configuration and secrets with security best practices. */
@Component
@RequiredArgsConstructor
@Slf4j
public class SecretManager {

  private final Environment environment;
  private final EnvironmentConfig environmentConfig;

  // Pattern for detecting potentially sensitive keys
  private static final Pattern SENSITIVE_KEY_PATTERN =
      Pattern.compile("(?i).*(password|secret|key|token|credential|auth|private).*");

  // Minimum length for production secrets
  private static final int MIN_PRODUCTION_SECRET_LENGTH = 32;

  /**
   * Gets a secret value from environment variables.
   *
   * @param key the environment variable key
   * @return Optional containing the secret value if present
   * @throws SecurityException if secret is required but missing or weak in production
   */
  public Optional<String> getSecret(String key) {
    String value = environment.getProperty(key);

    if (value == null || value.trim().isEmpty()) {
      log.debug("Secret not found for key: {}", key);
      return Optional.empty();
    }

    // Validate secret strength in production
    if (environmentConfig.isProduction() && isSensitiveKey(key)) {
      validateProductionSecret(key, value);
    }

    log.debug("Secret retrieved for key: {}", maskKey(key));
    return Optional.of(value);
  }

  /**
   * Gets a secret value with a fallback default.
   *
   * @param key the environment variable key
   * @param defaultValue the default value to use if secret is not found
   * @return the secret value or default
   */
  public String getSecretOrDefault(String key, String defaultValue) {
    return getSecret(key).orElse(defaultValue);
  }

  /**
   * Gets a required secret value.
   *
   * @param key the environment variable key
   * @return the secret value
   * @throws SecurityException if secret is missing
   */
  public String getRequiredSecret(String key) {
    return getSecret(key)
        .orElseThrow(() -> new SecurityException("Required secret missing: " + maskKey(key)));
  }

  /**
   * Validates that all required secrets are present and strong enough. Should be called during
   * application startup.
   */
  public void validateRequiredSecrets() {
    log.info("Validating required secrets for environment: {}", environmentConfig.getName());

    // JWT Secret
    validateRequiredSecret("JWT_SECRET", "JWT secret is required for token generation");

    // Database password (if using external database)
    if (isDatabasePasswordRequired()) {
      validateRequiredSecret(
          "SPRING_DATASOURCE_PASSWORD", "Database password is required for production");
    }

    // Additional production-only secrets
    if (environmentConfig.isProduction()) {
      validateProductionSecrets();
    }

    // Validate all environment variables for potential security issues
    validateEnvironmentVariableSecurity();

    log.info("Secret validation completed successfully");
  }

  /**
   * Masks sensitive values for safe logging.
   *
   * @param key the configuration key
   * @param value the configuration value
   * @return masked value safe for logging
   */
  public String maskValueForLogging(String key, String value) {
    if (value == null) {
      return "null";
    }

    if (isSensitiveKey(key)) {
      return maskSensitiveValue(value);
    }

    return value;
  }

  /** Checks if a configuration key represents sensitive data. */
  public boolean isSensitiveKey(String key) {
    if (key == null) {
      return false;
    }
    return SENSITIVE_KEY_PATTERN.matcher(key).matches();
  }

  /** Validates a production secret for strength and security. */
  private void validateProductionSecret(String key, String value) {
    if (value.length() < MIN_PRODUCTION_SECRET_LENGTH) {
      throw new SecurityException(
          String.format(
              "Secret '%s' is too short for production (minimum %d characters)",
              maskKey(key), MIN_PRODUCTION_SECRET_LENGTH));
    }

    // Check for common weak secrets
    if (isWeakSecret(value)) {
      throw new SecurityException(
          String.format("Secret '%s' appears to be a weak or default value", maskKey(key)));
    }

    // Check for sufficient entropy
    if (!hasSufficientEntropy(value)) {
      throw new SecurityException(
          String.format("Secret '%s' has insufficient entropy for production", maskKey(key)));
    }
  }

  /** Validates a required secret is present. */
  private void validateRequiredSecret(String key, String errorMessage) {
    if (!getSecret(key).isPresent()) {
      throw new SecurityException(errorMessage + " (key: " + maskKey(key) + ")");
    }
  }

  /** Validates production-specific secrets. */
  private void validateProductionSecrets() {
    // Add any additional production-only secret validations here
    log.debug("Validating production-specific secrets");

    // Example: API keys, external service credentials, etc.
    // validateRequiredSecret("EXTERNAL_API_KEY", "External API key required for production");
  }

  /** Checks if database password is required based on configuration. */
  private boolean isDatabasePasswordRequired() {
    String datasourceUrl = environment.getProperty("SPRING_DATASOURCE_URL", "");

    // If using external database (not H2), password is required
    return !datasourceUrl.contains("h2:mem")
        && !datasourceUrl.contains("h2:file")
        && environmentConfig.isProduction();
  }

  /** Checks if a secret value is considered weak. */
  private boolean isWeakSecret(String value) {
    String lowerValue = value.toLowerCase();

    // Common weak secrets
    String[] weakSecrets = {
      "password",
      "secret",
      "admin",
      "test",
      "demo",
      "default",
      "changeme",
      "123456",
      "qwerty",
      "letmein",
      "welcome",
      "mysecretkey",
      "defaultsecret",
      "testsecret"
    };

    for (String weak : weakSecrets) {
      if (lowerValue.contains(weak)) {
        return true;
      }
    }

    // Check for repeated characters
    if (hasRepeatedCharacters(value)) {
      return true;
    }

    return false;
  }

  /** Checks if a secret has sufficient entropy. */
  private boolean hasSufficientEntropy(String value) {
    // Simple entropy check: should have mix of character types
    boolean hasUpper = value.chars().anyMatch(Character::isUpperCase);
    boolean hasLower = value.chars().anyMatch(Character::isLowerCase);
    boolean hasDigit = value.chars().anyMatch(Character::isDigit);
    boolean hasSpecial = value.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));

    // Require at least 3 of 4 character types for production secrets
    int typeCount =
        (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSpecial ? 1 : 0);

    return typeCount >= 3;
  }

  /** Checks if a value has too many repeated characters. */
  private boolean hasRepeatedCharacters(String value) {
    if (value.length() < 4) {
      return false;
    }

    // Check for sequences of 3 or more identical characters
    for (int i = 0; i < value.length() - 2; i++) {
      if (value.charAt(i) == value.charAt(i + 1) && value.charAt(i) == value.charAt(i + 2)) {
        return true;
      }
    }

    return false;
  }

  /** Masks a sensitive value for logging. */
  private String maskSensitiveValue(String value) {
    if (value.length() <= 4) {
      return "****";
    }

    // Show first 2 and last 2 characters, mask the middle
    return value.substring(0, 2)
        + "*".repeat(Math.min(value.length() - 4, 8))
        + value.substring(value.length() - 2);
  }

  /** Validates environment variables for potential security issues. */
  private void validateEnvironmentVariableSecurity() {
    log.debug("Validating environment variable security");

    // Check for common insecure patterns in environment variables
    Map<String, String> envVars = System.getenv();

    for (Map.Entry<String, String> entry : envVars.entrySet()) {
      String key = entry.getKey();
      String value = entry.getValue();

      if (key.startsWith("RCT_")
          || key.startsWith("APP_")
          || key.startsWith("JWT_")
          || key.startsWith("SPRING_")) {

        // Check for potential security issues
        validateEnvironmentVariableValue(key, value);
      }
    }
  }

  /** Validates a specific environment variable for security issues. */
  private void validateEnvironmentVariableValue(String key, String value) {
    if (value == null || value.trim().isEmpty()) {
      return;
    }

    // Check for URLs with embedded credentials
    if (value.contains("://") && (value.contains("@") || value.contains(":"))) {
      if (value.matches(".*://[^/]*:[^/]*@.*")) {
        log.warn("Environment variable '{}' contains URL with embedded credentials", maskKey(key));
      }
    }

    // Check for file paths that might contain sensitive information
    if (isSensitiveKey(key) && (value.startsWith("/") || value.matches("[A-Za-z]:\\\\"))) {
      log.warn(
          "Environment variable '{}' contains file path - ensure file permissions are secure",
          maskKey(key));
    }

    // Check for base64 encoded values that might be secrets
    if (isSensitiveKey(key) && isBase64Encoded(value) && value.length() > 20) {
      log.debug("Environment variable '{}' appears to contain base64 encoded data", maskKey(key));
    }
  }

  /** Checks if a value appears to be base64 encoded. */
  private boolean isBase64Encoded(String value) {
    try {
      return value.matches("^[A-Za-z0-9+/]*={0,2}$") && value.length() % 4 == 0;
    } catch (Exception e) {
      return false;
    }
  }

  /** Gets configuration audit information for security monitoring. */
  public ConfigurationAudit getConfigurationAudit() {
    Map<String, String> envVars = System.getenv();
    int sensitiveVarCount = 0;
    int totalVarCount = 0;

    for (String key : envVars.keySet()) {
      if (key.startsWith("RCT_")
          || key.startsWith("APP_")
          || key.startsWith("JWT_")
          || key.startsWith("SPRING_")) {
        totalVarCount++;
        if (isSensitiveKey(key)) {
          sensitiveVarCount++;
        }
      }
    }

    return new ConfigurationAudit(
        environmentConfig.getName(),
        environmentConfig.isProduction(),
        totalVarCount,
        sensitiveVarCount,
        System.currentTimeMillis());
  }

  /** Configuration audit information for security monitoring. */
  public record ConfigurationAudit(
      String environment,
      boolean isProduction,
      int totalConfigurationCount,
      int sensitiveConfigurationCount,
      long auditTimestamp) {}

  /** Masks a configuration key for logging. */
  private String maskKey(String key) {
    if (key == null || key.length() <= 4) {
      return "****";
    }

    // Show first few characters, mask the rest
    return key.substring(0, Math.min(key.length() / 2, 4)) + "****";
  }
}
