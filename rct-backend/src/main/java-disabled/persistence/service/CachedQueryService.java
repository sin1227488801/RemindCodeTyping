package com.rct.infrastructure.persistence.service;

import com.rct.infrastructure.config.CacheConfig;
import com.rct.infrastructure.persistence.entity.StudyBookEntity;
import com.rct.infrastructure.persistence.entity.TypingSessionEntity;
import com.rct.infrastructure.persistence.repository.OptimizedStudyBookRepository;
import com.rct.infrastructure.persistence.repository.OptimizedTypingSessionRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cached query service that provides high-performance access to frequently requested data. Uses
 * Spring Cache abstraction to cache expensive database operations.
 */
@Service
@Transactional(readOnly = true)
public class CachedQueryService {

  private final OptimizedTypingSessionRepository typingSessionRepository;
  private final OptimizedStudyBookRepository studyBookRepository;

  public CachedQueryService(
      OptimizedTypingSessionRepository typingSessionRepository,
      OptimizedStudyBookRepository studyBookRepository) {
    this.typingSessionRepository = typingSessionRepository;
    this.studyBookRepository = studyBookRepository;
  }

  /** Gets user statistics with caching. Cache TTL: 5 minutes (frequently changing data) */
  @Cacheable(
      value = CacheConfig.USER_STATISTICS_CACHE,
      key =
          "T(com.rct.infrastructure.config.CacheConfig.CacheKeys).userStatistics(#userId.toString())")
  public UserStatisticsDto getUserStatistics(UUID userId) {
    Object[] result = typingSessionRepository.getUserStatisticsOptimized(userId);
    if (result != null && result.length >= 6) {
      return new UserStatisticsDto(
          ((Number) result[0]).longValue(), // total_sessions
          ((Number) result[1]).longValue(), // completed_sessions
          ((Number) result[2]).doubleValue(), // avg_accuracy
          ((Number) result[3]).doubleValue(), // max_accuracy
          ((Number) result[4]).longValue(), // total_characters
          ((Number) result[5]).longValue() // total_duration_ms
          );
    }
    return new UserStatisticsDto(0L, 0L, 0.0, 0.0, 0L, 0L);
  }

  /** Gets language statistics with caching. Cache TTL: 2 hours (moderately stable data) */
  @Cacheable(
      value = CacheConfig.LANGUAGE_STATISTICS_CACHE,
      key = "T(com.rct.infrastructure.config.CacheConfig.CacheKeys).languageStatistics()")
  public List<LanguageStatisticsDto> getLanguageStatistics() {
    List<Object[]> results = studyBookRepository.getLanguageStatisticsOptimized();
    return results.stream()
        .map(
            result ->
                new LanguageStatisticsDto(
                    (String) result[0], // language
                    ((Number) result[1]).longValue(), // total_problems
                    ((Number) result[2]).longValue(), // system_problems
                    ((Number) result[3]).longValue(), // user_problems
                    ((Number) result[4]).longValue(), // contributing_users
                    ((Number) result[5]).doubleValue(), // overall_avg_accuracy
                    ((Number) result[6]).longValue() // total_attempts
                    ))
        .toList();
  }

  /** Gets popular study books with caching. Cache TTL: 30 minutes (moderately changing data) */
  @Cacheable(
      value = CacheConfig.POPULAR_STUDY_BOOKS_CACHE,
      key =
          "T(com.rct.infrastructure.config.CacheConfig.CacheKeys).popularStudyBooks(#language, #limit)")
  public List<PopularStudyBookDto> getPopularStudyBooks(String language, int limit) {
    LocalDateTime fromDate = LocalDateTime.now().minusDays(30); // Last 30 days
    List<Object[]> results =
        studyBookRepository.findPopularByLanguageOptimized(
            language, fromDate, 5, limit); // Minimum 5 uses to be considered popular

    return results.stream()
        .map(
            result -> {
              StudyBookEntity entity = (StudyBookEntity) result[0];
              return new PopularStudyBookDto(
                  entity.getId(),
                  entity.getLanguage(),
                  entity.getQuestion(),
                  entity.getExplanation(),
                  entity.isSystemProblem(),
                  ((Number) result[1]).longValue(), // usage_count
                  ((Number) result[2]).doubleValue() // avg_accuracy
                  );
            })
        .toList();
  }

  /**
   * Gets user progress by language with caching. Cache TTL: 5 minutes (frequently changing data)
   */
  @Cacheable(
      value = CacheConfig.USER_PROGRESS_CACHE,
      key =
          "T(com.rct.infrastructure.config.CacheConfig.CacheKeys).userProgress(#userId.toString())")
  public List<UserProgressDto> getUserProgressByLanguage(UUID userId) {
    List<Object[]> results = studyBookRepository.getUserProgressByLanguageOptimized(userId);
    return results.stream()
        .map(
            result ->
                new UserProgressDto(
                    (String) result[0], // language
                    ((Number) result[1]).longValue(), // total_created
                    ((Number) result[2]).longValue(), // total_attempts
                    ((Number) result[3]).doubleValue(), // avg_accuracy
                    ((Number) result[4]).longValue(), // high_accuracy_count
                    (LocalDateTime) result[5] // last_practice_date
                    ))
        .toList();
  }

  /** Gets system problems with caching. Cache TTL: 24 hours (rarely changing data) */
  @Cacheable(
      value = CacheConfig.SYSTEM_PROBLEMS_CACHE,
      key = "T(com.rct.infrastructure.config.CacheConfig.CacheKeys).systemProblems(#language)")
  public List<StudyBookEntity> getSystemProblems(
      String language, Integer difficultyLevel, int limit) {
    return studyBookRepository.findSystemProblemsByDifficultyOptimized(
        language, difficultyLevel, limit);
  }

  /**
   * Gets random study books with short-term caching. Cache TTL: 5 minutes (to provide some variety
   * while reducing DB load)
   */
  @Cacheable(
      value = CacheConfig.RANDOM_STUDY_BOOKS_CACHE,
      key =
          "T(com.rct.infrastructure.config.CacheConfig.CacheKeys).randomStudyBooks(#language, #includeSystemProblems, #limit)")
  public List<StudyBookEntity> getRandomStudyBooks(
      String language, boolean includeSystemProblems, UUID excludeUserId, int limit) {
    return studyBookRepository.findRandomOptimized(
        language, includeSystemProblems, excludeUserId, limit);
  }

  /** Gets accuracy trend data with caching. Cache TTL: 30 minutes (analytical data) */
  @Cacheable(
      value = CacheConfig.USER_STATISTICS_CACHE,
      key = "'accuracy_trend:' + #userId.toString() + ':' + #days")
  public List<AccuracyTrendDto> getAccuracyTrend(UUID userId, int days) {
    LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
    List<Object[]> results = typingSessionRepository.getAccuracyTrendOptimized(userId, fromDate);

    return results.stream()
        .map(
            result ->
                new AccuracyTrendDto(
                    ((java.sql.Date) result[0]).toLocalDate(), // session_date
                    ((Number) result[1]).doubleValue(), // avg_accuracy
                    ((Number) result[2]).longValue(), // session_count
                    ((Number) result[3]).doubleValue() // max_accuracy
                    ))
        .toList();
  }

  /**
   * Gets recent typing sessions with caching. Cache TTL: 2 minutes (frequently accessed, but
   * changes often)
   */
  @Cacheable(
      value = CacheConfig.USER_STATISTICS_CACHE,
      key = "'recent_sessions:' + #userId.toString() + ':' + #limit")
  public List<TypingSessionEntity> getRecentSessions(UUID userId, int limit) {
    return typingSessionRepository.findRecentByUserIdOptimized(userId, limit);
  }

  // DTOs for cached data structures
  public record UserStatisticsDto(
      long totalSessions,
      long completedSessions,
      double avgAccuracy,
      double maxAccuracy,
      long totalCharacters,
      long totalDurationMs) {}

  public record LanguageStatisticsDto(
      String language,
      long totalProblems,
      long systemProblems,
      long userProblems,
      long contributingUsers,
      double overallAvgAccuracy,
      long totalAttempts) {}

  public record PopularStudyBookDto(
      UUID id,
      String language,
      String question,
      String explanation,
      boolean isSystemProblem,
      long usageCount,
      double avgAccuracy) {}

  public record UserProgressDto(
      String language,
      long totalCreated,
      long totalAttempts,
      double avgAccuracy,
      long highAccuracyCount,
      LocalDateTime lastPracticeDate) {}

  public record AccuracyTrendDto(
      java.time.LocalDate sessionDate, double avgAccuracy, long sessionCount, double maxAccuracy) {}
}
