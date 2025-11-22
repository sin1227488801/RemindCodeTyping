package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Simple test to validate configuration security implementation without complex dependencies. */
@SpringBootTest
@ActiveProfiles("test")
class ConfigurationSecurityValidationTest {

  @Test
  void shouldImplementSecureConfigurationManagement() {
    // Test that SecretManager can identify sensitive keys
    SecretManager secretManager = new SecretManager(null, null);

    // Verify sensitive key detection works
    assertThat(secretManager.isSensitiveKey("JWT_SECRET")).isTrue();
    assertThat(secretManager.isSensitiveKey("PASSWORD")).isTrue();
    assertThat(secretManager.isSensitiveKey("API_KEY")).isTrue();
    assertThat(secretManager.isSensitiveKey("PRIVATE_KEY")).isTrue();
    assertThat(secretManager.isSensitiveKey("AUTH_TOKEN")).isTrue();

    // Verify non-sensitive keys are not flagged
    assertThat(secretManager.isSensitiveKey("SERVER_PORT")).isFalse();
    assertThat(secretManager.isSensitiveKey("APP_NAME")).isFalse();
    assertThat(secretManager.isSensitiveKey("LOG_LEVEL")).isFalse();
    assertThat(secretManager.isSensitiveKey("TIMEOUT")).isFalse();
  }

  @Test
  void shouldMaskSensitiveValuesForLogging() {
    SecretManager secretManager = new SecretManager(null, null);

    // Test masking of sensitive values
    String maskedSecret = secretManager.maskValueForLogging("JWT_SECRET", "verysecretvalue");
    assertThat(maskedSecret)
        .as("Sensitive value should be masked")
        .doesNotContain("verysecretvalue")
        .contains("*");

    // Test that non-sensitive values are not masked
    String publicValue = secretManager.maskValueForLogging("SERVER_PORT", "8080");
    assertThat(publicValue).as("Non-sensitive value should not be masked").isEqualTo("8080");

    // Test null handling
    String nullValue = secretManager.maskValueForLogging("JWT_SECRET", null);
    assertThat(nullValue).isEqualTo("null");
  }

  @Test
  void shouldCreateConfigurationSecurityScanner() {
    // Test that ConfigurationSecurityScanner can be instantiated
    EnvironmentConfig envConfig = new EnvironmentConfig("test", false, true, "1.0.0", "2024-01-01");
    SecretManager secretManager = new SecretManager(null, envConfig);

    ConfigurationSecurityScanner scanner =
        new ConfigurationSecurityScanner(envConfig, secretManager);

    // Perform a basic security scan
    ConfigurationSecurityScanner.SecurityScanResult result = scanner.scanConfiguration();

    assertThat(result).isNotNull();
    assertThat(result.getRecommendations()).isNotEmpty();
  }

  @Test
  void shouldValidateEnvironmentConfiguration() {
    // Test environment configuration validation
    EnvironmentConfig devConfig = new EnvironmentConfig("dev", false, true, "1.0.0", "2024-01-01");

    // Development environment should allow debug mode
    assertThat(devConfig.isProduction()).isFalse();
    assertThat(devConfig.isDebugEnabled()).isTrue();
    assertThat(devConfig.isDevelopment()).isTrue();

    // Should validate successfully
    devConfig.validateConfiguration();
  }

  @Test
  void shouldProvideSecurityRecommendations() {
    EnvironmentConfig prodConfig =
        new EnvironmentConfig("production", true, false, "1.0.0", "2024-01-01");
    SecretManager secretManager = new SecretManager(null, prodConfig);
    ConfigurationSecurityScanner scanner =
        new ConfigurationSecurityScanner(prodConfig, secretManager);

    ConfigurationSecurityScanner.SecurityScanResult result = scanner.scanConfiguration();

    // Should provide security recommendations
    assertThat(result.getRecommendations())
        .containsKey("HTTPS")
        .containsKey("Monitoring")
        .containsKey("Backup")
        .containsKey("Rotation");
  }
}
