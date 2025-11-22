package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EnvironmentConfigTest {

  @Test
  void shouldIdentifyProductionEnvironment() {
    // Given
    EnvironmentConfig config =
        new EnvironmentConfig("production", true, false, "1.0.0", "2024-01-01");

    // Then
    assertThat(config.isProduction()).isTrue();
    assertThat(config.isDevelopment()).isFalse();
    assertThat(config.isStaging()).isFalse();
    assertThat(config.isDebugEnabled()).isFalse();
  }

  @Test
  void shouldIdentifyDevelopmentEnvironment() {
    // Given
    EnvironmentConfig config =
        new EnvironmentConfig("dev", false, true, "1.0.0-SNAPSHOT", "2024-01-01");

    // Then
    assertThat(config.isProduction()).isFalse();
    assertThat(config.isDevelopment()).isTrue();
    assertThat(config.isStaging()).isFalse();
    assertThat(config.isDebugEnabled()).isTrue();
  }

  @Test
  void shouldIdentifyStagingEnvironment() {
    // Given
    EnvironmentConfig config =
        new EnvironmentConfig("staging", false, false, "1.0.0-RC1", "2024-01-01");

    // Then
    assertThat(config.isProduction()).isFalse();
    assertThat(config.isDevelopment()).isFalse();
    assertThat(config.isStaging()).isTrue();
    assertThat(config.isDebugEnabled()).isFalse();
  }

  @Test
  void shouldDisableDebugInProduction() {
    // Given
    EnvironmentConfig config =
        new EnvironmentConfig("production", true, true, "1.0.0", "2024-01-01");

    // Then
    assertThat(config.isDebugEnabled()).isFalse(); // Should be false even if debugEnabled is true
  }

  @Test
  void shouldRecognizeDevelopmentVariations() {
    // Given
    EnvironmentConfig devConfig =
        new EnvironmentConfig("development", false, true, "1.0.0", "2024-01-01");
    EnvironmentConfig devUpperConfig =
        new EnvironmentConfig("DEV", false, true, "1.0.0", "2024-01-01");

    // Then
    assertThat(devConfig.isDevelopment()).isTrue();
    assertThat(devUpperConfig.isDevelopment()).isTrue();
  }
}
