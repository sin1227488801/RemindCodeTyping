package com.rct.integration;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.test.context.TestPropertySource;

/**
 * Test configuration for integration tests. Provides test-specific beans and configurations to
 * ensure consistent test behavior.
 */
@TestConfiguration
@TestPropertySource(
    properties = {
      "spring.jpa.show-sql=false",
      "spring.jpa.properties.hibernate.format_sql=false",
      "logging.level.org.springframework.web=WARN",
      "logging.level.org.hibernate=WARN",
      "logging.level.com.rct=DEBUG",
      "spring.flyway.clean-disabled=false"
    })
public class IntegrationTestConfiguration {

  /**
   * Provides a fixed clock for consistent test behavior. This ensures that time-dependent tests
   * produce predictable results.
   */
  @Bean
  @Primary
  @Profile("test")
  public Clock testClock() {
    return Clock.fixed(Instant.parse("2024-01-01T12:00:00Z"), ZoneOffset.UTC);
  }
}
