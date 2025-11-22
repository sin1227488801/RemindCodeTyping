package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * Comprehensive security tests for configuration management. Tests security aspects of
 * configuration handling, secret management, and validation.
 */
@ExtendWith(MockitoExtension.class)
class ConfigurationSecurityTest {

  @Mock private Environment environment;

  @Mock private EnvironmentConfig environmentConfig;

  private SecretManager secretManager;
  private ConfigurationValidator configurationValidator;

  @BeforeEach
  void setUp() {
    secretManager = new SecretManager(environment, environmentConfig);
  }

  @Test
  void shouldRejectWeakSecretsInProduction() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environment.getProperty("JWT_SECRET"))
        .thenReturn("password123456789012345678901234567890");

    // When & Then
    assertThatThrownBy(() -> secretManager.getSecret("JWT_SECRET"))
        .isInstanceOf(SecurityException.class)
        .hasMessageContaining("weak or default value");
  }

  @Test
  void shouldRejectShortSecretsInProduction() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environment.getProperty("JWT_SECRET")).thenReturn("short");

    // When & Then
    assertThatThrownBy(() -> secretManager.getSecret("JWT_SECRET"))
        .isInstanceOf(SecurityException.class)
        .hasMessageContaining("too short for production");
  }

  @Test
  void shouldRejectSecretsWithInsufficientEntropy() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environment.getProperty("JWT_SECRET"))
        .thenReturn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"); // All same character

    // When & Then
    assertThatThrownBy(() -> secretManager.getSecret("JWT_SECRET"))
        .isInstanceOf(SecurityException.class)
        .hasMessageContaining("insufficient entropy");
  }

  @Test
  void shouldAcceptStrongSecretsInProduction() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environment.getProperty("JWT_SECRET"))
        .thenReturn("Str0ng!Secr3t#K3y$W1th%H1gh&Entr0py*And+L3ngth=2024");

    // When
    var result = secretManager.getSecret("JWT_SECRET");

    // Then
    assertThat(result).isPresent();
  }

  @Test
  void shouldMaskSensitiveValuesInLogs() {
    // Test various sensitive value masking scenarios
    assertThat(secretManager.maskValueForLogging("JWT_SECRET", "verysecretvalue"))
        .isEqualTo("ve********ue");

    assertThat(secretManager.maskValueForLogging("PASSWORD", "abc")).isEqualTo("****");

    assertThat(secretManager.maskValueForLogging("API_KEY", null)).isEqualTo("null");

    assertThat(secretManager.maskValueForLogging("SERVER_PORT", "8080"))
        .isEqualTo("8080"); // Non-sensitive value not masked
  }

  @Test
  void shouldIdentifySensitiveConfigurationKeys() {
    // Sensitive keys
    assertThat(secretManager.isSensitiveKey("JWT_SECRET")).isTrue();
    assertThat(secretManager.isSensitiveKey("DATABASE_PASSWORD")).isTrue();
    assertThat(secretManager.isSensitiveKey("API_KEY")).isTrue();
    assertThat(secretManager.isSensitiveKey("PRIVATE_KEY")).isTrue();
    assertThat(secretManager.isSensitiveKey("AUTH_TOKEN")).isTrue();
    assertThat(secretManager.isSensitiveKey("CREDENTIAL_VALUE")).isTrue();

    // Non-sensitive keys
    assertThat(secretManager.isSensitiveKey("SERVER_PORT")).isFalse();
    assertThat(secretManager.isSensitiveKey("APP_NAME")).isFalse();
    assertThat(secretManager.isSensitiveKey("LOG_LEVEL")).isFalse();
    assertThat(secretManager.isSensitiveKey("CORS_ORIGINS")).isFalse();
  }

  @Test
  void shouldValidateProductionConfigurationSecurity() {
    // Given
    ApplicationProperties applicationProperties = createSecureApplicationProperties();
    EnvironmentConfig productionEnvConfig =
        new EnvironmentConfig("production", true, false, "1.0.0", "2024-01-01T00:00:00Z");

    configurationValidator =
        new ConfigurationValidator(applicationProperties, productionEnvConfig, secretManager);

    // Mock secret manager for production validation
    doNothing().when(secretManager).validateRequiredSecrets();

    // When & Then - Should not throw exception for secure configuration
    configurationValidator.validateConfiguration();
  }

  @Test
  void shouldRejectDebugModeInProduction() {
    // Given
    ApplicationProperties applicationProperties = createSecureApplicationProperties();
    EnvironmentConfig productionEnvConfig =
        new EnvironmentConfig(
            "production", true, true, "1.0.0", "2024-01-01T00:00:00Z" // Debug enabled in production
            );

    configurationValidator =
        new ConfigurationValidator(applicationProperties, productionEnvConfig, secretManager);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Debug mode must be disabled in production");
  }

  @Test
  void shouldRejectWildcardCorsInProduction() {
    // Given
    ApplicationProperties.CorsProperties insecureCors =
        new ApplicationProperties.CorsProperties(
            List.of("*"), // Wildcard not allowed in production
            List.of("GET", "POST"),
            List.of("*"),
            true,
            Duration.ofHours(1));

    ApplicationProperties applicationProperties =
        new ApplicationProperties(
            createSecureJwtProperties(),
            insecureCors,
            createSecureSecurityProperties(),
            createSecureDatabaseProperties());

    EnvironmentConfig productionEnvConfig =
        new EnvironmentConfig("production", true, false, "1.0.0", "2024-01-01T00:00:00Z");

    configurationValidator =
        new ConfigurationValidator(applicationProperties, productionEnvConfig, secretManager);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Wildcard CORS origin (*) is not allowed in production");
  }

  @Test
  void shouldValidateConfigurationAudit() {
    // Given
    when(environmentConfig.getName()).thenReturn("production");
    when(environmentConfig.isProduction()).thenReturn(true);

    // When
    SecretManager.ConfigurationAudit audit = secretManager.getConfigurationAudit();

    // Then
    assertThat(audit).isNotNull();
    assertThat(audit.environment()).isEqualTo("production");
    assertThat(audit.isProduction()).isTrue();
    assertThat(audit.auditTimestamp()).isGreaterThan(0);
  }

  @Test
  void shouldValidateJwtSecurityInProduction() {
    // Given
    ApplicationProperties.JwtProperties weakJwt =
        new ApplicationProperties.JwtProperties(
            "weak-secret", // Too short for production
            Duration.ofMinutes(60),
            Duration.ofDays(7),
            "rct-backend",
            "rct-frontend");

    ApplicationProperties applicationProperties =
        new ApplicationProperties(
            weakJwt,
            createSecureCorsProperties(),
            createSecureSecurityProperties(),
            createSecureDatabaseProperties());

    EnvironmentConfig productionEnvConfig =
        new EnvironmentConfig("production", true, false, "1.0.0", "2024-01-01T00:00:00Z");

    configurationValidator =
        new ConfigurationValidator(applicationProperties, productionEnvConfig, secretManager);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("JWT secret must be at least 32 characters");
  }

  @Test
  void shouldValidateSecurityPolicyConfiguration() {
    // Given
    ApplicationProperties.SecurityProperties weakSecurity =
        new ApplicationProperties.SecurityProperties(
            4, // Too short minimum password length
            128,
            5,
            Duration.ofMinutes(15),
            true);

    ApplicationProperties applicationProperties =
        new ApplicationProperties(
            createSecureJwtProperties(),
            createSecureCorsProperties(),
            weakSecurity,
            createSecureDatabaseProperties());

    EnvironmentConfig envConfig =
        new EnvironmentConfig("production", true, false, "1.0.0", "2024-01-01T00:00:00Z");

    configurationValidator =
        new ConfigurationValidator(applicationProperties, envConfig, secretManager);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Minimum password length must be at least 8");
  }

  // Helper methods to create secure configuration objects

  private ApplicationProperties createSecureApplicationProperties() {
    return new ApplicationProperties(
        createSecureJwtProperties(),
        createSecureCorsProperties(),
        createSecureSecurityProperties(),
        createSecureDatabaseProperties());
  }

  private ApplicationProperties.JwtProperties createSecureJwtProperties() {
    return new ApplicationProperties.JwtProperties(
        "Str0ng!Secr3t#K3y$W1th%H1gh&Entr0py*And+L3ngth=2024!@#$%^&*()",
        Duration.ofMinutes(60), Duration.ofDays(7), "rct-backend", "rct-frontend");
  }

  private ApplicationProperties.CorsProperties createSecureCorsProperties() {
    return new ApplicationProperties.CorsProperties(
        List.of("https://yourdomain.com", "https://app.yourdomain.com"),
        List.of("GET", "POST", "PUT", "DELETE"),
        List.of("Authorization", "Content-Type"),
        true,
        Duration.ofHours(1));
  }

  private ApplicationProperties.SecurityProperties createSecureSecurityProperties() {
    return new ApplicationProperties.SecurityProperties(
        12, // Strong minimum password length
        256,
        3, // Conservative login attempts
        Duration.ofMinutes(30), // Reasonable lockout duration
        true);
  }

  private ApplicationProperties.DatabaseProperties createSecureDatabaseProperties() {
    return new ApplicationProperties.DatabaseProperties(
        20, // Production-appropriate pool size
        Duration.ofSeconds(30),
        Duration.ofMinutes(10),
        Duration.ofMinutes(30),
        false // SQL logging disabled in production
        );
  }
}
