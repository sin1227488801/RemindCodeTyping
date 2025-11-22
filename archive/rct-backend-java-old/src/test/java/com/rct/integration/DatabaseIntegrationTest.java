package com.rct.integration;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Integration test to verify database connectivity and TestContainers setup. This test demonstrates
 * that our testing infrastructure is working correctly.
 */
@SpringBootTest
class DatabaseIntegrationTest extends BaseIntegrationTest {

  @Autowired private JdbcTemplate jdbcTemplate;

  @Test
  void shouldConnectToDatabase() {
    // Given - TestContainer PostgreSQL database is running

    // When - Execute a simple query
    Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

    // Then - Verify database connectivity
    assertThat(result).isEqualTo(1);
    assertThat(isDatabaseRunning()).isTrue();
  }

  @Test
  void shouldHaveCorrectDatabaseConfiguration() {
    // Given - Database is configured via TestContainers

    // When - Check database URL
    String databaseUrl = getDatabaseUrl();

    // Then - Verify it's using PostgreSQL TestContainer
    assertThat(databaseUrl).contains("postgresql");
    assertThat(databaseUrl).contains("test");
  }
}
