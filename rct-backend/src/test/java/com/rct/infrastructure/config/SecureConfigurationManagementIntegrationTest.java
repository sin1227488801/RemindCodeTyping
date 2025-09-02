package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Integration tests for secure configuration management to ensure all components work together
 * properly and security requirements are enforced.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(
    properties = {
      "app.environment.name=test",
      "app.environment.production=false",
      "app.environment.debug-enabled=true",
      "app.jwt.secret=test-secret-key-for-integration-testing-minimum-32-characters",
      "app.jwt.expiration=PT60M",
      "app.jwt.refresh-expiration=P7D",
      "app.jwt.issuer=rct-test",
      "app.jwt.audience=rct-test-audience",
      "app.cors.allowed-origins=http://localhost:3000",
      "app.cors.allowed-methods=GET,POST,PUT,DELETE",
      "app.cors.allowed-headers=*",
      "app.cors.allow-credentials=true",
      "app.cors.max-age=PT1H",
      "app.security.password-min-length=8",
      "app.security.password-max-length=128",
      "app.security.max-login-attempts=5",
      "app.security.lockout-duration=PT15M",
      "app.security.require-strong-password=true",
      "app.database.connection-pool-size=10",
      "app.database.connection-timeout=PT30S",
      "app.database.idle-timeout=PT10M",
      "app.database.max-lifetime=PT30M",
      "app.database.show-sql=false"
    })
class SecureConfigurationManagementIntegrationTest {

  @Autowired private ApplicationProperties applicationProperties;

  @Autowired private EnvironmentConfig environmentConfig;

  @Autowired private SecretManager secretManager;

  @Autowired private ConfigurationValidator configurationValidator;

  @Autowired private ConfigurationSecurityScanner securityScanner;

  @Test
  void shouldLoadConfigurationPropertiesCorrectly() {
    // Verify environment configuration
    assertThat(environmentConfig.getName()).isEqualTo("test");
    assertThat(environmentConfig.isProduction()).isFalse();
    assertThat(environmentConfig.isDebugEnabled()).isTrue();

    // Verify JWT configuration
    assertThat(applicationProperties.jwt().secret()).isNotEmpty();
    assertThat(applicationProperties.jwt().expiration()).isNotNull();
    assertThat(applicationProperties.jwt().issuer()).isEqualTo("rct-test");

    // Verify security configuration
    assertThat(applicationProperties.security().passwordMinLength()).isEqualTo(8);
    assertThat(applicationProperties.security().requireStrongPassword()).isTrue();
  }

  @Test
  void shouldValidateConfigurationSuccessfully() {
    // Configuration validation should pass for test environment
    configurationValidator.validateConfiguration();

    // Verify no exceptions are thrown
    assertThat(environmentConfig.getName()).isEqualTo("test");
  }

  @Test
  void shouldDetectSensitiveConfigurationKeys() {
    // Test sensitive key detection
    assertThat(secretManager.isSensitiveKey("JWT_SECRET")).isTrue();
    assertThat(secretManager.isSensitiveKey("DATABASE_PASSWORD")).isTrue();
    assertThat(secretManager.isSensitiveKey("API_KEY")).isTrue();
    assertThat(secretManager.isSensitiveKey("PRIVATE_KEY")).isTrue();

    // Test non-sensitive keys
    assertThat(secretManager.isSensitiveKey("SERVER_PORT")).isFalse();
    assertThat(secretManager.isSensitiveKey("APP_NAME")).isFalse();
    assertThat(secretManager.isSensitiveKey("LOG_LEVEL")).isFalse();
  }

  @Test
  void shouldMaskSensitiveValuesForLogging() {
    // Test value masking for sensitive keys
    String maskedValue = secretManager.maskValueForLogging("JWT_SECRET", "verysecretvalue");
    assertThat(maskedValue).doesNotContain("verysecretvalue").contains("*");

    // Test non-sensitive values are not masked
    String nonSensitiveValue = secretManager.maskValueForLogging("SERVER_PORT", "8080");
    assertThat(nonSensitiveValue).isEqualTo("8080");
  }

  @Test
  void shouldPerformSecurityScanWithoutCriticalIssues() {
    // Perform security scan
    ConfigurationSecurityScanner.SecurityScanResult scanResult =
        securityScanner.scanConfiguration();

    // In test environment, should not have critical issues
    assertThat(scanResult.getCriticalIssueCount()).isEqualTo(0);

    // Should provide recommendations
    assertThat(scanResult.getRecommendations()).isNotEmpty();
  }

  @Test
  void shouldProvideConfigurationAuditInformation() {
    // Get configuration audit
    SecretManager.ConfigurationAudit audit = secretManager.getConfigurationAudit();

    assertThat(audit.environment()).isEqualTo("test");
    assertThat(audit.isProduction()).isFalse();
    assertThat(audit.totalConfigurationCount()).isGreaterThan(0);
    assertThat(audit.auditTimestamp()).isGreaterThan(0);
  }

  @Test
  void shouldValidateEnvironmentConsistency() {
    // Environment configuration should be consistent
    environmentConfig.validateConfiguration();

    // Test environment should allow debug mode
    assertThat(environmentConfig.isDebugEnabled()).isTrue();
    assertThat(environmentConfig.isProduction()).isFalse();
  }

  @Test
  void shouldHandleSecretRetrieval() {
    // Should be able to retrieve configured secrets
    var jwtSecret = secretManager.getSecret("app.jwt.secret");
    assertThat(jwtSecret).isPresent();
    assertThat(jwtSecret.get()).isNotEmpty();

    // Should return empty for non-existent secrets
    var nonExistentSecret = secretManager.getSecret("NON_EXISTENT_SECRET");
    assertThat(nonExistentSecret).isEmpty();
  }

  @Test
  void shouldProvideSecurityRecommendations() {
    // Security scanner should provide recommendations
    ConfigurationSecurityScanner.SecurityScanResult scanResult =
        securityScanner.scanConfiguration();

    assertThat(scanResult.getRecommendations()).containsKey("HTTPS").containsKey("Monitoring");
  }

  @Test
  void shouldValidateJwtConfiguration() {
    // JWT configuration should be valid
    var jwtConfig = applicationProperties.jwt();

    assertThat(jwtConfig.secret()).isNotEmpty();
    assertThat(jwtConfig.expiration()).isNotNull();
    assertThat(jwtConfig.refreshExpiration()).isNotNull();
    assertThat(jwtConfig.issuer()).isNotEmpty();
    assertThat(jwtConfig.audience()).isNotEmpty();
  }

  @Test
  void shouldValidateSecurityConfiguration() {
    // Security configuration should be valid
    var securityConfig = applicationProperties.security();

    assertThat(securityConfig.passwordMinLength()).isGreaterThanOrEqualTo(8);
    assertThat(securityConfig.passwordMaxLength())
        .isGreaterThan(securityConfig.passwordMinLength());
    assertThat(securityConfig.maxLoginAttempts()).isGreaterThan(0);
    assertThat(securityConfig.lockoutDuration()).isNotNull();
  }

  @Test
  void shouldValidateDatabaseConfiguration() {
    // Database configuration should be valid
    var dbConfig = applicationProperties.database();

    assertThat(dbConfig.connectionPoolSize()).isGreaterThan(0);
    assertThat(dbConfig.connectionTimeout()).isNotNull();
    assertThat(dbConfig.idleTimeout()).isNotNull();
    assertThat(dbConfig.maxLifetime()).isNotNull();
  }

  @Test
  void shouldValidateCorsConfiguration() {
    // CORS configuration should be valid
    var corsConfig = applicationProperties.cors();

    assertThat(corsConfig.allowedOrigins()).isNotEmpty();
    assertThat(corsConfig.allowedMethods()).isNotEmpty();
    assertThat(corsConfig.allowedHeaders()).isNotEmpty();
    assertThat(corsConfig.maxAge()).isNotNull();
  }
}
