package com.rct.infrastructure.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Main application configuration properties following 12-Factor principles. All configuration
 * values are externalized and validated.
 */
@ConfigurationProperties(prefix = "app")
@Validated
public record ApplicationProperties(
    @Valid @NotNull EnvironmentProperties environment,
    @Valid @NotNull JwtProperties jwt,
    @Valid @NotNull CorsProperties cors,
    @Valid @NotNull SecurityProperties security,
    @Valid @NotNull DatabaseProperties database) {

  /** Environment configuration properties. */
  public record EnvironmentProperties(
      @NotBlank String name,
      @NotNull Boolean production,
      @NotNull Boolean debugEnabled,
      String version,
      String buildTimestamp) {

    /** Checks if the current environment is production. */
    public boolean isProduction() {
      return Boolean.TRUE.equals(production);
    }

    /** Checks if debug mode is enabled. */
    public boolean isDebugEnabled() {
      return Boolean.TRUE.equals(debugEnabled);
    }
  }

  /** JWT token configuration properties. */
  public record JwtProperties(
      @NotBlank String secret,
      @NotNull Duration expiration,
      @NotNull Duration refreshExpiration,
      @NotBlank String issuer,
      @NotBlank String audience) {}

  /** CORS configuration properties. */
  public record CorsProperties(
      @NotNull List<String> allowedOrigins,
      @NotNull List<String> allowedMethods,
      @NotNull List<String> allowedHeaders,
      boolean allowCredentials,
      @NotNull Duration maxAge) {}

  /** Security configuration properties. */
  public record SecurityProperties(
      @Positive int passwordMinLength,
      @Positive int passwordMaxLength,
      @Positive int maxLoginAttempts,
      @NotNull Duration lockoutDuration,
      boolean requireStrongPassword) {}

  /** Database configuration properties. */
  public record DatabaseProperties(
      @Positive int connectionPoolSize,
      @NotNull Duration connectionTimeout,
      @NotNull Duration idleTimeout,
      @NotNull Duration maxLifetime,
      boolean showSql) {}
}
