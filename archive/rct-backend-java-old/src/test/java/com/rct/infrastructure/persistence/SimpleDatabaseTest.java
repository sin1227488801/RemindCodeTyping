package com.rct.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import javax.sql.DataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/** Simple test to verify database schema migration works correctly. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SimpleDatabaseTest {

  @Autowired private DataSource dataSource;

  @Test
  @DisplayName("Should have migrated database schema successfully")
  void shouldHaveMigratedDatabaseSchemaSuccessfully() throws Exception {
    try (Connection connection = dataSource.getConnection();
        Statement statement = connection.createStatement()) {

      // Test that new normalized tables exist
      try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM users")) {
        assertThat(rs.next()).isTrue();
      }

      try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM user_login_statistics")) {
        assertThat(rs.next()).isTrue();
      }

      try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM study_books")) {
        assertThat(rs.next()).isTrue();
      }

      try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM typing_sessions")) {
        assertThat(rs.next()).isTrue();
      }

      // Test that compatibility views exist
      try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM login_info")) {
        assertThat(rs.next()).isTrue();
      }

      try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM study_book")) {
        assertThat(rs.next()).isTrue();
      }

      try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM typing_log")) {
        assertThat(rs.next()).isTrue();
      }
    }
  }
}
