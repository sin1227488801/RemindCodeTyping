package com.rct.infrastructure.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Validates critical configuration at application startup to ensure security and operational
 * requirements are met before the application becomes available.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StartupConfigurationValidator {

  private final EnvironmentConfig environmentConfig;
  private final SecretManager secretManager;
  private final ConfigurationSecurityScanner securityScanner;

  /** Performs comprehensive configuration validation when the application is ready. */
  @EventListener(ApplicationReadyEvent.class)
  public void validateStartupConfiguration() {
    log.info("Starting comprehensive configuration validation...");

    try {
      // Validate environment configuration
      validateEnvironmentSetup();

      // Validate critical secrets
      validateCriticalSecrets();

      // Perform security scan
      performSecurityScan();

      // Log successful validation
      logSuccessfulValidation();

    } catch (Exception e) {
      log.error("Configuration validation failed: {}", e.getMessage());
      throw new IllegalStateException("Application startup failed due to configuration issues", e);
    }
  }

  /** Validates environment-specific configuration. */
  private void validateEnvironmentSetup() {
    log.debug("Validating environment setup...");

    environmentConfig.validateConfiguration();

    // Additional startup validations
    if (environmentConfig.isProduction()) {
      validateProductionRequirements();
    }

    log.debug("Environment setup validation completed");
  }

  /** Validates that critical secrets are present and secure. */
  private void validateCriticalSecrets() {
    log.debug("Validating critical secrets...");

    // Validate all required secrets
    secretManager.validateRequiredSecrets();

    // Get configuration audit for monitoring
    SecretManager.ConfigurationAudit audit = secretManager.getConfigurationAudit();
    log.info(
        "Configuration audit: {} environment, {} total configs, {} sensitive configs",
        audit.environment(),
        audit.totalConfigurationCount(),
        audit.sensitiveConfigurationCount());

    log.debug("Critical secrets validation completed");
  }

  /** Performs security scanning of the configuration. */
  private void performSecurityScan() {
    log.debug("Performing configuration security scan...");

    ConfigurationSecurityScanner.SecurityScanResult scanResult =
        securityScanner.scanConfiguration();

    if (scanResult.hasIssues()) {
      long criticalIssues = scanResult.getCriticalIssueCount();
      long highIssues = scanResult.getHighIssueCount();

      if (criticalIssues > 0) {
        log.error("Configuration security scan found {} critical issues", criticalIssues);
        scanResult.getIssues().stream()
            .filter(
                issue ->
                    issue.getSeverity() == ConfigurationSecurityScanner.SecuritySeverity.CRITICAL)
            .forEach(
                issue ->
                    log.error(
                        "CRITICAL: {} - {}", issue.getDescription(), issue.getRecommendation()));

        throw new SecurityException(
            "Critical security issues found in configuration. Application startup aborted.");
      }

      if (highIssues > 0) {
        log.warn("Configuration security scan found {} high-priority issues", highIssues);
        scanResult.getIssues().stream()
            .filter(
                issue -> issue.getSeverity() == ConfigurationSecurityScanner.SecuritySeverity.HIGH)
            .forEach(
                issue ->
                    log.warn("HIGH: {} - {}", issue.getDescription(), issue.getRecommendation()));
      }
    }

    log.debug("Configuration security scan completed");
  }

  /** Validates production-specific requirements. */
  private void validateProductionRequirements() {
    log.debug("Validating production-specific requirements...");

    // Ensure debug mode is disabled
    if (environmentConfig.isDebugEnabled()) {
      throw new IllegalStateException("Debug mode must be disabled in production");
    }

    // Validate JWT secret strength
    validateProductionJwtSecret();

    log.debug("Production requirements validation completed");
  }

  /** Validates JWT secret meets production security requirements. */
  private void validateProductionJwtSecret() {
    try {
      String jwtSecret = secretManager.getRequiredSecret("JWT_SECRET");

      if (jwtSecret.length() < 32) {
        throw new SecurityException("JWT secret must be at least 32 characters long in production");
      }

      // Additional entropy check for production
      if (!hasProductionGradeEntropy(jwtSecret)) {
        throw new SecurityException("JWT secret does not meet production entropy requirements");
      }

    } catch (SecurityException e) {
      throw new IllegalStateException("JWT secret validation failed: " + e.getMessage(), e);
    }
  }

  /** Checks if a secret has production-grade entropy. */
  private boolean hasProductionGradeEntropy(String secret) {
    // Check for character diversity
    boolean hasUpper = secret.chars().anyMatch(Character::isUpperCase);
    boolean hasLower = secret.chars().anyMatch(Character::isLowerCase);
    boolean hasDigit = secret.chars().anyMatch(Character::isDigit);
    boolean hasSpecial = secret.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));

    // Require at least 3 of 4 character types for production
    int typeCount =
        (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSpecial ? 1 : 0);

    return typeCount >= 3;
  }

  /** Logs successful validation completion. */
  private void logSuccessfulValidation() {
    log.info("✓ Configuration validation completed successfully");
    log.info("✓ Environment: {}", environmentConfig.getDescription());
    log.info("✓ Security scan: No critical issues found");
    log.info("✓ All required secrets validated");

    if (environmentConfig.isProduction()) {
      log.info("✓ Production security requirements met");
    }

    log.info("Application is ready to serve requests");
  }
}
