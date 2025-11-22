package com.rct.infrastructure.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

/**
 * Profile-specific configuration and validation. Ensures proper environment setup and warns about
 * potential issues.
 */
@Configuration
public class ProfileConfig {

  private static final Logger logger = LoggerFactory.getLogger(ProfileConfig.class);

  private final Environment environment;
  private final EnvironmentConfig environmentConfig;

  public ProfileConfig(Environment environment, EnvironmentConfig environmentConfig) {
    this.environment = environment;
    this.environmentConfig = environmentConfig;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void logActiveProfiles() {
    String[] activeProfiles = environment.getActiveProfiles();
    String[] defaultProfiles = environment.getDefaultProfiles();

    logger.info("Active profiles: {}", String.join(", ", activeProfiles));
    logger.info("Default profiles: {}", String.join(", ", defaultProfiles));
    logger.info("Environment name: {}", environmentConfig.name());

    validateProfileConsistency(activeProfiles);
  }

  private void validateProfileConsistency(String[] activeProfiles) {
    // Warn about potentially problematic profile combinations
    boolean hasDevProfile = containsProfile(activeProfiles, "dev");
    boolean hasProdProfile =
        containsProfile(activeProfiles, "azure") || containsProfile(activeProfiles, "prod");

    if (hasDevProfile && hasProdProfile) {
      logger.warn(
          "Both development and production profiles are active. This may cause configuration conflicts.");
    }

    if (environmentConfig.isProduction() && hasDevProfile) {
      logger.warn(
          "Development profile is active in production environment. This may expose sensitive information.");
    }

    if (!environmentConfig.isProduction() && !hasDevProfile && activeProfiles.length == 0) {
      logger.info("No specific profile active. Using default configuration.");
    }
  }

  private boolean containsProfile(String[] profiles, String profile) {
    for (String p : profiles) {
      if (profile.equalsIgnoreCase(p)) {
        return true;
      }
    }
    return false;
  }

  /** Development-specific configuration. */
  @Configuration
  @Profile({"dev", "development"})
  static class DevelopmentConfig {

    @EventListener(ApplicationReadyEvent.class)
    public void logDevelopmentWarnings() {
      logger.info("=== DEVELOPMENT MODE ACTIVE ===");
      logger.info("- H2 console may be enabled");
      logger.info("- Debug logging is active");
      logger.info("- CORS is permissive");
      logger.info("- Default secrets may be in use");
      logger.info("===============================");
    }
  }

  /** Production-specific configuration. */
  @Configuration
  @Profile({"azure", "prod", "production"})
  static class ProductionConfig {

    @EventListener(ApplicationReadyEvent.class)
    public void logProductionWarnings() {
      logger.info("=== PRODUCTION MODE ACTIVE ===");
      logger.info("- All secrets must be externalized");
      logger.info("- Debug features are disabled");
      logger.info("- Security is enforced");
      logger.info("- Performance optimizations active");
      logger.info("==============================");
    }
  }

  /** Staging-specific configuration. */
  @Configuration
  @Profile("staging")
  static class StagingConfig {

    @EventListener(ApplicationReadyEvent.class)
    public void logStagingInfo() {
      logger.info("=== STAGING MODE ACTIVE ===");
      logger.info("- Production-like configuration");
      logger.info("- Enhanced logging for testing");
      logger.info("- Performance monitoring active");
      logger.info("===========================");
    }
  }
}
