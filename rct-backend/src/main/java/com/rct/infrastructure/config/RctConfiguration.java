package com.rct.infrastructure.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * Main configuration class that enables all application configuration properties and imports
 * necessary configuration classes.
 */
@Configuration
@EnableConfigurationProperties({ApplicationProperties.class, EnvironmentConfig.class})
@Import({
  DatabaseConfig.class,
  ProfileConfig.class,
  ConfigurationValidator.class,
  SecretManager.class
})
public class RctConfiguration {
  // This class serves as a central configuration registry
  // All configuration-related beans are imported here
}
