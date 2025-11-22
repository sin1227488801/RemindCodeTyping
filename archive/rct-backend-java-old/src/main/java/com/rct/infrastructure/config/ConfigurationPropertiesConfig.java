package com.rct.infrastructure.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Configuration class to enable configuration properties binding. */
@Configuration
@EnableConfigurationProperties({ApplicationProperties.class, EnvironmentConfig.class})
public class ConfigurationPropertiesConfig {
  // Configuration properties are automatically bound by Spring Boot
}
