package com.rct;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;

/**
 * Test configuration for comprehensive unit test coverage. This configuration provides
 * test-specific beans and settings.
 */
@TestConfiguration
@ActiveProfiles("test")
public class TestCoverageConfiguration {

  /** Test clock for consistent time-based testing */
  @Bean
  public java.time.Clock testClock() {
    return java.time.Clock.fixed(
        java.time.Instant.parse("2024-01-01T00:00:00Z"), java.time.ZoneOffset.UTC);
  }
}
