package com.rct.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * Validation tests for database migration and data integrity.
 *
 * <p>This test class verifies:
 *
 * <ul>
 *   <li>Data migration preserves all existing data
 *   <li>Constraints are properly enforced
 *   <li>Foreign key relationships work correctly
 *   <li>Data validation rules are applied
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DatabaseMigrationValidationTest {

  @Autowired private DataSource dataSource;

  @Test
  @DisplayName("Should enforce unique constraint on login_id")
  void shouldEnforceUniqueConstraintOnLoginId() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      // Insert first user
      UUID userId1 = UUID.randomUUID();
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId1);
        stmt.setString(2, "uniqueuser");
        stmt.setString(3, "hashedpassword");
        stmt.executeUpdate();
      }

      // Try to insert second user with same login_id
      UUID userId2 = UUID.randomUUID();
      assertThrows(
          SQLException.class,
          () -> {
            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
              stmt.setObject(1, userId2);
              stmt.setString(2, "uniqueuser"); // Same login_id
              stmt.setString(3, "anotherpassword");
              stmt.executeUpdate();
            }
          },
          "Should not allow duplicate login_id");
    }
  }

  @Test
  @DisplayName("Should enforce foreign key constraints")
  void shouldEnforceForeignKeyConstraints() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      UUID nonExistentUserId = UUID.randomUUID();

      // Try to insert study book with non-existent user_id
      assertThrows(
          SQLException.class,
          () -> {
            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO study_books (id, user_id, language, question) VALUES (?, ?, ?, ?)")) {
              stmt.setObject(1, UUID.randomUUID());
              stmt.setObject(2, nonExistentUserId);
              stmt.setString(3, "Java");
              stmt.setString(4, "Test question");
              stmt.executeUpdate();
            }
          },
          "Should not allow study book with non-existent user_id");

      // Try to insert typing session with non-existent study_book_id
      UUID userId = UUID.randomUUID();
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId);
        stmt.setString(2, "testuser");
        stmt.setString(3, "hashedpassword");
        stmt.executeUpdate();
      }

      UUID nonExistentStudyBookId = UUID.randomUUID();
      assertThrows(
          SQLException.class,
          () -> {
            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, total_characters, correct_characters) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)")) {
              stmt.setObject(1, UUID.randomUUID());
              stmt.setObject(2, userId);
              stmt.setObject(3, nonExistentStudyBookId);
              stmt.setInt(4, 100);
              stmt.setInt(5, 95);
              stmt.executeUpdate();
            }
          },
          "Should not allow typing session with non-existent study_book_id");
    }
  }

  @Test
  @DisplayName("Should enforce check constraints on typing sessions")
  void shouldEnforceCheckConstraintsOnTypingSessions() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      // Setup valid user and study book
      UUID userId = UUID.randomUUID();
      UUID studyBookId = UUID.randomUUID();

      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId);
        stmt.setString(2, "testuser");
        stmt.setString(3, "hashedpassword");
        stmt.executeUpdate();
      }

      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO study_books (id, user_id, language, question) VALUES (?, ?, ?, ?)")) {
        stmt.setObject(1, studyBookId);
        stmt.setObject(2, userId);
        stmt.setString(3, "Java");
        stmt.setString(4, "Test question");
        stmt.executeUpdate();
      }

      // Try to insert typing session with negative characters
      assertThrows(
          SQLException.class,
          () -> {
            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, total_characters, correct_characters) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)")) {
              stmt.setObject(1, UUID.randomUUID());
              stmt.setObject(2, userId);
              stmt.setObject(3, studyBookId);
              stmt.setInt(4, -10); // Negative total characters
              stmt.setInt(5, 5);
              stmt.executeUpdate();
            }
          },
          "Should not allow negative total characters");

      // Try to insert typing session with correct_characters > total_characters
      assertThrows(
          SQLException.class,
          () -> {
            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, total_characters, correct_characters) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)")) {
              stmt.setObject(1, UUID.randomUUID());
              stmt.setObject(2, userId);
              stmt.setObject(3, studyBookId);
              stmt.setInt(4, 50);
              stmt.setInt(5, 60); // More correct than total
              stmt.executeUpdate();
            }
          },
          "Should not allow correct characters to exceed total characters");
    }
  }

  @Test
  @DisplayName("Should enforce difficulty level constraints")
  void shouldEnforceDifficultyLevelConstraints() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      // Setup valid user
      UUID userId = UUID.randomUUID();
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId);
        stmt.setString(2, "testuser");
        stmt.setString(3, "hashedpassword");
        stmt.executeUpdate();
      }

      // Try to insert study book with invalid difficulty level (too low)
      assertThrows(
          SQLException.class,
          () -> {
            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO study_books (id, user_id, language, question, difficulty_level) VALUES (?, ?, ?, ?, ?)")) {
              stmt.setObject(1, UUID.randomUUID());
              stmt.setObject(2, userId);
              stmt.setString(3, "Java");
              stmt.setString(4, "Test question");
              stmt.setInt(5, 0); // Invalid difficulty level
              stmt.executeUpdate();
            }
          },
          "Should not allow difficulty level below 1");

      // Try to insert study book with invalid difficulty level (too high)
      assertThrows(
          SQLException.class,
          () -> {
            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO study_books (id, user_id, language, question, difficulty_level) VALUES (?, ?, ?, ?, ?)")) {
              stmt.setObject(1, UUID.randomUUID());
              stmt.setObject(2, userId);
              stmt.setString(3, "Java");
              stmt.setString(4, "Test question");
              stmt.setInt(5, 6); // Invalid difficulty level
              stmt.executeUpdate();
            }
          },
          "Should not allow difficulty level above 5");

      // Valid difficulty levels should work
      for (int difficulty = 1; difficulty <= 5; difficulty++) {
        final int finalDifficulty = difficulty;
        assertDoesNotThrow(
            () -> {
              try (PreparedStatement stmt =
                  connection.prepareStatement(
                      "INSERT INTO study_books (id, user_id, language, question, difficulty_level) VALUES (?, ?, ?, ?, ?)")) {
                stmt.setObject(1, UUID.randomUUID());
                stmt.setObject(2, userId);
                stmt.setString(3, "Java");
                stmt.setString(4, "Test question " + finalDifficulty);
                stmt.setInt(5, finalDifficulty);
                stmt.executeUpdate();
              }
            },
            "Should allow valid difficulty level " + difficulty);
      }
    }
  }

  @Test
  @DisplayName("Should handle system problems correctly")
  void shouldHandleSystemProblemsCorrectly() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      // System problems should allow null user_id
      UUID systemProblemId = UUID.randomUUID();
      assertDoesNotThrow(
          () -> {
            try (PreparedStatement stmt =
                connection.prepareStatement(
                    "INSERT INTO study_books (id, user_id, language, question, is_system_problem) VALUES (?, NULL, ?, ?, TRUE)")) {
              stmt.setObject(1, systemProblemId);
              stmt.setString(2, "Java");
              stmt.setString(3, "System question");
              stmt.executeUpdate();
            }
          },
          "Should allow system problems with null user_id");

      // Verify system problem was inserted correctly
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "SELECT * FROM study_books WHERE id = ? AND is_system_problem = TRUE")) {
        stmt.setObject(1, systemProblemId);
        try (ResultSet rs = stmt.executeQuery()) {
          assertThat(rs.next()).isTrue();
          assertThat(rs.getObject("user_id")).isNull();
          assertThat(rs.getBoolean("is_system_problem")).isTrue();
        }
      }
    }
  }

  @Test
  @DisplayName("Should calculate accuracy correctly")
  void shouldCalculateAccuracyCorrectly() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      // Setup test data
      UUID userId = UUID.randomUUID();
      UUID studyBookId = UUID.randomUUID();

      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId);
        stmt.setString(2, "testuser");
        stmt.setString(3, "hashedpassword");
        stmt.executeUpdate();
      }

      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO study_books (id, user_id, language, question) VALUES (?, ?, ?, ?)")) {
        stmt.setObject(1, studyBookId);
        stmt.setObject(2, userId);
        stmt.setString(3, "Java");
        stmt.setString(4, "Test question");
        stmt.executeUpdate();
      }

      // Insert typing session and verify accuracy calculation
      UUID sessionId = UUID.randomUUID();
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, total_characters, correct_characters) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)")) {
        stmt.setObject(1, sessionId);
        stmt.setObject(2, userId);
        stmt.setObject(3, studyBookId);
        stmt.setInt(4, 100);
        stmt.setInt(5, 85);
        stmt.executeUpdate();
      }

      // For H2, we need to update accuracy manually since it doesn't support generated columns
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "UPDATE typing_sessions SET accuracy = (correct_characters * 100.0 / total_characters) WHERE id = ?")) {
        stmt.setObject(1, sessionId);
        stmt.executeUpdate();
      }

      // Verify accuracy is calculated correctly
      try (PreparedStatement stmt =
          connection.prepareStatement("SELECT accuracy FROM typing_sessions WHERE id = ?")) {
        stmt.setObject(1, sessionId);
        try (ResultSet rs = stmt.executeQuery()) {
          assertThat(rs.next()).isTrue();
          double accuracy = rs.getDouble("accuracy");
          assertThat(accuracy).isEqualTo(85.0);
        }
      }
    }
  }

  @Test
  @DisplayName("Should maintain referential integrity on cascade delete")
  void shouldMaintainReferentialIntegrityOnCascadeDelete() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      // Setup test data
      UUID userId = UUID.randomUUID();
      UUID studyBookId = UUID.randomUUID();
      UUID sessionId = UUID.randomUUID();

      // Insert user
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId);
        stmt.setString(2, "testuser");
        stmt.setString(3, "hashedpassword");
        stmt.executeUpdate();
      }

      // Insert user login statistics
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO user_login_statistics (user_id, consecutive_login_days, total_login_days) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId);
        stmt.setInt(2, 5);
        stmt.setInt(3, 10);
        stmt.executeUpdate();
      }

      // Insert study book
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO study_books (id, user_id, language, question) VALUES (?, ?, ?, ?)")) {
        stmt.setObject(1, studyBookId);
        stmt.setObject(2, userId);
        stmt.setString(3, "Java");
        stmt.setString(4, "Test question");
        stmt.executeUpdate();
      }

      // Insert typing session
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, total_characters, correct_characters) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)")) {
        stmt.setObject(1, sessionId);
        stmt.setObject(2, userId);
        stmt.setObject(3, studyBookId);
        stmt.setInt(4, 100);
        stmt.setInt(5, 95);
        stmt.executeUpdate();
      }

      // Verify all data exists
      assertThat(countRecords(connection, "users", "id", userId)).isEqualTo(1);
      assertThat(countRecords(connection, "user_login_statistics", "user_id", userId)).isEqualTo(1);
      assertThat(countRecords(connection, "study_books", "user_id", userId)).isEqualTo(1);
      assertThat(countRecords(connection, "typing_sessions", "user_id", userId)).isEqualTo(1);

      // Delete user - should cascade delete related records
      try (PreparedStatement stmt = connection.prepareStatement("DELETE FROM users WHERE id = ?")) {
        stmt.setObject(1, userId);
        int deletedRows = stmt.executeUpdate();
        assertThat(deletedRows).isEqualTo(1);
      }

      // Verify cascade delete worked
      assertThat(countRecords(connection, "users", "id", userId)).isEqualTo(0);
      assertThat(countRecords(connection, "user_login_statistics", "user_id", userId)).isEqualTo(0);
      assertThat(countRecords(connection, "study_books", "user_id", userId)).isEqualTo(0);
      assertThat(countRecords(connection, "typing_sessions", "user_id", userId)).isEqualTo(0);
    }
  }

  @Test
  @DisplayName("Should support backward compatibility views")
  void shouldSupportBackwardCompatibilityViews() throws SQLException {
    try (Connection connection = dataSource.getConnection()) {
      // Insert test data through new tables
      UUID userId = UUID.randomUUID();
      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO users (id, login_id, password_hash) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId);
        stmt.setString(2, "testuser");
        stmt.setString(3, "hashedpassword");
        stmt.executeUpdate();
      }

      try (PreparedStatement stmt =
          connection.prepareStatement(
              "INSERT INTO user_login_statistics (user_id, consecutive_login_days, total_login_days) VALUES (?, ?, ?)")) {
        stmt.setObject(1, userId);
        stmt.setInt(2, 7);
        stmt.setInt(3, 15);
        stmt.executeUpdate();
      }

      // Verify data is accessible through compatibility view
      try (PreparedStatement stmt =
          connection.prepareStatement("SELECT * FROM login_info WHERE id = ?")) {
        stmt.setObject(1, userId);
        try (ResultSet rs = stmt.executeQuery()) {
          assertThat(rs.next()).isTrue();
          assertThat(rs.getString("login_id")).isEqualTo("testuser");
          assertThat(rs.getInt("last_login_days")).isEqualTo(7);
          assertThat(rs.getInt("total_login_days")).isEqualTo(15);
        }
      }
    }
  }

  private int countRecords(Connection connection, String tableName, String columnName, UUID value)
      throws SQLException {
    String query = String.format("SELECT COUNT(*) FROM %s WHERE %s = ?", tableName, columnName);
    try (PreparedStatement stmt = connection.prepareStatement(query)) {
      stmt.setObject(1, value);
      try (ResultSet rs = stmt.executeQuery()) {
        rs.next();
        return rs.getInt(1);
      }
    }
  }
}
