package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySource;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

/**
 * Test to verify configuration management implementation works correctly. This test validates that
 * the configuration properties can be bound and validated.
 */
class ConfigurationManagementTest {

  @Test
  void shouldBindAndValidateApplicationProperties() {
    // Given - Configuration properties that follow 12-Factor principles
    Map<String, Object> properties =
        Map.of(
            "app.jwt.secret",
            "test-secret-key-with-sufficient-length-for-security-requirements",
            "app.jwt.expiration",
            "PT30M",
            "app.jwt.issuer",
            "test-issuer",
            "app.jwt.audience",
            "test-audience",
            "app.cors.allowed-origins",
            List.of("http://localhost:3000", "http://localhost:8080"),
            "app.cors.allowed-methods",
            List.of("GET", "POST", "PUT", "DELETE"),
            "app.cors.allowed-headers",
            List.of("*"),
            "app.cors.allow-credentials",
            true,
            "app.cors.max-age",
            "PT1H",
            "app.security.password-min-length",
            8,
            "app.security.password-max-length",
            128,
            "app.security.max-login-attempts",
            5,
            "app.security.lockout-duration",
            "PT15M",
            "app.security.require-strong-password",
            true,
            "app.database.connection-pool-size",
            10,
            "app.database.connection-timeout",
            "PT30S",
            "app.database.idle-timeout",
            "PT10M",
            "app.database.max-lifetime",
            "PT30M",
            "app.database.show-sql",
            false);

    ConfigurationPropertySource source = new MapConfigurationPropertySource(properties);
    Binder binder = new Binder(source);

    // When - Binding configuration properties
    ApplicationProperties result = binder.bind("app", ApplicationProperties.class).get();

    // Then - All properties should be correctly bound and validated
    assertThat(result).isNotNull();

    // Verify JWT configuration
    assertThat(result.jwt().secret()).hasSize(64); // Sufficient length
    assertThat(result.jwt().expiration()).isEqualTo(Duration.ofMinutes(30));
    assertThat(result.jwt().issuer()).isEqualTo("test-issuer");
    assertThat(result.jwt().audience()).isEqualTo("test-audience");

    // Verify CORS configuration
    assertThat(result.cors().allowedOrigins()).hasSize(2);
    assertThat(result.cors().allowedMethods()).contains("GET", "POST", "PUT", "DELETE");
    assertThat(result.cors().allowCredentials()).isTrue();
    assertThat(result.cors().maxAge()).isEqualTo(Duration.ofHours(1));

    // Verify Security configuration
    assertThat(result.security().passwordMinLength()).isEqualTo(8);
    assertThat(result.security().maxLoginAttempts()).isEqualTo(5);
    assertThat(result.security().lockoutDuration()).isEqualTo(Duration.ofMinutes(15));
    assertThat(result.security().requireStrongPassword()).isTrue();

    // Verify Database configuration
    assertThat(result.database().connectionPoolSize()).isEqualTo(10);
    assertThat(result.database().connectionTimeout()).isEqualTo(Duration.ofSeconds(30));
    assertThat(result.database().showSql()).isFalse();
  }

  @Test
  void shouldBindEnvironmentConfiguration() {
    // Given
    Map<String, Object> properties =
        Map.of(
            "app.environment.name", "test",
            "app.environment.production", false,
            "app.environment.debug-enabled", true,
            "app.environment.version", "1.0.0-TEST",
            "app.environment.build-timestamp", "2024-01-01T00:00:00Z");

    ConfigurationPropertySource source = new MapConfigurationPropertySource(properties);
    Binder binder = new Binder(source);

    // When
    EnvironmentConfig result = binder.bind("app.environment", EnvironmentConfig.class).get();

    // Then
    assertThat(result).isNotNull();
    assertThat(result.name()).isEqualTo("test");
    assertThat(result.production()).isFalse();
    assertThat(result.debugEnabled()).isTrue();
    assertThat(result.version()).isEqualTo("1.0.0-TEST");
    assertThat(result.buildTimestamp()).isEqualTo("2024-01-01T00:00:00Z");

    // Test convenience methods
    assertThat(result.isProduction()).isFalse();
    assertThat(result.isDevelopment()).isFalse(); // "test" is not "dev"
    assertThat(result.isStaging()).isFalse();
    assertThat(result.isDebugEnabled()).isTrue();
  }

  @Test
  void shouldValidateSecretManager() {
    // Given
    EnvironmentConfig envConfig = new EnvironmentConfig("test", false, true, "1.0.0", "2024-01-01");
    SecretManager secretManager = new SecretManager(envConfig);

    // When & Then - Test secret masking
    assertThat(secretManager.maskSensitiveValue("secret123")).isEqualTo("s***3");
    assertThat(secretManager.maskSensitiveValue("abc")).isEqualTo("***");
    assertThat(secretManager.maskSensitiveValue(null)).isEqualTo("***");
    assertThat(secretManager.maskSensitiveValue("")).isEqualTo("***");

    // Test default value handling
    String defaultValue = secretManager.getSecretOrDefault("NON_EXISTENT_SECRET", "default");
    assertThat(defaultValue).isEqualTo("default");
  }

  @Test
  void shouldValidateConfigurationValidator() {
    // Given - Valid configuration
    ApplicationProperties.JwtProperties jwt =
        new ApplicationProperties.JwtProperties(
            "valid-secret-key-with-sufficient-length-for-testing",
            Duration.ofMinutes(30),
            "test-issuer",
            "test-audience");

    ApplicationProperties.SecurityProperties security =
        new ApplicationProperties.SecurityProperties(8, 128, 5, Duration.ofMinutes(15), true);

    ApplicationProperties.CorsProperties cors =
        new ApplicationProperties.CorsProperties(
            List.of("http://localhost:3000"),
            List.of("GET", "POST"),
            List.of("*"),
            true,
            Duration.ofHours(1));

    ApplicationProperties.DatabaseProperties database =
        new ApplicationProperties.DatabaseProperties(
            10, Duration.ofSeconds(30), Duration.ofMinutes(10), Duration.ofMinutes(30), false);

    ApplicationProperties appProps = new ApplicationProperties(jwt, cors, security, database);
    EnvironmentConfig envConfig = new EnvironmentConfig("test", false, true, "1.0.0", "2024-01-01");

    // When - Creating validator (should not throw)
    ConfigurationValidator validator = new ConfigurationValidator(appProps, envConfig);

    // Then - Validator should be created successfully
    assertThat(validator).isNotNull();
  }
}
