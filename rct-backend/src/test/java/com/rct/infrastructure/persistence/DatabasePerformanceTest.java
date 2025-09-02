package com.rct.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.rct.infrastructure.persistence.entity.StudyBookEntity;
import com.rct.infrastructure.persistence.entity.TypingSessionEntity;
import com.rct.infrastructure.persistence.entity.UserEntity;
import com.rct.infrastructure.persistence.repository.OptimizedStudyBookRepository;
import com.rct.infrastructure.persistence.repository.OptimizedTypingSessionRepository;
import com.rct.infrastructure.persistence.service.CachedQueryService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.StopWatch;

/**
 * Performance tests for database queries and optimizations. These tests verify that optimized
 * queries perform within acceptable time limits.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import({CachedQueryService.class})
class DatabasePerformanceTest extends BaseRepositoryIntegrationTest {

  @Autowired private TestEntityManager entityManager;

  @Autowired private OptimizedTypingSessionRepository typingSessionRepository;

  @Autowired private OptimizedStudyBookRepository studyBookRepository;

  @Autowired private CachedQueryService cachedQueryService;

  private UserEntity testUser;
  private List<StudyBookEntity> testStudyBooks;
  private List<TypingSessionEntity> testSessions;

  @BeforeEach
  void setupPerformanceTestData() {
    // Create test user
    testUser = new UserEntity();
    testUser.setLoginId("perftest_user");
    testUser.setPasswordHash("hashed_password");
    testUser.setCreatedAt(LocalDateTime.now().minusDays(30));
    testUser.setUpdatedAt(LocalDateTime.now());
    entityManager.persistAndFlush(testUser);

    // Create test study books (100 books across different languages)
    testStudyBooks = new ArrayList<>();
    String[] languages = {"Java", "JavaScript", "Python", "C++", "Go"};

    for (int i = 0; i < 100; i++) {
      StudyBookEntity studyBook = new StudyBookEntity();
      studyBook.setUserId(testUser.getId());
      studyBook.setLanguage(languages[i % languages.length]);
      studyBook.setQuestion("Performance test question " + i);
      studyBook.setExplanation("Performance test explanation " + i);
      studyBook.setSystemProblem(i % 10 == 0); // 10% system problems
      studyBook.setDifficultyLevel(1 + (i % 5)); // Difficulty 1-5
      studyBook.setCreatedAt(LocalDateTime.now().minusDays(30 - (i % 30)));
      studyBook.setUpdatedAt(LocalDateTime.now());

      entityManager.persist(studyBook);
      testStudyBooks.add(studyBook);
    }
    entityManager.flush();

    // Create test typing sessions (1000 sessions)
    testSessions = new ArrayList<>();
    for (int i = 0; i < 1000; i++) {
      TypingSessionEntity session = new TypingSessionEntity();
      session.setUserId(testUser.getId());
      session.setStudyBookId(testStudyBooks.get(i % testStudyBooks.size()).getId());
      session.setStartedAt(LocalDateTime.now().minusDays(30 - (i % 30)));

      // 90% completed sessions
      if (i % 10 != 0) {
        session.setCompletedAt(session.getStartedAt().plusMinutes(5 + (i % 10)));
        session.setDurationMs((long) ((5 + (i % 10)) * 60 * 1000));
        session.setTotalCharacters(100 + (i % 50));
        session.setCorrectCharacters((int) ((100 + (i % 50)) * (0.7 + (i % 30) * 0.01)));
        session.setAccuracy(
            BigDecimal.valueOf(
                session.getCorrectCharacters() * 100.0 / session.getTotalCharacters()));
      }

      session.setCreatedAt(session.getStartedAt());
      entityManager.persist(session);
      testSessions.add(session);
    }
    entityManager.flush();
    entityManager.clear();
  }

  @Test
  void testUserStatisticsQueryPerformance() {
    StopWatch stopWatch = new StopWatch();

    // Test optimized query performance
    stopWatch.start("optimized_user_stats");
    Object[] result = typingSessionRepository.getUserStatisticsOptimized(testUser.getId());
    stopWatch.stop();

    // Verify results
    assertThat(result).isNotNull();
    assertThat(result).hasSize(6);
    assertThat(((Number) result[0]).longValue()).isGreaterThan(0); // total_sessions

    // Performance assertion: should complete within 100ms
    assertThat(stopWatch.getLastTaskTimeMillis())
        .as("User statistics query should complete within 100ms")
        .isLessThan(100);

    System.out.println("User statistics query time: " + stopWatch.getLastTaskTimeMillis() + "ms");
  }

  @Test
  void testRecentSessionsQueryPerformance() {
    StopWatch stopWatch = new StopWatch();

    stopWatch.start("recent_sessions");
    List<TypingSessionEntity> recentSessions =
        typingSessionRepository.findRecentByUserIdOptimized(testUser.getId(), 20);
    stopWatch.stop();

    // Verify results
    assertThat(recentSessions).isNotEmpty();
    assertThat(recentSessions).hasSizeLessThanOrEqualTo(20);

    // Performance assertion: should complete within 50ms
    assertThat(stopWatch.getLastTaskTimeMillis())
        .as("Recent sessions query should complete within 50ms")
        .isLessThan(50);

    System.out.println("Recent sessions query time: " + stopWatch.getLastTaskTimeMillis() + "ms");
  }

  @Test
  void testAccuracyTrendQueryPerformance() {
    StopWatch stopWatch = new StopWatch();

    stopWatch.start("accuracy_trend");
    List<Object[]> trendData =
        typingSessionRepository.getAccuracyTrendOptimized(
            testUser.getId(), LocalDateTime.now().minusDays(30));
    stopWatch.stop();

    // Verify results
    assertThat(trendData).isNotEmpty();

    // Performance assertion: should complete within 150ms
    assertThat(stopWatch.getLastTaskTimeMillis())
        .as("Accuracy trend query should complete within 150ms")
        .isLessThan(150);

    System.out.println("Accuracy trend query time: " + stopWatch.getLastTaskTimeMillis() + "ms");
  }

  @Test
  void testRandomStudyBooksQueryPerformance() {
    StopWatch stopWatch = new StopWatch();

    stopWatch.start("random_study_books");
    List<StudyBookEntity> randomBooks =
        studyBookRepository.findRandomOptimized("Java", true, null, 10);
    stopWatch.stop();

    // Verify results
    assertThat(randomBooks).isNotEmpty();
    assertThat(randomBooks).hasSizeLessThanOrEqualTo(10);

    // Performance assertion: should complete within 100ms
    assertThat(stopWatch.getLastTaskTimeMillis())
        .as("Random study books query should complete within 100ms")
        .isLessThan(100);

    System.out.println(
        "Random study books query time: " + stopWatch.getLastTaskTimeMillis() + "ms");
  }

  @Test
  void testLanguageStatisticsQueryPerformance() {
    StopWatch stopWatch = new StopWatch();

    stopWatch.start("language_statistics");
    List<Object[]> languageStats = studyBookRepository.getLanguageStatisticsOptimized();
    stopWatch.stop();

    // Verify results
    assertThat(languageStats).isNotEmpty();

    // Performance assertion: should complete within 200ms
    assertThat(stopWatch.getLastTaskTimeMillis())
        .as("Language statistics query should complete within 200ms")
        .isLessThan(200);

    System.out.println(
        "Language statistics query time: " + stopWatch.getLastTaskTimeMillis() + "ms");
  }

  @Test
  void testCachedQueryServicePerformance() {
    StopWatch stopWatch = new StopWatch();

    // First call - should hit database
    stopWatch.start("first_call");
    CachedQueryService.UserStatisticsDto stats1 =
        cachedQueryService.getUserStatistics(testUser.getId());
    stopWatch.stop();

    long firstCallTime = stopWatch.getLastTaskTimeMillis();

    // Second call - should hit cache
    stopWatch.start("second_call");
    CachedQueryService.UserStatisticsDto stats2 =
        cachedQueryService.getUserStatistics(testUser.getId());
    stopWatch.stop();

    long secondCallTime = stopWatch.getLastTaskTimeMillis();

    // Verify results are identical
    assertThat(stats1).isEqualTo(stats2);

    // Cache should be significantly faster (at least 50% faster)
    assertThat(secondCallTime)
        .as("Cached call should be at least 50% faster than first call")
        .isLessThan(firstCallTime / 2);

    System.out.println("First call (DB): " + firstCallTime + "ms");
    System.out.println("Second call (Cache): " + secondCallTime + "ms");
    System.out.println("Cache speedup: " + (firstCallTime / (double) secondCallTime) + "x");
  }

  @Test
  void testBulkQueryPerformance() {
    StopWatch stopWatch = new StopWatch();

    // Test multiple queries in sequence to simulate real usage
    stopWatch.start("bulk_queries");

    // Simulate dashboard loading
    cachedQueryService.getUserStatistics(testUser.getId());
    cachedQueryService.getRecentSessions(testUser.getId(), 10);
    cachedQueryService.getUserProgressByLanguage(testUser.getId());
    cachedQueryService.getLanguageStatistics();
    cachedQueryService.getPopularStudyBooks("Java", 5);

    stopWatch.stop();

    // Performance assertion: all dashboard queries should complete within 500ms
    assertThat(stopWatch.getLastTaskTimeMillis())
        .as("Bulk dashboard queries should complete within 500ms")
        .isLessThan(500);

    System.out.println("Bulk queries time: " + stopWatch.getLastTaskTimeMillis() + "ms");
  }

  @Test
  void testQueryWithLargeResultSetPerformance() {
    StopWatch stopWatch = new StopWatch();

    // Test query that returns large result set
    stopWatch.start("large_result_set");
    List<TypingSessionEntity> allSessions =
        typingSessionRepository.findByUserIdOrderByStartedAtDesc(testUser.getId());
    stopWatch.stop();

    // Verify results
    assertThat(allSessions).hasSizeGreaterThan(800); // Should have ~900 completed sessions

    // Performance assertion: should complete within 300ms even with large result set
    assertThat(stopWatch.getLastTaskTimeMillis())
        .as("Large result set query should complete within 300ms")
        .isLessThan(300);

    System.out.println("Large result set query time: " + stopWatch.getLastTaskTimeMillis() + "ms");
    System.out.println("Result set size: " + allSessions.size());
  }

  @Test
  void testComplexJoinQueryPerformance() {
    StopWatch stopWatch = new StopWatch();

    // Test complex join query
    stopWatch.start("complex_join");
    List<Object[]> languagePerformance =
        typingSessionRepository.getLanguagePerformanceOptimized(testUser.getId());
    stopWatch.stop();

    // Verify results
    assertThat(languagePerformance).isNotEmpty();

    // Performance assertion: should complete within 200ms
    assertThat(stopWatch.getLastTaskTimeMillis())
        .as("Complex join query should complete within 200ms")
        .isLessThan(200);

    System.out.println("Complex join query time: " + stopWatch.getLastTaskTimeMillis() + "ms");
  }
}
