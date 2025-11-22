package com.rct.infrastructure.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Environment-specific configuration properties. */
@ConfigurationProperties(prefix = "app.environment")
@Validated
@Slf4j
public record EnvironmentConfig(
    @NotBlank String name,
    @NotNull Boolean production,
    @NotNull Boolean debugEnabled,
    String version,
    String buildTimestamp) {

  /** Checks if the current environment is production. */
  public boolean isProduction() {
    return Boolean.TRUE.equals(production);
  }

  /** Checks if the current environment is development. */
  public boolean isDevelopment() {
    return "dev".equalsIgnoreCase(name) || "development".equalsIgnoreCase(name);
  }

  /** Checks if the current environment is staging. */
  public boolean isStaging() {
    return "staging".equalsIgnoreCase(name) || "stage".equalsIgnoreCase(name);
  }

  /** Checks if debug mode is enabled. */
  public boolean isDebugEnabled() {
    return Boolean.TRUE.equals(debugEnabled);
  }

  /** Gets the environment name in a safe format for logging. */
  public String getName() {
    return name != null ? name : "unknown";
  }

  /** Validates environment configuration consistency. */
  public void validateConfiguration() {
    log.info("Validating environment configuration for: {}", getName());

    // Production environment validations
    if (isProduction()) {
      if (isDebugEnabled()) {
        throw new IllegalStateException("Debug mode must be disabled in production");
      }

      if (isDevelopment()) {
        throw new IllegalStateException("Environment cannot be both production and development");
      }

      log.info("Production environment validation passed");
    }

    // Development environment validations
    if (isDevelopment()) {
      if (isProduction()) {
        throw new IllegalStateException("Environment cannot be both development and production");
      }

      log.info("Development environment validation passed");
    }

    // Staging environment validations
    if (isStaging()) {
      if (isDebugEnabled()) {
        log.warn(
            "Debug mode is enabled in staging environment - consider disabling for production-like testing");
      }

      log.info("Staging environment validation passed");
    }

    log.info("Environment configuration validation completed successfully");
  }

  /** Gets a description of the current environment. */
  public String getDescription() {
    StringBuilder desc = new StringBuilder();
    desc.append("Environment: ").append(getName());

    if (isProduction()) {
      desc.append(" (Production)");
    } else if (isDevelopment()) {
      desc.append(" (Development)");
    } else if (isStaging()) {
      desc.append(" (Staging)");
    }

    if (isDebugEnabled()) {
      desc.append(" [Debug Enabled]");
    }

    if (version != null && !version.isEmpty()) {
      desc.append(" v").append(version);
    }

    return desc.toString();
  }
}
