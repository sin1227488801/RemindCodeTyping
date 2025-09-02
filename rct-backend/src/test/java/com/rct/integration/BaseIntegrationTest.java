package com.rct.integration;

import com.rct.config.TestConfig;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for integration tests using TestContainers. Provides a PostgreSQL database container
 * for testing database interactions.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@Import(TestConfig.class)
public abstract class BaseIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>("postgres:15-alpine")
          .withDatabaseName("rct_test")
          .withUsername("test_user")
          .withPassword("test_password")
          .withReuse(true);

  /**
   * Configures Spring properties to use the TestContainer database.
   *
   * @param registry The dynamic property registry
   */
  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");

    // Flyway configuration for test environment
    registry.add("spring.flyway.enabled", () -> "true");
    registry.add("spring.flyway.clean-disabled", () -> "false");

    // JPA configuration for tests
    registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    registry.add("spring.jpa.show-sql", () -> "false");
    registry.add("spring.jpa.properties.hibernate.format_sql", () -> "false");

    // Logging configuration for tests
    registry.add("logging.level.org.springframework.web", () -> "WARN");
    registry.add("logging.level.org.hibernate", () -> "WARN");
    registry.add("logging.level.com.rct", () -> "DEBUG");
  }

  /**
   * Setup method executed before each test. Override this method in subclasses to add specific
   * setup logic.
   */
  @BeforeEach
  void setUp() {
    // Base setup - can be overridden by subclasses
  }

  /**
   * Helper method to get the database JDBC URL for manual connections if needed.
   *
   * @return The JDBC URL of the test database
   */
  protected String getDatabaseUrl() {
    return postgres.getJdbcUrl();
  }

  /**
   * Helper method to check if the database container is running.
   *
   * @return true if the container is running, false otherwise
   */
  protected boolean isDatabaseRunning() {
    return postgres.isRunning();
  }
}
