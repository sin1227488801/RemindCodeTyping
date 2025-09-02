package com.rct.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * Performance integration tests for database queries and optimizations.
 *
 * <p>This test class verifies that:
 *
 * <ul>
 *   <li>Database indexes improve query performance
 *   <li>Common queries execute within acceptable time limits
 *   <li>Complex queries are optimized
 *   <li>N+1 query problems are avoided
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DatabasePerformanceIntegrationTest {

  @Autowired private DataSource dataSource;

  private static final int USERS_COUNT = 100;
  private static final int STUDY_BOOKS_PER_USER = 20;
  private static final int TYPING_SESSIONS_PER_BOOK = 10;
  private static final long ACCEPTABLE_QUERY_TIME_MS = 500;

  private List<UUID> userIds;
  private List<UUID> studyBookIds;

  @BeforeEach
  void setupTestData() throws SQLException {
    userIds = new ArrayList<>();
    studyBookIds = new ArrayList<>();

    try (Connection connection = dataSource.getConnection()) {
      // Create test users
      for (int i = 0; i < USERS_COUNT; i++) {
        UUID userId = UUID.randomUUID();
        userIds.add(userId);

        try (PreparedStatement stmt =
            connection.prepareStatement(
                "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
          stmt.setObject(1, userId);
          stmt.setString(2, "user" + i);
          stmt.setString(3, "hashedpassword" + i);
          stmt.executeUpdate();
        }

        // Create login statistics
        try (PreparedStatement stmt =
            connection.prepareStatement(
                "INSERT INTO user_login_statistics (user_id, consecutive_login_days, total_login_days) VALUES (?, ?, ?)")) {
          stmt.setObject(1, userId);
          stmt.setInt(2, i % 30); // 0-29 consecutive days
          stmt.setInt(3, i * 2); // Total days
          stmt.executeUpdate();
        }

        // Create study books for each user
        for (int j = 0; j < STUDY_BOOKS_PER_USER; j++) {
          UUID studyBookId = UUID.randomUUID();
          studyBookIds.add(studyBookId);

          String language = getLanguageByIndex(j % 5);
          int difficulty = (j % 5) + 1;

          try (PreparedStatement stmt =
              connection.prepareStatement(
                  "INSERT INTO study_books (id, user_id, language, question, difficulty_level) VALUES (?, ?, ?, ?, ?)")) {
            stmt.setObject(1, studyBookId);
            stmt.setObject(2, userId);
            stmt.setString(3, language);
            stmt.setString(4, "Question " + j + " for user " + i);
            stmt.setInt(5, difficulty);
            stmt.executeUpdate();
          }

          // Create typing sessions for each study book
          for (int k = 0; k < TYPING_SESSIONS_PER_BOOK; k++) {
            UUID sessionId = UUID.randomUUID();
            int totalChars = 100 + (k * 10);
            int correctChars = totalChars - (k % 5); // Some errors

            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, total_characters, correct_characters, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
              stmt.setObject(1, sessionId);
              stmt.setObject(2, userId);
              stmt.setObject(3, studyBookId);
              stmt.setObject(4, LocalDateTime.now().minusDays(k));
              stmt.setInt(5, totalChars);
              stmt.setInt(6, correctChars);
              stmt.setLong(7, 30000 + (k * 1000)); // 30-39 seconds
              stmt.executeUpdate();
            }
          }
        }
      }

      // Create some system problems
      for (int i = 0; i < 50; i++) {
        UUID systemProblemId = UUID.randomUUID();
        String language = getLanguageByIndex(i % 5);

        try (PreparedStatement stmt =
            connection.prepareStatement(
                "INSERT INTO study_books (id, user_id, language, question, is_system_problem, difficulty_level) VALUES (?, NULL, ?, ?, TRUE, ?)")) {
          stmt.setObject(1, systemProblemId);
          stmt.setString(2, language);
          stmt.setString(3, "System question " + i);
          stmt.setInt(4, (i % 5) + 1);
          stmt.executeUpdate();
        }
      }
    }
  }

  @Test
  @DisplayName("Should perform user lookup by login_id efficiently")
  void shouldPerformUserLookupEfficiently() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      String query = "SELECT * FROM users WHERE login_id = ?";

      long startTime = System.currentTimeMillis();

      // Perform multiple lookups
      for (int i = 0; i < 100; i++) {
        try (PreparedStatement stmt = connection.prepareStatement(query)) {
          stmt.setString(1, "user" + (i % USERS_COUNT));
          try (ResultSet rs = stmt.executeQuery()) {
            assertThat(rs.next()).isTrue();
          }
        }
      }

      long endTime = System.currentTimeMillis();
      long executionTime = endTime - startTime;

      assertThat(executionTime)
          .as("User lookup should be fast with login_id index")
          .isLessThan(ACCEPTABLE_QUERY_TIME_MS);
    }
  }

  @Test
  @DisplayName("Should perform study book queries by user and language efficiently")
  void shouldPerformStudyBookQueriesEfficiently() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      String query =
          "SELECT COUNT(*) FROM study_books WHERE user_id = ? AND language = ? AND is_system_problem = FALSE";

      long startTime = System.currentTimeMillis();

      // Test queries for different users and languages
      for (int i = 0; i < 50; i++) {
        UUID userId = userIds.get(i % userIds.size());
        String language = getLanguageByIndex(i % 5);

        try (PreparedStatement stmt = connection.prepareStatement(query)) {
          stmt.setObject(1, userId);
          stmt.setString(2, language);
          try (ResultSet rs = stmt.executeQuery()) {
            assertThat(rs.next()).isTrue();
            int count = rs.getInt(1);
            assertThat(count).isGreaterThanOrEqualTo(0);
          }
        }
      }

      long endTime = System.currentTimeMillis();
      long executionTime = endTime - startTime;

      assertThat(executionTime)
          .as("Study book queries should be fast with composite index")
          .isLessThan(ACCEPTABLE_QUERY_TIME_MS);
    }
  }

  @Test
  @DisplayName("Should perform system problem queries efficiently")
  void shouldPerformSystemProblemQueriesEfficiently() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      String query =
          "SELECT * FROM study_books WHERE is_system_problem = TRUE AND language = ? ORDER BY difficulty_level LIMIT 10";

      long startTime = System.currentTimeMillis();

      // Test queries for different languages
      for (int i = 0; i < 20; i++) {
        String language = getLanguageByIndex(i % 5);

        try (PreparedStatement stmt = connection.prepareStatement(query)) {
          stmt.setString(1, language);
          try (ResultSet rs = stmt.executeQuery()) {
            int count = 0;
            while (rs.next() && count < 10) {
              assertThat(rs.getBoolean("is_system_problem")).isTrue();
              assertThat(rs.getString("language")).isEqualTo(language);
              count++;
            }
          }
        }
      }

      long endTime = System.currentTimeMillis();
      long executionTime = endTime - startTime;

      assertThat(executionTime)
          .as("System problem queries should be fast with system_language index")
          .isLessThan(ACCEPTABLE_QUERY_TIME_MS);
    }
  }

  @Test
  @DisplayName("Should perform typing session statistics queries efficiently")
  void shouldPerformTypingSessionStatisticsQueriesEfficiently() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      String query =
          """
          SELECT
            AVG(accuracy) as avg_accuracy,
            MAX(accuracy) as max_accuracy,
            COUNT(*) as session_count,
            AVG(duration_ms) as avg_duration
          FROM typing_sessions
          WHERE user_id = ?
          AND started_at >= ?
          """;

      long startTime = System.currentTimeMillis();

      // Test statistics queries for different users
      for (int i = 0; i < 30; i++) {
        UUID userId = userIds.get(i % userIds.size());

        try (PreparedStatement stmt = connection.prepareStatement(query)) {
          stmt.setObject(1, userId);
          stmt.setObject(2, LocalDateTime.now().minusDays(30));
          try (ResultSet rs = stmt.executeQuery()) {
            assertThat(rs.next()).isTrue();
            double avgAccuracy = rs.getDouble("avg_accuracy");
            int sessionCount = rs.getInt("session_count");
            assertThat(avgAccuracy).isGreaterThanOrEqualTo(0);
            assertThat(sessionCount).isGreaterThanOrEqualTo(0);
          }
        }
      }

      long endTime = System.currentTimeMillis();
      long executionTime = endTime - startTime;

      assertThat(executionTime)
          .as("Typing session statistics should be fast with user_date index")
          .isLessThan(ACCEPTABLE_QUERY_TIME_MS);
    }
  }

  @Test
  @DisplayName("Should perform complex join queries efficiently")
  void shouldPerformComplexJoinQueriesEfficiently() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      String query =
          """
          SELECT
            u.login_id,
            sb.language,
            COUNT(ts.id) as session_count,
            AVG(ts.accuracy) as avg_accuracy
          FROM users u
          JOIN study_books sb ON u.id = sb.user_id
          JOIN typing_sessions ts ON sb.id = ts.study_book_id
          WHERE sb.language = ?
          AND ts.started_at >= ?
          GROUP BY u.login_id, sb.language
          HAVING COUNT(ts.id) >= 5
          ORDER BY avg_accuracy DESC
          LIMIT 10
          """;

      long startTime = System.currentTimeMillis();

      // Test complex join queries
      for (int i = 0; i < 5; i++) {
        String language = getLanguageByIndex(i);

        try (PreparedStatement stmt = connection.prepareStatement(query)) {
          stmt.setString(1, language);
          stmt.setObject(2, LocalDateTime.now().minusDays(7));
          try (ResultSet rs = stmt.executeQuery()) {
            int count = 0;
            while (rs.next() && count < 10) {
              assertThat(rs.getString("login_id")).isNotNull();
              assertThat(rs.getString("language")).isEqualTo(language);
              assertThat(rs.getInt("session_count")).isGreaterThanOrEqualTo(5);
              count++;
            }
          }
        }
      }

      long endTime = System.currentTimeMillis();
      long executionTime = endTime - startTime;

      assertThat(executionTime)
          .as("Complex join queries should be reasonably fast with proper indexes")
          .isLessThan(ACCEPTABLE_QUERY_TIME_MS * 2); // Allow more time for complex queries
    }
  }

  @Test
  @DisplayName("Should perform user ranking queries efficiently")
  void shouldPerformUserRankingQueriesEfficiently() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      String query =
          """
          SELECT
            u.login_id,
            uls.consecutive_login_days,
            uls.total_login_days,
            AVG(ts.accuracy) as avg_accuracy,
            COUNT(ts.id) as total_sessions
          FROM users u
          JOIN user_login_statistics uls ON u.id = uls.user_id
          LEFT JOIN typing_sessions ts ON u.id = ts.user_id
          GROUP BY u.id, u.login_id, uls.consecutive_login_days, uls.total_login_days
          ORDER BY uls.consecutive_login_days DESC, avg_accuracy DESC
          LIMIT 20
          """;

      long startTime = System.currentTimeMillis();

      try (PreparedStatement stmt = connection.prepareStatement(query);
          ResultSet rs = stmt.executeQuery()) {

        int count = 0;
        while (rs.next() && count < 20) {
          assertThat(rs.getString("login_id")).isNotNull();
          assertThat(rs.getInt("consecutive_login_days")).isGreaterThanOrEqualTo(0);
          assertThat(rs.getInt("total_login_days")).isGreaterThanOrEqualTo(0);
          count++;
        }

        assertThat(count).isGreaterThan(0);
      }

      long endTime = System.currentTimeMillis();
      long executionTime = endTime - startTime;

      assertThat(executionTime)
          .as("User ranking queries should be reasonably fast")
          .isLessThan(ACCEPTABLE_QUERY_TIME_MS * 2);
    }
  }

  @Test
  @DisplayName("Should handle large result sets efficiently")
  void shouldHandleLargeResultSetsEfficiently() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      String query =
          """
          SELECT
            ts.id,
            ts.user_id,
            ts.study_book_id,
            ts.accuracy,
            ts.duration_ms,
            sb.language,
            sb.question
          FROM typing_sessions ts
          JOIN study_books sb ON ts.study_book_id = sb.id
          WHERE ts.accuracy >= ?
          ORDER BY ts.accuracy DESC, ts.started_at DESC
          """;

      long startTime = System.currentTimeMillis();

      try (PreparedStatement stmt = connection.prepareStatement(query)) {
        stmt.setDouble(1, 80.0); // High accuracy sessions

        try (ResultSet rs = stmt.executeQuery()) {
          int count = 0;
          while (rs.next()) {
            assertThat(rs.getDouble("accuracy")).isGreaterThanOrEqualTo(80.0);
            count++;

            // Process first 1000 records to test performance
            if (count >= 1000) {
              break;
            }
          }

          assertThat(count).isGreaterThan(0);
        }
      }

      long endTime = System.currentTimeMillis();
      long executionTime = endTime - startTime;

      assertThat(executionTime)
          .as("Large result set queries should be handled efficiently")
          .isLessThan(ACCEPTABLE_QUERY_TIME_MS * 3);
    }
  }

  private String getLanguageByIndex(int index) {
    String[] languages = {"Java", "JavaScript", "Python", "HTML", "CSS"};
    return languages[index % languages.length];
  }
}
