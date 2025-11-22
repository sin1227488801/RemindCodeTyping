package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/** Unit tests for SecretManager. */
@ExtendWith(MockitoExtension.class)
class SecretManagerTest {

  @Mock private Environment environment;

  @Mock private EnvironmentConfig environmentConfig;

  private SecretManager secretManager;

  @BeforeEach
  void setUp() {
    secretManager = new SecretManager(environment, environmentConfig);
  }

  @Test
  void shouldReturnSecretWhenPresent() {
    // Given
    when(environment.getProperty("TEST_SECRET")).thenReturn("secret-value");
    when(environmentConfig.isProduction()).thenReturn(false);

    // When
    var result = secretManager.getSecret("TEST_SECRET");

    // Then
    assertThat(result).isPresent();
    assertThat(result.get()).isEqualTo("secret-value");
  }

  @Test
  void shouldReturnEmptyWhenSecretNotPresent() {
    // Given
    when(environment.getProperty("MISSING_SECRET")).thenReturn(null);

    // When
    var result = secretManager.getSecret("MISSING_SECRET");

    // Then
    assertThat(result).isEmpty();
  }

  @Test
  void shouldReturnDefaultWhenSecretNotPresent() {
    // Given
    when(environment.getProperty("MISSING_SECRET")).thenReturn(null);

    // When
    String result = secretManager.getSecretOrDefault("MISSING_SECRET", "default-value");

    // Then
    assertThat(result).isEqualTo("default-value");
  }

  @Test
  void shouldThrowExceptionForRequiredSecretWhenMissing() {
    // Given
    when(environment.getProperty("REQUIRED_SECRET")).thenReturn(null);

    // When & Then
    assertThatThrownBy(() -> secretManager.getRequiredSecret("REQUIRED_SECRET"))
        .isInstanceOf(SecurityException.class)
        .hasMessageContaining("Required secret missing");
  }

  @Test
  void shouldValidateProductionSecretStrength() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environment.getProperty("JWT_SECRET")).thenReturn("weak");

    // When & Then
    assertThatThrownBy(() -> secretManager.getSecret("JWT_SECRET"))
        .isInstanceOf(SecurityException.class)
        .hasMessageContaining("too short for production");
  }

  @Test
  void shouldAcceptStrongProductionSecret() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environment.getProperty("JWT_SECRET"))
        .thenReturn("ThisIsAVerySecureJwtSecretKeyWithHighEntropyAndSufficientLength123!");

    // When
    var result = secretManager.getSecret("JWT_SECRET");

    // Then
    assertThat(result).isPresent();
  }

  @Test
  void shouldDetectWeakSecrets() {
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
  void shouldDetectInsufficientEntropy() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environment.getProperty("JWT_SECRET"))
        .thenReturn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"); // All lowercase, no variety

    // When & Then
    assertThatThrownBy(() -> secretManager.getSecret("JWT_SECRET"))
        .isInstanceOf(SecurityException.class)
        .hasMessageContaining("insufficient entropy");
  }

  @Test
  void shouldIdentifySensitiveKeys() {
    assertThat(secretManager.isSensitiveKey("JWT_SECRET")).isTrue();
    assertThat(secretManager.isSensitiveKey("DATABASE_PASSWORD")).isTrue();
    assertThat(secretManager.isSensitiveKey("API_KEY")).isTrue();
    assertThat(secretManager.isSensitiveKey("PRIVATE_KEY")).isTrue();
    assertThat(secretManager.isSensitiveKey("AUTH_TOKEN")).isTrue();

    assertThat(secretManager.isSensitiveKey("SERVER_PORT")).isFalse();
    assertThat(secretManager.isSensitiveKey("APP_NAME")).isFalse();
    assertThat(secretManager.isSensitiveKey("LOG_LEVEL")).isFalse();
  }

  @Test
  void shouldMaskSensitiveValuesForLogging() {
    String maskedSecret = secretManager.maskValueForLogging("JWT_SECRET", "verysecretvalue");
    assertThat(maskedSecret).isEqualTo("ve********ue");

    String maskedNonSecret = secretManager.maskValueForLogging("SERVER_PORT", "8080");
    assertThat(maskedNonSecret).isEqualTo("8080");

    String maskedNull = secretManager.maskValueForLogging("JWT_SECRET", null);
    assertThat(maskedNull).isEqualTo("null");
  }

  @Test
  void shouldValidateRequiredSecretsInProduction() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environmentConfig.getName()).thenReturn("production");
    when(environment.getProperty("JWT_SECRET"))
        .thenReturn("ThisIsAVerySecureJwtSecretKeyWithHighEntropyAndSufficientLength123!");
    when(environment.getProperty("SPRING_DATASOURCE_URL"))
        .thenReturn("jdbc:postgresql://localhost:5432/rctdb");
    when(environment.getProperty("SPRING_DATASOURCE_PASSWORD")).thenReturn("SecureDbPassword123!");

    // When & Then - Should not throw exception
    secretManager.validateRequiredSecrets();
  }

  @Test
  void shouldFailValidationWhenRequiredSecretMissing() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environmentConfig.getName()).thenReturn("production");
    when(environment.getProperty("JWT_SECRET")).thenReturn(null);

    // When & Then
    assertThatThrownBy(() -> secretManager.validateRequiredSecrets())
        .isInstanceOf(SecurityException.class)
        .hasMessageContaining("JWT secret is required");
  }
}
