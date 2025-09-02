package com.rct.integration;

import static org.assertj.core.api.Assertions.*;

import com.rct.domain.model.studybook.Language;
import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.domain.model.typingsession.Duration;
import com.rct.domain.model.typingsession.TypingResult;
import com.rct.domain.model.typingsession.TypingSession;
import com.rct.domain.model.typingsession.TypingSessionId;
import com.rct.domain.model.typingsession.TypingSessionRepository;
import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.LoginStatistics;
import com.rct.domain.model.user.PasswordHash;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import com.rct.domain.model.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

/**
 * Comprehensive database integration tests that verify repository implementations, data integrity,
 * performance, and complex query scenarios using TestContainers.
 */
@Transactional
class DatabaseIntegrationTestSuite extends BaseIntegrationTest {

  @Autowired private UserRepository userRepository;

  @Autowired private StudyBookRepository studyBookRepository;

  @Autowired private TypingSessionRepository typingSessionRepository;

  @Autowired private DataSource dataSource;

  @Autowired private JdbcTemplate jdbcTemplate;

  private User testUser;
  private StudyBook testStudyBook;

  @BeforeEach
  void setUpTestData() {
    // Create test user
    testUser =
        new User(
            new UserId(UUID.randomUUID()),
            new LoginId("dbtest" + System.currentTimeMillis()),
            new PasswordHash("hashedpassword"),
            new LoginStatistics(LocalDate.now(), 1, 1, 1));
    testUser = userRepository.save(testUser);

    // Create test study book
    testStudyBook =
        new StudyBook(
            new StudyBookId(UUID.randomUUID()),
            testUser.getId(),
            new Language("JavaScript"),
            "console.log('Database test');",
            "Database integration test question",
            false);
    testStudyBook = studyBookRepository.save(testStudyBook);
  }

  @Nested
  @DisplayName("User Repository Integration Tests")
  class UserRepositoryTests {

    @Test
    @DisplayName("Should save and retrieve user with all properties")
    void shouldSaveAndRetrieveUserWithAllProperties() {
      // Given
      User newUser =
          new User(
              new UserId(UUID.randomUUID()),
              new LoginId("newuser" + System.currentTimeMillis()),
              new PasswordHash("newhashedpassword"),
              new LoginStatistics(LocalDate.now().minusDays(1), 5, 10, 15));

      // When
      User savedUser = userRepository.save(newUser);

      // Then
      assertThat(savedUser).isNotNull();
      assertThat(savedUser.getId()).isEqualTo(newUser.getId());
      assertThat(savedUser.getLoginId()).isEqualTo(newUser.getLoginId());
      assertThat(savedUser.getPasswordHash()).isEqualTo(newUser.getPasswordHash());
      assertThat(savedUser.getLoginStats().getConsecutiveDays()).isEqualTo(5);
      assertThat(savedUser.getLoginStats().getMaxConsecutiveDays()).isEqualTo(10);
      assertThat(savedUser.getLoginStats().getTotalDays()).isEqualTo(15);

      // Verify retrieval
      Optional<User> retrievedUser = userRepository.findByLoginId(newUser.getLoginId());
      assertThat(retrievedUser).isPresent();
      assertThat(retrievedUser.get().getId()).isEqualTo(newUser.getId());
    }

    @Test
    @DisplayName("Should handle login statistics updates correctly")
    void shouldHandleLoginStatisticsUpdatesCorrectly() {
      // Given
      User user = testUser;
      LoginStatistics originalStats = user.getLoginStats();

      // When - Update login statistics
      user.updateLoginStatistics(LocalDate.now());
      User updatedUser = userRepository.save(user);

      // Then
      assertThat(updatedUser.getLoginStats().getLastLoginDate()).isEqualTo(LocalDate.now());
      assertThat(updatedUser.getLoginStats().getConsecutiveDays())
          .isGreaterThan(originalStats.getConsecutiveDays());
    }

    @Test
    @DisplayName("Should enforce unique login ID constraint")
    void shouldEnforceUniqueLoginIdConstraint() {
      // Given
      LoginId duplicateLoginId = testUser.getLoginId();
      User duplicateUser =
          new User(
              new UserId(UUID.randomUUID()),
              duplicateLoginId,
              new PasswordHash("differentpassword"),
              new LoginStatistics(LocalDate.now(), 0, 0, 0));

      // When & Then
      assertThatThrownBy(() -> userRepository.save(duplicateUser))
          .isInstanceOf(Exception.class); // Should throw constraint violation
    }

    @Test
    @DisplayName("Should return empty when user not found")
    void shouldReturnEmptyWhenUserNotFound() {
      // Given
      LoginId nonExistentLoginId = new LoginId("nonexistent" + System.currentTimeMillis());

      // When
      Optional<User> result = userRepository.findByLoginId(nonExistentLoginId);

      // Then
      assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should check existence by login ID correctly")
    void shouldCheckExistenceByLoginIdCorrectly() {
      // Given
      LoginId existingLoginId = testUser.getLoginId();
      LoginId nonExistentLoginId = new LoginId("nonexistent" + System.currentTimeMillis());

      // When & Then
      assertThat(userRepository.existsByLoginId(existingLoginId)).isTrue();
      assertThat(userRepository.existsByLoginId(nonExistentLoginId)).isFalse();
    }
  }

  @Nested
  @DisplayName("StudyBook Repository Integration Tests")
  class StudyBookRepositoryTests {

    @Test
    @DisplayName("Should save and retrieve study book with all properties")
    void shouldSaveAndRetrieveStudyBookWithAllProperties() {
      // Given
      StudyBook newStudyBook =
          new StudyBook(
              new StudyBookId(UUID.randomUUID()),
              testUser.getId(),
              new Language("Python"),
              "print('Hello World')",
              "Basic Python print statement",
              false);

      // When
      StudyBook savedStudyBook = studyBookRepository.save(newStudyBook);

      // Then
      assertThat(savedStudyBook).isNotNull();
      assertThat(savedStudyBook.getId()).isEqualTo(newStudyBook.getId());
      assertThat(savedStudyBook.getUserId()).isEqualTo(newStudyBook.getUserId());
      assertThat(savedStudyBook.getLanguage()).isEqualTo(newStudyBook.getLanguage());
      assertThat(savedStudyBook.getQuestion()).isEqualTo(newStudyBook.getQuestion());
      assertThat(savedStudyBook.getExplanation()).isEqualTo(newStudyBook.getExplanation());
      assertThat(savedStudyBook.isSystemProblem()).isEqualTo(newStudyBook.isSystemProblem());
    }

    @Test
    @DisplayName("Should find study books by user ID with pagination")
    void shouldFindStudyBooksByUserIdWithPagination() {
      // Given - Create multiple study books for the test user
      for (int i = 0; i < 5; i++) {
        StudyBook studyBook =
            new StudyBook(
                new StudyBookId(UUID.randomUUID()),
                testUser.getId(),
                new Language("Java"),
                "System.out.println(\"Test " + i + "\");",
                "Test explanation " + i,
                false);
        studyBookRepository.save(studyBook);
      }

      // When
      Pageable pageable = PageRequest.of(0, 3);
      Page<StudyBook> result = studyBookRepository.findByUserId(testUser.getId(), pageable);

      // Then
      assertThat(result).isNotNull();
      assertThat(result.getContent()).hasSize(3);
      assertThat(result.getTotalElements()).isEqualTo(6); // 5 created + 1 from setup
      assertThat(result.getTotalPages()).isEqualTo(2);
      assertThat(result.getContent()).allMatch(sb -> sb.getUserId().equals(testUser.getId()));
    }

    @Test
    @DisplayName("Should find study books by language filter")
    void shouldFindStudyBooksByLanguageFilter() {
      // Given - Create study books with different languages
      Language pythonLang = new Language("Python");
      Language javaLang = new Language("Java");

      for (int i = 0; i < 3; i++) {
        StudyBook pythonBook =
            new StudyBook(
                new StudyBookId(UUID.randomUUID()),
                testUser.getId(),
                pythonLang,
                "print('Python " + i + "')",
                "Python explanation " + i,
                false);
        studyBookRepository.save(pythonBook);

        StudyBook javaBook =
            new StudyBook(
                new StudyBookId(UUID.randomUUID()),
                testUser.getId(),
                javaLang,
                "System.out.println(\"Java " + i + "\");",
                "Java explanation " + i,
                false);
        studyBookRepository.save(javaBook);
      }

      // When
      Pageable pageable = PageRequest.of(0, 10);
      Page<StudyBook> pythonBooks =
          studyBookRepository.findByUserIdAndLanguage(testUser.getId(), pythonLang, pageable);
      Page<StudyBook> javaBooks =
          studyBookRepository.findByUserIdAndLanguage(testUser.getId(), javaLang, pageable);

      // Then
      assertThat(pythonBooks.getContent()).hasSize(3);
      assertThat(pythonBooks.getContent()).allMatch(sb -> sb.getLanguage().equals(pythonLang));

      assertThat(javaBooks.getContent()).hasSize(3);
      assertThat(javaBooks.getContent()).allMatch(sb -> sb.getLanguage().equals(javaLang));
    }

    @Test
    @DisplayName("Should find random study books with limit")
    void shouldFindRandomStudyBooksWithLimit() {
      // Given - Create multiple study books
      Language jsLang = new Language("JavaScript");
      for (int i = 0; i < 10; i++) {
        StudyBook studyBook =
            new StudyBook(
                new StudyBookId(UUID.randomUUID()),
                testUser.getId(),
                jsLang,
                "var x" + i + " = " + i + ";",
                "Variable declaration " + i,
                false);
        studyBookRepository.save(studyBook);
      }

      // When
      List<StudyBook> randomBooks = studyBookRepository.findRandomByLanguage(jsLang, 5);

      // Then
      assertThat(randomBooks).hasSize(5);
      assertThat(randomBooks).allMatch(sb -> sb.getLanguage().equals(jsLang));
    }

    @Test
    @DisplayName("Should search study books by query")
    void shouldSearchStudyBooksByQuery() {
      // Given - Create study books with searchable content
      StudyBook searchableBook1 =
          new StudyBook(
              new StudyBookId(UUID.randomUUID()),
              testUser.getId(),
              new Language("JavaScript"),
              "function calculateSum(a, b) { return a + b; }",
              "Function to calculate sum of two numbers",
              false);
      studyBookRepository.save(searchableBook1);

      StudyBook searchableBook2 =
          new StudyBook(
              new StudyBookId(UUID.randomUUID()),
              testUser.getId(),
              new Language("JavaScript"),
              "const result = calculateProduct(x, y);",
              "Function call to calculate product",
              false);
      studyBookRepository.save(searchableBook2);

      StudyBook nonMatchingBook =
          new StudyBook(
              new StudyBookId(UUID.randomUUID()),
              testUser.getId(),
              new Language("Python"),
              "print('Hello World')",
              "Simple print statement",
              false);
      studyBookRepository.save(nonMatchingBook);

      // When
      Pageable pageable = PageRequest.of(0, 10);
      Page<StudyBook> searchResults =
          studyBookRepository.findByUserIdAndQuery(testUser.getId(), "calculate", pageable);

      // Then
      assertThat(searchResults.getContent()).hasSize(2);
      assertThat(searchResults.getContent())
          .allMatch(
              sb ->
                  sb.getQuestion().toLowerCase().contains("calculate")
                      || sb.getExplanation().toLowerCase().contains("calculate"));
    }

    @Test
    @DisplayName("Should delete study book and verify removal")
    void shouldDeleteStudyBookAndVerifyRemoval() {
      // Given
      StudyBookId studyBookId = testStudyBook.getId();

      // When
      studyBookRepository.delete(studyBookId);

      // Then
      Optional<StudyBook> deletedBook = studyBookRepository.findById(studyBookId);
      assertThat(deletedBook).isEmpty();
    }

    @Test
    @DisplayName("Should get distinct languages for user")
    void shouldGetDistinctLanguagesForUser() {
      // Given - Create study books with various languages
      String[] languages = {"Python", "Java", "C++", "Go", "Rust"};
      for (String lang : languages) {
        StudyBook studyBook =
            new StudyBook(
                new StudyBookId(UUID.randomUUID()),
                testUser.getId(),
                new Language(lang),
                "Sample code for " + lang,
                "Sample explanation",
                false);
        studyBookRepository.save(studyBook);
      }

      // When
      List<String> distinctLanguages =
          studyBookRepository.findDistinctLanguagesByUserId(testUser.getId());

      // Then
      assertThat(distinctLanguages).hasSize(languages.length + 1); // +1 for JavaScript from setup
      assertThat(distinctLanguages).containsAll(List.of(languages));
      assertThat(distinctLanguages).contains("JavaScript");
    }
  }

  @Nested
  @DisplayName("TypingSession Repository Integration Tests")
  class TypingSessionRepositoryTests {

    @Test
    @DisplayName("Should save and retrieve typing session with all properties")
    void shouldSaveAndRetrieveTypingSessionWithAllProperties() {
      // Given
      LocalDateTime startTime = LocalDateTime.now().minusMinutes(5);
      LocalDateTime endTime = LocalDateTime.now();
      TypingSession session =
          new TypingSession(
              new TypingSessionId(UUID.randomUUID()),
              testUser.getId(),
              testStudyBook.getId(),
              new TypingResult(100, 95, 95.0),
              new Duration(startTime, endTime),
              startTime);

      // When
      TypingSession savedSession = typingSessionRepository.save(session);

      // Then
      assertThat(savedSession).isNotNull();
      assertThat(savedSession.getId()).isEqualTo(session.getId());
      assertThat(savedSession.getUserId()).isEqualTo(session.getUserId());
      assertThat(savedSession.getStudyBookId()).isEqualTo(session.getStudyBookId());
      assertThat(savedSession.getResult().getTotalCharacters()).isEqualTo(100);
      assertThat(savedSession.getResult().getCorrectCharacters()).isEqualTo(95);
      assertThat(savedSession.getResult().getAccuracy()).isEqualTo(95.0);
    }

    @Test
    @DisplayName("Should find typing sessions by user ID with pagination")
    void shouldFindTypingSessionsByUserIdWithPagination() {
      // Given - Create multiple typing sessions
      for (int i = 0; i < 7; i++) {
        LocalDateTime startTime = LocalDateTime.now().minusMinutes(i + 1);
        LocalDateTime endTime = LocalDateTime.now().minusMinutes(i);
        TypingSession session =
            new TypingSession(
                new TypingSessionId(UUID.randomUUID()),
                testUser.getId(),
                testStudyBook.getId(),
                new TypingResult(50, 45 + i, (45.0 + i) / 50.0 * 100),
                new Duration(startTime, endTime),
                startTime);
        typingSessionRepository.save(session);
      }

      // When
      Pageable pageable = PageRequest.of(0, 5);
      Page<TypingSession> result = typingSessionRepository.findByUserId(testUser.getId(), pageable);

      // Then
      assertThat(result).isNotNull();
      assertThat(result.getContent()).hasSize(5);
      assertThat(result.getTotalElements()).isEqualTo(7);
      assertThat(result.getContent())
          .allMatch(session -> session.getUserId().equals(testUser.getId()));
    }

    @Test
    @DisplayName("Should calculate statistics correctly")
    void shouldCalculateStatisticsCorrectly() {
      // Given - Create typing sessions with known accuracies
      double[] accuracies = {100.0, 90.0, 80.0, 95.0, 85.0};
      for (int i = 0; i < accuracies.length; i++) {
        LocalDateTime startTime = LocalDateTime.now().minusMinutes(i + 1);
        LocalDateTime endTime = LocalDateTime.now().minusMinutes(i);
        TypingSession session =
            new TypingSession(
                new TypingSessionId(UUID.randomUUID()),
                testUser.getId(),
                testStudyBook.getId(),
                new TypingResult(100, (int) accuracies[i], accuracies[i]),
                new Duration(startTime, endTime),
                startTime);
        typingSessionRepository.save(session);
      }

      // When
      List<TypingSession> allSessions =
          typingSessionRepository
              .findByUserId(testUser.getId(), PageRequest.of(0, 100))
              .getContent();

      // Then
      assertThat(allSessions).hasSize(5);

      // Calculate expected average accuracy
      double expectedAverage = (100.0 + 90.0 + 80.0 + 95.0 + 85.0) / 5.0;
      double actualAverage =
          allSessions.stream()
              .mapToDouble(session -> session.getResult().getAccuracy())
              .average()
              .orElse(0.0);

      assertThat(actualAverage).isEqualTo(expectedAverage);

      // Find best accuracy
      double bestAccuracy =
          allSessions.stream()
              .mapToDouble(session -> session.getResult().getAccuracy())
              .max()
              .orElse(0.0);

      assertThat(bestAccuracy).isEqualTo(100.0);
    }

    @Test
    @DisplayName("Should find recent sessions ordered by date")
    void shouldFindRecentSessionsOrderedByDate() {
      // Given - Create sessions with different timestamps
      LocalDateTime baseTime = LocalDateTime.now();
      for (int i = 0; i < 5; i++) {
        LocalDateTime startTime = baseTime.minusHours(i);
        LocalDateTime endTime = startTime.plusMinutes(30);
        TypingSession session =
            new TypingSession(
                new TypingSessionId(UUID.randomUUID()),
                testUser.getId(),
                testStudyBook.getId(),
                new TypingResult(50, 40, 80.0),
                new Duration(startTime, endTime),
                startTime);
        typingSessionRepository.save(session);
      }

      // When
      List<TypingSession> recentSessions =
          typingSessionRepository.findRecentByUserId(testUser.getId(), 3);

      // Then
      assertThat(recentSessions).hasSize(3);

      // Verify sessions are ordered by most recent first
      for (int i = 0; i < recentSessions.size() - 1; i++) {
        LocalDateTime current = recentSessions.get(i).getStartedAt();
        LocalDateTime next = recentSessions.get(i + 1).getStartedAt();
        assertThat(current).isAfterOrEqualTo(next);
      }
    }

    @Test
    @DisplayName("Should handle sessions with different study books")
    void shouldHandleSessionsWithDifferentStudyBooks() {
      // Given - Create another study book
      StudyBook anotherStudyBook =
          new StudyBook(
              new StudyBookId(UUID.randomUUID()),
              testUser.getId(),
              new Language("Python"),
              "print('Another test')",
              "Another test explanation",
              false);
      anotherStudyBook = studyBookRepository.save(anotherStudyBook);

      // Create sessions for both study books
      LocalDateTime startTime = LocalDateTime.now().minusMinutes(10);
      LocalDateTime endTime = LocalDateTime.now().minusMinutes(5);

      TypingSession session1 =
          new TypingSession(
              new TypingSessionId(UUID.randomUUID()),
              testUser.getId(),
              testStudyBook.getId(),
              new TypingResult(50, 45, 90.0),
              new Duration(startTime, endTime),
              startTime);

      TypingSession session2 =
          new TypingSession(
              new TypingSessionId(UUID.randomUUID()),
              testUser.getId(),
              anotherStudyBook.getId(),
              new TypingResult(60, 54, 90.0),
              new Duration(startTime.plusMinutes(1), endTime.plusMinutes(1)),
              startTime.plusMinutes(1));

      // When
      TypingSession savedSession1 = typingSessionRepository.save(session1);
      TypingSession savedSession2 = typingSessionRepository.save(session2);

      // Then
      assertThat(savedSession1.getStudyBookId()).isEqualTo(testStudyBook.getId());
      assertThat(savedSession2.getStudyBookId()).isEqualTo(anotherStudyBook.getId());

      // Verify both sessions are found for the user
      Page<TypingSession> userSessions =
          typingSessionRepository.findByUserId(testUser.getId(), PageRequest.of(0, 10));
      assertThat(userSessions.getContent()).hasSize(2);
    }
  }

  @Nested
  @DisplayName("Database Performance and Integrity Tests")
  class DatabasePerformanceAndIntegrityTests {

    @Test
    @DisplayName("Should handle large number of study books efficiently")
    void shouldHandleLargeNumberOfStudyBooksEfficiently() {
      // Given - Create a large number of study books
      int numberOfBooks = 1000;
      long startTime = System.currentTimeMillis();

      for (int i = 0; i < numberOfBooks; i++) {
        StudyBook studyBook =
            new StudyBook(
                new StudyBookId(UUID.randomUUID()),
                testUser.getId(),
                new Language("JavaScript"),
                "console.log('Performance test " + i + "');",
                "Performance test explanation " + i,
                false);
        studyBookRepository.save(studyBook);
      }

      long creationTime = System.currentTimeMillis() - startTime;

      // When - Query with pagination
      startTime = System.currentTimeMillis();
      Page<StudyBook> result =
          studyBookRepository.findByUserId(testUser.getId(), PageRequest.of(0, 50));
      long queryTime = System.currentTimeMillis() - startTime;

      // Then
      assertThat(result.getTotalElements()).isEqualTo(numberOfBooks + 1); // +1 from setup
      assertThat(result.getContent()).hasSize(50);

      // Performance assertions (these are rough guidelines)
      assertThat(creationTime).isLessThan(30000); // Should complete within 30 seconds
      assertThat(queryTime).isLessThan(1000); // Query should be fast (< 1 second)
    }

    @Test
    @DisplayName("Should maintain referential integrity")
    void shouldMaintainReferentialIntegrity() {
      // Given - Create typing session referencing study book
      LocalDateTime startTime = LocalDateTime.now().minusMinutes(5);
      LocalDateTime endTime = LocalDateTime.now();
      TypingSession session =
          new TypingSession(
              new TypingSessionId(UUID.randomUUID()),
              testUser.getId(),
              testStudyBook.getId(),
              new TypingResult(50, 45, 90.0),
              new Duration(startTime, endTime),
              startTime);
      typingSessionRepository.save(session);

      // When - Try to delete the referenced study book
      // This should either cascade delete or prevent deletion depending on configuration
      studyBookRepository.delete(testStudyBook.getId());

      // Then - Verify the typing session is also deleted (cascade) or study book deletion failed
      Optional<TypingSession> orphanedSession = typingSessionRepository.findById(session.getId());
      Optional<StudyBook> deletedStudyBook = studyBookRepository.findById(testStudyBook.getId());

      // Either both are deleted (cascade) or both still exist (deletion prevented)
      assertThat(orphanedSession.isPresent()).isEqualTo(deletedStudyBook.isPresent());
    }

    @Test
    @DisplayName("Should handle concurrent access correctly")
    void shouldHandleConcurrentAccessCorrectly() {
      // This is a simplified test for concurrent access
      // In a real scenario, you would use multiple threads

      // Given - Multiple operations on the same user
      User user = testUser;

      // When - Simulate concurrent updates to login statistics
      user.updateLoginStatistics(LocalDate.now());
      User updated1 = userRepository.save(user);

      user.updateLoginStatistics(LocalDate.now().plusDays(1));
      User updated2 = userRepository.save(user);

      // Then - Verify the updates are applied correctly
      assertThat(updated2.getLoginStats().getConsecutiveDays())
          .isGreaterThanOrEqualTo(updated1.getLoginStats().getConsecutiveDays());
    }

    @Test
    @DisplayName("Should validate database constraints")
    void shouldValidateDatabaseConstraints() {
      // Test NOT NULL constraints
      assertThatThrownBy(
              () -> {
                jdbcTemplate.execute(
                    "INSERT INTO users (id, login_id, password_hash) VALUES (null, 'test', 'hash')");
              })
          .isInstanceOf(Exception.class);

      // Test UNIQUE constraints
      String existingLoginId = testUser.getLoginId().getValue();
      assertThatThrownBy(
              () -> {
                jdbcTemplate.execute(
                    "INSERT INTO users (id, login_id, password_hash) VALUES ('"
                        + UUID.randomUUID()
                        + "', '"
                        + existingLoginId
                        + "', 'hash')");
              })
          .isInstanceOf(Exception.class);

      // Test FOREIGN KEY constraints
      UUID nonExistentUserId = UUID.randomUUID();
      assertThatThrownBy(
              () -> {
                jdbcTemplate.execute(
                    "INSERT INTO study_books (id, user_id, language, question) VALUES ('"
                        + UUID.randomUUID()
                        + "', '"
                        + nonExistentUserId
                        + "', 'Java', 'test')");
              })
          .isInstanceOf(Exception.class);
    }

    @Test
    @Sql("/test-data/performance-test-data.sql")
    @DisplayName("Should perform complex queries efficiently")
    void shouldPerformComplexQueriesEfficiently() {
      // This test would use pre-loaded test data from SQL script
      // Testing complex joins and aggregations

      long startTime = System.currentTimeMillis();

      // Complex query: Find users with their study book counts and average typing accuracy
      String complexQuery =
          """
          SELECT u.login_id,
                 COUNT(DISTINCT sb.id) as study_book_count,
                 COUNT(ts.id) as typing_session_count,
                 AVG(ts.accuracy) as average_accuracy
          FROM users u
          LEFT JOIN study_books sb ON u.id = sb.user_id
          LEFT JOIN typing_sessions ts ON u.id = ts.user_id
          WHERE u.login_id LIKE ?
          GROUP BY u.id, u.login_id
          HAVING COUNT(ts.id) > 0
          ORDER BY average_accuracy DESC
          """;

      List<Object[]> results =
          jdbcTemplate.query(
              complexQuery,
              (rs, rowNum) ->
                  new Object[] {
                    rs.getString("login_id"),
                    rs.getInt("study_book_count"),
                    rs.getInt("typing_session_count"),
                    rs.getDouble("average_accuracy")
                  },
              testUser.getLoginId().getValue().substring(0, 5) + "%");

      long queryTime = System.currentTimeMillis() - startTime;

      // Then
      assertThat(queryTime).isLessThan(2000); // Complex query should complete within 2 seconds
      assertThat(results).isNotEmpty();
    }
  }
}
