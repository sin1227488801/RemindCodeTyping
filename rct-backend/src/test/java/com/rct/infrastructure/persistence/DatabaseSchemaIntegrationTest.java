package com.rct.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for database schema migration and optimization.
 *
 * <p>This test class verifies:
 *
 * <ul>
 *   <li>Schema normalization is correctly applied
 *   <li>Performance indexes are created
 *   <li>Data integrity constraints are enforced
 *   <li>Query performance is optimized
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DatabaseSchemaIntegrationTest {

  @Autowired private DataSource dataSource;

  @Test
  @DisplayName("Should have normalized users table with correct structure")
  void shouldHaveNormalizedUsersTable() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      DatabaseMetaData metaData = connection.getMetaData();

      // Verify users table exists
      try (ResultSet tables = metaData.getTables(null, null, "USERS", new String[] {"TABLE"})) {
        assertThat(tables.next()).isTrue();
      }

      // Verify users table columns
      Set<String> expectedColumns =
          Set.of("ID", "LOGIN_ID", "PASSWORD_HASH", "CREATED_AT", "UPDATED_AT");
      Set<String> actualColumns = getTableColumns(metaData, "USERS");
      assertThat(actualColumns).containsAll(expectedColumns);

      // Verify primary key
      try (ResultSet primaryKeys = metaData.getPrimaryKeys(null, null, "USERS")) {
        assertThat(primaryKeys.next()).isTrue();
        assertThat(primaryKeys.getString("COLUMN_NAME")).isEqualTo("ID");
      }

      // Verify unique constraint on login_id
      try (ResultSet indexes = metaData.getIndexInfo(null, null, "USERS", true, false)) {
        boolean hasLoginIdIndex = false;
        while (indexes.next()) {
          if ("LOGIN_ID".equals(indexes.getString("COLUMN_NAME"))) {
            hasLoginIdIndex = true;
            break;
          }
        }
        assertThat(hasLoginIdIndex).isTrue();
      }
    }
  }

  @Test
  @DisplayName("Should have separate user_login_statistics table")
  void shouldHaveUserLoginStatisticsTable() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      DatabaseMetaData metaData = connection.getMetaData();

      // Verify user_login_statistics table exists
      try (ResultSet tables =
          metaData.getTables(null, null, "USER_LOGIN_STATISTICS", new String[] {"TABLE"})) {
        assertThat(tables.next()).isTrue();
      }

      // Verify columns
      Set<String> expectedColumns =
          Set.of(
              "USER_ID",
              "LAST_LOGIN_DATE",
              "CONSECUTIVE_LOGIN_DAYS",
              "MAX_CONSECUTIVE_LOGIN_DAYS",
              "TOTAL_LOGIN_DAYS",
              "UPDATED_AT");
      Set<String> actualColumns = getTableColumns(metaData, "USER_LOGIN_STATISTICS");
      assertThat(actualColumns).containsAll(expectedColumns);

      // Verify foreign key relationship
      try (ResultSet foreignKeys = metaData.getImportedKeys(null, null, "USER_LOGIN_STATISTICS")) {
        assertThat(foreignKeys.next()).isTrue();
        assertThat(foreignKeys.getString("FKCOLUMN_NAME")).isEqualTo("USER_ID");
        assertThat(foreignKeys.getString("PKTABLE_NAME")).isEqualTo("USERS");
      }
    }
  }

  @Test
  @DisplayName("Should have improved study_books table with constraints")
  void shouldHaveImprovedStudyBooksTable() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      DatabaseMetaData metaData = connection.getMetaData();

      // Verify study_books table exists
      try (ResultSet tables =
          metaData.getTables(null, null, "STUDY_BOOKS", new String[] {"TABLE"})) {
        assertThat(tables.next()).isTrue();
      }

      // Verify columns
      Set<String> expectedColumns =
          Set.of(
              "ID",
              "USER_ID",
              "LANGUAGE",
              "QUESTION",
              "EXPLANATION",
              "IS_SYSTEM_PROBLEM",
              "DIFFICULTY_LEVEL",
              "CREATED_BY",
              "CREATED_AT",
              "UPDATED_AT");
      Set<String> actualColumns = getTableColumns(metaData, "STUDY_BOOKS");
      assertThat(actualColumns).containsAll(expectedColumns);
    }
  }

  @Test
  @DisplayName("Should have optimized typing_sessions table")
  void shouldHaveOptimizedTypingSessionsTable() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      DatabaseMetaData metaData = connection.getMetaData();

      // Verify typing_sessions table exists
      try (ResultSet tables =
          metaData.getTables(null, null, "TYPING_SESSIONS", new String[] {"TABLE"})) {
        assertThat(tables.next()).isTrue();
      }

      // Verify columns
      Set<String> expectedColumns =
          Set.of(
              "ID",
              "USER_ID",
              "STUDY_BOOK_ID",
              "STARTED_AT",
              "COMPLETED_AT",
              "DURATION_MS",
              "TOTAL_CHARACTERS",
              "CORRECT_CHARACTERS",
              "ACCURACY",
              "CREATED_AT");
      Set<String> actualColumns = getTableColumns(metaData, "TYPING_SESSIONS");
      assertThat(actualColumns).containsAll(expectedColumns);
    }
  }

  @Test
  @DisplayName("Should have performance indexes created")
  void shouldHavePerformanceIndexes() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      DatabaseMetaData metaData = connection.getMetaData();

      // Check for key indexes
      List<String> expectedIndexes =
          List.of(
              "IDX_USERS_LOGIN_ID",
              "IDX_STUDY_BOOKS_LANGUAGE",
              "IDX_TYPING_SESSIONS_USER_DATE",
              "IDX_TYPING_SESSIONS_ACCURACY");

      for (String expectedIndex : expectedIndexes) {
        boolean indexExists = checkIndexExists(metaData, expectedIndex);
        assertThat(indexExists)
            .as("Index %s should exist for performance optimization", expectedIndex)
            .isTrue();
      }
    }
  }

  @Test
  @DisplayName("Should maintain data integrity with constraints")
  void shouldMaintainDataIntegrityWithConstraints() throws SQLException {
    try (Connection connection = dataSource.getConnection();
        Statement statement = connection.createStatement()) {

      // Test that we can insert valid data
      UUID userId = UUID.randomUUID();
      UUID studyBookId = UUID.randomUUID();

      assertDoesNotThrow(
          () -> {
            statement.executeUpdate(
                String.format(
                    "INSERT INTO users (id, login_id, password_hash) VALUES ('%s', 'testuser', 'hashedpassword')",
                    userId));

            statement.executeUpdate(
                String.format(
                    "INSERT INTO study_books (id, user_id, language, question, difficulty_level) VALUES ('%s', '%s', 'Java', 'Test question', 3)",
                    studyBookId, userId));

            statement.executeUpdate(
                String.format(
                    "INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, total_characters, correct_characters) VALUES ('%s', '%s', '%s', CURRENT_TIMESTAMP, 100, 95)",
                    UUID.randomUUID(), userId, studyBookId));
          });

      // Verify accuracy is calculated correctly
      try (ResultSet result =
          statement.executeQuery(
              "SELECT accuracy FROM typing_sessions WHERE total_characters = 100 AND correct_characters = 95")) {
        assertThat(result.next()).isTrue();
        double accuracy = result.getDouble("accuracy");
        assertThat(accuracy).isEqualTo(95.0);
      }
    }
  }

  @Test
  @DisplayName("Should support backward compatibility views")
  void shouldSupportBackwardCompatibilityViews() throws SQLException {
    try (Connection connection = dataSource.getConnection();
        Statement statement = connection.createStatement()) {

      // Insert test data
      UUID userId = UUID.randomUUID();
      statement.executeUpdate(
          String.format(
              "INSERT INTO users (id, login_id, password_hash) VALUES ('%s', 'testuser', 'hashedpassword')",
              userId));

      statement.executeUpdate(
          String.format(
              "INSERT INTO user_login_statistics (user_id, consecutive_login_days, total_login_days) VALUES ('%s', 5, 10)",
              userId));

      // Test login_info view
      try (ResultSet result =
          statement.executeQuery(
              String.format("SELECT * FROM login_info WHERE id = '%s'", userId))) {
        assertThat(result.next()).isTrue();
        assertThat(result.getString("login_id")).isEqualTo("testuser");
        assertThat(result.getInt("last_login_days")).isEqualTo(5);
        assertThat(result.getInt("total_login_days")).isEqualTo(10);
      }
    }
  }

  @Test
  @DisplayName("Should optimize query performance with indexes")
  void shouldOptimizeQueryPerformanceWithIndexes() throws SQLException {
    try (Connection connection = dataSource.getConnection();
        Statement statement = connection.createStatement()) {

      // Insert test data for performance testing
      UUID userId = UUID.randomUUID();
      statement.executeUpdate(
          String.format(
              "INSERT INTO users (id, login_id, password_hash) VALUES ('%s', 'perfuser', 'hashedpassword')",
              userId));

      // Insert multiple study books
      for (int i = 0; i < 10; i++) {
        UUID studyBookId = UUID.randomUUID();
        statement.executeUpdate(
            String.format(
                "INSERT INTO study_books (id, user_id, language, question) VALUES ('%s', '%s', 'Java', 'Question %d')",
                studyBookId, userId, i));

        // Insert typing sessions
        for (int j = 0; j < 5; j++) {
          statement.executeUpdate(
              String.format(
                  "INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, total_characters, correct_characters) VALUES ('%s', '%s', '%s', CURRENT_TIMESTAMP, %d, %d)",
                  UUID.randomUUID(), userId, studyBookId, 100 + j, 90 + j));
        }
      }

      // Test common queries that should benefit from indexes
      long startTime = System.currentTimeMillis();

      // Query by user and language (should use idx_study_books_user_language)
      try (ResultSet result =
          statement.executeQuery(
              String.format(
                  "SELECT COUNT(*) FROM study_books WHERE user_id = '%s' AND language = 'Java'",
                  userId))) {
        assertThat(result.next()).isTrue();
        assertThat(result.getInt(1)).isEqualTo(10);
      }

      // Query typing sessions by user and date (should use idx_typing_sessions_user_date)
      try (ResultSet result =
          statement.executeQuery(
              String.format(
                  "SELECT COUNT(*) FROM typing_sessions WHERE user_id = '%s' ORDER BY started_at DESC",
                  userId))) {
        assertThat(result.next()).isTrue();
        assertThat(result.getInt(1)).isEqualTo(50);
      }

      long endTime = System.currentTimeMillis();
      long executionTime = endTime - startTime;

      // Performance should be reasonable (less than 1 second for this small dataset)
      assertThat(executionTime).isLessThan(1000);
    }
  }

  @Test
  @DisplayName("Should handle system problems correctly")
  void shouldHandleSystemProblemsCorrectly() throws SQLException {
    try (Connection connection = dataSource.getConnection();
        Statement statement = connection.createStatement()) {

      // Insert system problem (user_id should be null)
      UUID systemProblemId = UUID.randomUUID();
      assertDoesNotThrow(
          () ->
              statement.executeUpdate(
                  String.format(
                      "INSERT INTO study_books (id, user_id, language, question, is_system_problem) VALUES ('%s', NULL, 'Java', 'System question', TRUE)",
                      systemProblemId)));

      // Verify system problem is inserted correctly
      try (ResultSet result =
          statement.executeQuery(
              String.format("SELECT * FROM study_books WHERE id = '%s'", systemProblemId))) {
        assertThat(result.next()).isTrue();
        assertThat(result.getObject("user_id")).isNull();
        assertThat(result.getBoolean("is_system_problem")).isTrue();
      }

      // Test query for system problems (should use idx_study_books_system_language)
      try (ResultSet result =
          statement.executeQuery(
              "SELECT COUNT(*) FROM study_books WHERE is_system_problem = TRUE AND language = 'Java'")) {
        assertThat(result.next()).isTrue();
        assertThat(result.getInt(1)).isGreaterThanOrEqualTo(1);
      }
    }
  }

  private Set<String> getTableColumns(DatabaseMetaData metaData, String tableName)
      throws SQLException {
    Set<String> columns = new HashSet<>();
    try (ResultSet resultSet = metaData.getColumns(null, null, tableName, null)) {
      while (resultSet.next()) {
        columns.add(resultSet.getString("COLUMN_NAME"));
      }
    }
    return columns;
  }

  private boolean checkIndexExists(DatabaseMetaData metaData, String indexName)
      throws SQLException {
    // Check across all tables since H2 doesn't always return table-specific indexes correctly
    String[] tableNames = {"USERS", "USER_LOGIN_STATISTICS", "STUDY_BOOKS", "TYPING_SESSIONS"};

    for (String tableName : tableNames) {
      try (ResultSet indexes = metaData.getIndexInfo(null, null, tableName, false, false)) {
        while (indexes.next()) {
          String actualIndexName = indexes.getString("INDEX_NAME");
          if (indexName.equalsIgnoreCase(actualIndexName)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
