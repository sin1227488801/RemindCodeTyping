package com.rct.migration;

import static org.assertj.core.api.Assertions.assertThat;

import com.rct.infrastructure.persistence.BaseRepositoryIntegrationTest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlGroup;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for data migration scripts Tests migration from legacy schema to new normalized
 * schema Requirements: 10.2
 */
@SpringBootTest
@Transactional
class DataMigrationTest extends BaseRepositoryIntegrationTest {

  @BeforeEach
  void setUp() {
    // Clean up any existing data
    jdbcTemplate.execute("DROP TABLE IF EXISTS users CASCADE");
    jdbcTemplate.execute("DROP TABLE IF EXISTS user_login_statistics CASCADE");
    jdbcTemplate.execute("DROP TABLE IF EXISTS study_books CASCADE");
    jdbcTemplate.execute("DROP TABLE IF EXISTS typing_sessions CASCADE");
    jdbcTemplate.execute("DROP VIEW IF EXISTS login_info CASCADE");
    jdbcTemplate.execute("DROP VIEW IF EXISTS study_book CASCADE");
    jdbcTemplate.execute("DROP VIEW IF EXISTS typing_log CASCADE");
  }

  @Test
  @DisplayName("Should migrate user data from login_info to users and user_login_statistics")
  @SqlGroup({
    @Sql("/test-data/migration/legacy-schema-setup.sql"),
    @Sql("/test-data/migration/sample-user-data.sql")
  })
  void shouldMigrateUserDataSuccessfully() {
    // Execute migration
    executeMigrationScript("/db/migration/scripts/data-migration-master.sql");

    // Verify users table
    List<Map<String, Object>> users =
        jdbcTemplate.queryForList("SELECT * FROM users ORDER BY login_id");
    assertThat(users).hasSize(3);

    Map<String, Object> user1 = users.get(0);
    assertThat(user1.get("login_id")).isEqualTo("testuser1");
    assertThat(user1.get("password_hash")).isNotNull();
    assertThat(user1.get("created_at")).isNotNull();

    // Verify user_login_statistics table
    List<Map<String, Object>> stats =
        jdbcTemplate.queryForList(
            "SELECT * FROM user_login_statistics ORDER BY consecutive_login_days DESC");
    assertThat(stats).hasSize(3);

    Map<String, Object> stat1 = stats.get(0);
    assertThat(stat1.get("consecutive_login_days")).isEqualTo(15);
    assertThat(stat1.get("max_consecutive_login_days")).isEqualTo(20);
    assertThat(stat1.get("total_login_days")).isEqualTo(45);
  }

  @Test
  @DisplayName("Should migrate study book data with proper constraints")
  @SqlGroup({
    @Sql("/test-data/migration/legacy-schema-setup.sql"),
    @Sql("/test-data/migration/sample-studybook-data.sql")
  })
  void shouldMigrateStudyBookDataSuccessfully() {
    // Execute migration
    executeMigrationScript("/db/migration/scripts/data-migration-master.sql");

    // Verify study_books table
    List<Map<String, Object>> studyBooks =
        jdbcTemplate.queryForList("SELECT * FROM study_books ORDER BY language, question");
    assertThat(studyBooks).hasSize(5);

    // Verify system problems
    List<Map<String, Object>> systemProblems =
        jdbcTemplate.queryForList("SELECT * FROM study_books WHERE is_system_problem = true");
    assertThat(systemProblems).hasSize(2);

    // Verify user problems
    List<Map<String, Object>> userProblems =
        jdbcTemplate.queryForList(
            "SELECT * FROM study_books WHERE is_system_problem = false AND user_id IS NOT NULL");
    assertThat(userProblems).hasSize(3);

    // Verify foreign key relationships
    Long orphanedBooks =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM study_books sb WHERE sb.user_id IS NOT NULL AND sb.user_id NOT IN (SELECT id FROM users)",
            Long.class);
    assertThat(orphanedBooks).isEqualTo(0);
  }

  @Test
  @DisplayName("Should migrate typing session data with calculated accuracy")
  @SqlGroup({
    @Sql("/test-data/migration/legacy-schema-setup.sql"),
    @Sql("/test-data/migration/sample-typing-data.sql")
  })
  void shouldMigrateTypingSessionDataSuccessfully() {
    // Execute migration
    executeMigrationScript("/db/migration/scripts/data-migration-master.sql");

    // Verify typing_sessions table
    List<Map<String, Object>> sessions =
        jdbcTemplate.queryForList("SELECT * FROM typing_sessions ORDER BY started_at");
    assertThat(sessions).hasSize(10);

    // Verify accuracy calculations
    Map<String, Object> perfectSession =
        jdbcTemplate.queryForMap(
            "SELECT * FROM typing_sessions WHERE total_characters = correct_characters LIMIT 1");
    BigDecimal accuracy = (BigDecimal) perfectSession.get("accuracy");
    assertThat(accuracy).isEqualByComparingTo(BigDecimal.valueOf(100.00));

    // Verify partial accuracy
    Map<String, Object> partialSession =
        jdbcTemplate.queryForMap(
            "SELECT * FROM typing_sessions WHERE total_characters = 100 AND correct_characters = 85 LIMIT 1");
    BigDecimal partialAccuracy = (BigDecimal) partialSession.get("accuracy");
    assertThat(partialAccuracy).isEqualByComparingTo(BigDecimal.valueOf(85.00));

    // Verify no orphaned sessions
    Long orphanedUserSessions =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM typing_sessions ts WHERE ts.user_id NOT IN (SELECT id FROM users)",
            Long.class);
    assertThat(orphanedUserSessions).isEqualTo(0);

    Long orphanedBookSessions =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM typing_sessions ts WHERE ts.study_book_id NOT IN (SELECT id FROM study_books)",
            Long.class);
    assertThat(orphanedBookSessions).isEqualTo(0);
  }

  @Test
  @DisplayName("Should handle data cleansing during migration")
  @SqlGroup({
    @Sql("/test-data/migration/legacy-schema-setup.sql"),
    @Sql("/test-data/migration/dirty-data-samples.sql")
  })
  void shouldHandleDataCleansingDuringMigration() {
    // Execute migration
    executeMigrationScript("/db/migration/scripts/data-migration-master.sql");

    // Verify invalid users are removed
    Long usersWithEmptyLoginId =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE login_id IS NULL OR login_id = ''", Long.class);
    assertThat(usersWithEmptyLoginId).isEqualTo(0);

    // Verify invalid study books are removed
    Long studyBooksWithEmptyLanguage =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM study_books WHERE language IS NULL OR language = ''", Long.class);
    assertThat(studyBooksWithEmptyLanguage).isEqualTo(0);

    // Verify character counts are corrected
    Long invalidCharacterCounts =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM typing_sessions WHERE correct_characters > total_characters",
            Long.class);
    assertThat(invalidCharacterCounts).isEqualTo(0);

    // Verify negative values are corrected
    Long negativeValues =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM typing_sessions WHERE total_characters < 0 OR correct_characters < 0",
            Long.class);
    assertThat(negativeValues).isEqualTo(0);
  }

  @Test
  @DisplayName("Should create proper indexes for performance")
  @SqlGroup({
    @Sql("/test-data/migration/legacy-schema-setup.sql"),
    @Sql("/test-data/migration/sample-user-data.sql")
  })
  void shouldCreateProperIndexesForPerformance() {
    // Execute migration
    executeMigrationScript("/db/migration/scripts/data-migration-master.sql");

    // Verify critical indexes exist
    assertIndexExists("users", "idx_users_login_id");
    assertIndexExists("study_books", "idx_study_books_user_language");
    assertIndexExists("typing_sessions", "idx_typing_sessions_user_date");
    assertIndexExists("typing_sessions", "idx_typing_sessions_accuracy");

    // Test query performance with indexes
    long startTime = System.currentTimeMillis();
    jdbcTemplate.queryForList(
        "SELECT u.login_id, COUNT(ts.id) as session_count "
            + "FROM users u LEFT JOIN typing_sessions ts ON u.id = ts.user_id "
            + "GROUP BY u.id, u.login_id ORDER BY session_count DESC LIMIT 10");
    long queryTime = System.currentTimeMillis() - startTime;

    // Query should be fast with proper indexes (under 100ms for test data)
    assertThat(queryTime).isLessThan(100);
  }

  @Test
  @DisplayName("Should maintain data integrity constraints")
  @SqlGroup({
    @Sql("/test-data/migration/legacy-schema-setup.sql"),
    @Sql("/test-data/migration/sample-user-data.sql")
  })
  void shouldMaintainDataIntegrityConstraints() {
    // Execute migration
    executeMigrationScript("/db/migration/scripts/data-migration-master.sql");

    // Test foreign key constraints
    assertThatThrownBy(
            () -> {
              jdbcTemplate.update(
                  "INSERT INTO user_login_statistics (user_id, consecutive_login_days) VALUES (?, 5)",
                  UUID.randomUUID());
            })
        .hasMessageContaining("foreign key constraint");

    assertThatThrownBy(
            () -> {
              jdbcTemplate.update(
                  "INSERT INTO study_books (id, user_id, language, question) VALUES (?, ?, 'Java', 'Test')",
                  UUID.randomUUID(),
                  UUID.randomUUID());
            })
        .hasMessageContaining("foreign key constraint");

    // Test check constraints
    assertThatThrownBy(
            () -> {
              jdbcTemplate.update(
                  "INSERT INTO study_books (id, language, question, difficulty_level) VALUES (?, 'Java', 'Test', 10)",
                  UUID.randomUUID());
            })
        .hasMessageContaining("check constraint");
  }

  @Test
  @DisplayName("Should create backward compatibility views")
  @SqlGroup({
    @Sql("/test-data/migration/legacy-schema-setup.sql"),
    @Sql("/test-data/migration/sample-user-data.sql")
  })
  void shouldCreateBackwardCompatibilityViews() {
    // Execute migration
    executeMigrationScript("/db/migration/scripts/data-migration-master.sql");

    // Verify views exist and return data
    List<Map<String, Object>> loginInfoView = jdbcTemplate.queryForList("SELECT * FROM login_info");
    assertThat(loginInfoView).isNotEmpty();

    List<Map<String, Object>> studyBookView = jdbcTemplate.queryForList("SELECT * FROM study_book");
    assertThat(studyBookView).isNotEmpty();

    List<Map<String, Object>> typingLogView = jdbcTemplate.queryForList("SELECT * FROM typing_log");
    assertThat(typingLogView).isNotEmpty();

    // Verify view data matches new table data
    Long userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Long.class);
    Long loginInfoCount =
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM login_info", Long.class);
    assertThat(userCount).isEqualTo(loginInfoCount);
  }

  @Test
  @DisplayName("Should handle large dataset migration performance")
  @SqlGroup({
    @Sql("/test-data/migration/legacy-schema-setup.sql"),
    @Sql("/test-data/migration/large-dataset-sample.sql")
  })
  void shouldHandleLargeDatasetMigrationPerformance() {
    // Execute migration and measure time
    long startTime = System.currentTimeMillis();
    executeMigrationScript("/db/migration/scripts/data-migration-master.sql");
    long migrationTime = System.currentTimeMillis() - startTime;

    // Migration should complete within reasonable time (under 30 seconds for test data)
    assertThat(migrationTime).isLessThan(30000);

    // Verify all data was migrated
    Long originalUserCount =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM login_info_backup_" + getCurrentBackupSuffix(), Long.class);
    Long migratedUserCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Long.class);
    assertThat(migratedUserCount).isEqualTo(originalUserCount);
  }

  private void executeMigrationScript(String scriptPath) {
    try {
      String script = loadResourceAsString(scriptPath);
      jdbcTemplate.execute(script);
    } catch (Exception e) {
      throw new RuntimeException("Failed to execute migration script: " + scriptPath, e);
    }
  }

  private void assertIndexExists(String tableName, String indexName) {
    Long indexCount =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM pg_indexes WHERE tablename = ? AND indexname = ?",
            Long.class,
            tableName,
            indexName);
    assertThat(indexCount).isEqualTo(1);
  }

  private String getCurrentBackupSuffix() {
    // This would need to be implemented to get the actual backup suffix
    // For testing purposes, we'll use a fixed suffix
    return "backup_20240101_000000";
  }

  private String loadResourceAsString(String resourcePath) {
    // Implementation to load SQL script from resources
    // This would use Spring's ResourceLoader or similar
    return "-- Migration script content would be loaded here";
  }
}
