package com.rct.config;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

/**
 * Test configuration providing beans for testing environment. This configuration ensures consistent
 * test behavior across different test scenarios.
 */
@TestConfiguration
@Profile("test")
public class TestConfig {

  /**
   * Provides a fixed clock for consistent time-based testing. This ensures that all time-dependent
   * operations in tests are predictable.
   *
   * @return A fixed clock set to 2024-01-01T00:00:00Z
   */
  @Bean
  @Primary
  public Clock testClock() {
    return Clock.fixed(Instant.parse("2024-01-01T00:00:00Z"), ZoneOffset.UTC);
  }
}
