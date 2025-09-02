package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for ConfigurationValidator. */
@ExtendWith(MockitoExtension.class)
class ConfigurationValidatorTest {

  @Mock private ApplicationProperties applicationProperties;

  @Mock private EnvironmentConfig environmentConfig;

  @Mock private SecretManager secretManager;

  private ConfigurationValidator configurationValidator;

  @BeforeEach
  void setUp() {
    configurationValidator =
        new ConfigurationValidator(applicationProperties, environmentConfig, secretManager);
  }

  @Test
  void shouldValidateValidConfiguration() {
    // Given
    setupValidConfiguration();

    // When & Then - Should not throw exception
    configurationValidator.validateConfiguration();

    verify(secretManager).validateRequiredSecrets();
  }

  @Test
  void shouldFailValidationForWeakJwtSecret() {
    // Given
    setupValidConfiguration();
    when(environmentConfig.isProduction()).thenReturn(true);

    var jwtConfig =
        new ApplicationProperties.JwtProperties(
            "weak", // Too short for production
            Duration.ofMinutes(60),
            Duration.ofDays(7),
            "rct-backend",
            "rct-frontend");
    when(applicationProperties.jwt()).thenReturn(jwtConfig);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("JWT secret must be at least 32 characters");
  }

  @Test
  void shouldFailValidationForDefaultJwtSecret() {
    // Given
    setupValidConfiguration();
    when(environmentConfig.isProduction()).thenReturn(true);

    var jwtConfig =
        new ApplicationProperties.JwtProperties(
            "mySecretKey123456789012345678901234567890", // Contains "secret"
            Duration.ofMinutes(60),
            Duration.ofDays(7),
            "rct-backend",
            "rct-frontend");
    when(applicationProperties.jwt()).thenReturn(jwtConfig);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("appears to be a default or weak value");
  }

  @Test
  void shouldFailValidationForInvalidPasswordPolicy() {
    // Given
    setupValidConfiguration();

    var securityConfig =
        new ApplicationProperties.SecurityProperties(
            4, // Too short minimum length
            128,
            5,
            Duration.ofMinutes(15),
            true);
    when(applicationProperties.security()).thenReturn(securityConfig);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Minimum password length must be at least 8");
  }

  @Test
  void shouldFailValidationForWildcardCorsInProduction() {
    // Given
    setupValidConfiguration();
    when(environmentConfig.isProduction()).thenReturn(true);

    var corsConfig =
        new ApplicationProperties.CorsProperties(
            List.of("*"), // Wildcard not allowed in production
            List.of("GET", "POST"),
            List.of("*"),
            true,
            Duration.ofHours(1));
    when(applicationProperties.cors()).thenReturn(corsConfig);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Wildcard CORS origin (*) is not allowed in production");
  }

  @Test
  void shouldFailValidationForDebugEnabledInProduction() {
    // Given
    setupValidConfiguration();
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environmentConfig.isDebugEnabled()).thenReturn(true);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Debug mode must be disabled in production");
  }

  @Test
  void shouldFailValidationForInvalidDatabaseConfiguration() {
    // Given
    setupValidConfiguration();

    var dbConfig =
        new ApplicationProperties.DatabaseProperties(
            0, // Invalid pool size
            Duration.ofSeconds(30),
            Duration.ofMinutes(10),
            Duration.ofMinutes(30),
            false);
    when(applicationProperties.database()).thenReturn(dbConfig);

    // When & Then
    assertThatThrownBy(() -> configurationValidator.validateConfiguration())
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Database connection pool size must be at least 1");
  }

  private void setupValidConfiguration() {
    // Environment config
    when(environmentConfig.getName()).thenReturn("dev");
    when(environmentConfig.isProduction()).thenReturn(false);
    when(environmentConfig.isDebugEnabled()).thenReturn(true);
    doNothing().when(environmentConfig).validateConfiguration();

    // JWT config
    var jwtConfig =
        new ApplicationProperties.JwtProperties(
            "ThisIsAVerySecureJwtSecretKeyWithHighEntropyAndSufficientLength123!",
            Duration.ofMinutes(60),
            Duration.ofDays(7),
            "rct-backend",
            "rct-frontend");
    when(applicationProperties.jwt()).thenReturn(jwtConfig);

    // Security config
    var securityConfig =
        new ApplicationProperties.SecurityProperties(8, 128, 5, Duration.ofMinutes(15), true);
    when(applicationProperties.security()).thenReturn(securityConfig);

    // Database config
    var dbConfig =
        new ApplicationProperties.DatabaseProperties(
            10, Duration.ofSeconds(30), Duration.ofMinutes(10), Duration.ofMinutes(30), false);
    when(applicationProperties.database()).thenReturn(dbConfig);

    // CORS config
    var corsConfig =
        new ApplicationProperties.CorsProperties(
            List.of("http://localhost:3000"),
            List.of("GET", "POST", "PUT", "DELETE"),
            List.of("*"),
            true,
            Duration.ofHours(1));
    when(applicationProperties.cors()).thenReturn(corsConfig);

    // Secret manager
    doNothing().when(secretManager).validateRequiredSecrets();
  }
}
