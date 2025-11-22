package com.rct.infrastructure.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Validates application configuration at startup to ensure security and consistency. */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConfigurationValidator {

  private final ApplicationProperties applicationProperties;
  private final EnvironmentConfig environmentConfig;
  private final SecretManager secretManager;

  /** Validates configuration when the application is ready. */
  @EventListener(ApplicationReadyEvent.class)
  public void validateConfiguration() {
    log.info("Starting configuration validation for environment: {}", environmentConfig.getName());

    try {
      // Validate environment configuration
      validateEnvironmentConfiguration();

      // Validate JWT configuration
      validateJwtConfiguration();

      // Validate security configuration
      validateSecurityConfiguration();

      // Validate database configuration
      validateDatabaseConfiguration();

      // Validate CORS configuration
      validateCorsConfiguration();

      // Validate secrets
      secretManager.validateRequiredSecrets();

      log.info("Configuration validation completed successfully");
      log.info("Application started with configuration: {}", environmentConfig.getDescription());

    } catch (Exception e) {
      log.error("Configuration validation failed: {}", e.getMessage());
      throw new IllegalStateException("Invalid application configuration", e);
    }
  }

  /** Validates environment-specific configuration. */
  private void validateEnvironmentConfiguration() {
    log.debug("Validating environment configuration");

    environmentConfig.validateConfiguration();

    // Additional environment validations
    if (environmentConfig.isProduction()) {
      validateProductionConfiguration();
    }
  }

  /** Validates JWT configuration. */
  private void validateJwtConfiguration() {
    log.debug("Validating JWT configuration");

    var jwtConfig = applicationProperties.jwt();

    // Validate JWT secret
    if (jwtConfig.secret() == null || jwtConfig.secret().trim().isEmpty()) {
      throw new IllegalStateException("JWT secret is required");
    }

    // Production JWT secret validation
    if (environmentConfig.isProduction()) {
      if (jwtConfig.secret().length() < 32) {
        throw new IllegalStateException(
            "JWT secret must be at least 32 characters long in production");
      }

      // Check for weak secrets
      String lowerSecret = jwtConfig.secret().toLowerCase();
      if (lowerSecret.contains("secret")
          || lowerSecret.contains("key")
          || lowerSecret.contains("password")
          || lowerSecret.equals("changeme")) {
        throw new IllegalStateException(
            "JWT secret appears to be a default or weak value in production");
      }
    }

    // Validate JWT expiration
    if (jwtConfig.expiration() == null || jwtConfig.expiration().isNegative()) {
      throw new IllegalStateException("JWT expiration must be positive");
    }

    // Validate refresh token expiration
    if (jwtConfig.refreshExpiration() == null || jwtConfig.refreshExpiration().isNegative()) {
      throw new IllegalStateException("JWT refresh expiration must be positive");
    }

    // Validate issuer and audience
    if (jwtConfig.issuer() == null || jwtConfig.issuer().trim().isEmpty()) {
      throw new IllegalStateException("JWT issuer is required");
    }

    if (jwtConfig.audience() == null || jwtConfig.audience().trim().isEmpty()) {
      throw new IllegalStateException("JWT audience is required");
    }

    log.debug("JWT configuration validation passed");
  }

  /** Validates security configuration. */
  private void validateSecurityConfiguration() {
    log.debug("Validating security configuration");

    var securityConfig = applicationProperties.security();

    // Validate password policy
    if (securityConfig.passwordMinLength() < 8) {
      throw new IllegalStateException("Minimum password length must be at least 8 characters");
    }

    if (securityConfig.passwordMaxLength() < securityConfig.passwordMinLength()) {
      throw new IllegalStateException(
          "Maximum password length must be greater than minimum length");
    }

    // Validate login attempt limits
    if (securityConfig.maxLoginAttempts() < 1) {
      throw new IllegalStateException("Maximum login attempts must be at least 1");
    }

    if (securityConfig.lockoutDuration() == null || securityConfig.lockoutDuration().isNegative()) {
      throw new IllegalStateException("Lockout duration must be positive");
    }

    // Production security validations
    if (environmentConfig.isProduction()) {
      if (!securityConfig.requireStrongPassword()) {
        log.warn("Strong password requirement is disabled in production");
      }

      if (securityConfig.maxLoginAttempts() > 10) {
        log.warn(
            "Maximum login attempts is high for production: {}", securityConfig.maxLoginAttempts());
      }
    }

    log.debug("Security configuration validation passed");
  }

  /** Validates database configuration. */
  private void validateDatabaseConfiguration() {
    log.debug("Validating database configuration");

    var dbConfig = applicationProperties.database();

    // Validate connection pool settings
    if (dbConfig.connectionPoolSize() < 1) {
      throw new IllegalStateException("Database connection pool size must be at least 1");
    }

    if (dbConfig.connectionTimeout() == null || dbConfig.connectionTimeout().isNegative()) {
      throw new IllegalStateException("Database connection timeout must be positive");
    }

    if (dbConfig.idleTimeout() == null || dbConfig.idleTimeout().isNegative()) {
      throw new IllegalStateException("Database idle timeout must be positive");
    }

    if (dbConfig.maxLifetime() == null || dbConfig.maxLifetime().isNegative()) {
      throw new IllegalStateException("Database max lifetime must be positive");
    }

    // Production database validations
    if (environmentConfig.isProduction()) {
      if (dbConfig.showSql()) {
        log.warn("SQL logging is enabled in production - consider disabling for performance");
      }

      if (dbConfig.connectionPoolSize() < 5) {
        log.warn(
            "Database connection pool size is low for production: {}",
            dbConfig.connectionPoolSize());
      }
    }

    log.debug("Database configuration validation passed");
  }

  /** Validates CORS configuration. */
  private void validateCorsConfiguration() {
    log.debug("Validating CORS configuration");

    var corsConfig = applicationProperties.cors();

    // Validate allowed origins
    if (corsConfig.allowedOrigins() == null || corsConfig.allowedOrigins().isEmpty()) {
      throw new IllegalStateException("CORS allowed origins must be specified");
    }

    // Production CORS validations
    if (environmentConfig.isProduction()) {
      for (String origin : corsConfig.allowedOrigins()) {
        if ("*".equals(origin)) {
          throw new IllegalStateException("Wildcard CORS origin (*) is not allowed in production");
        }

        if (origin.contains("localhost") || origin.contains("127.0.0.1")) {
          log.warn("Localhost origin found in production CORS configuration: {}", origin);
        }
      }

      if (corsConfig.allowCredentials()) {
        log.info("CORS credentials are allowed in production");
      }
    }

    log.debug("CORS configuration validation passed");
  }

  /** Validates production-specific configuration requirements. */
  private void validateProductionConfiguration() {
    log.debug("Validating production-specific configuration");

    // Ensure debug mode is disabled
    if (environmentConfig.isDebugEnabled()) {
      throw new IllegalStateException("Debug mode must be disabled in production");
    }

    // Additional production validations can be added here
    log.debug("Production configuration validation passed");
  }
}
