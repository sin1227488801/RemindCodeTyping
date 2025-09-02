package com.rct.infrastructure.persistence.repository;

import com.rct.infrastructure.persistence.entity.TypingSessionEntity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Optimized JPA repository for TypingSessionEntity with performance-focused queries. This
 * repository includes optimized queries that leverage database indexes and minimize data transfer
 * for better performance.
 */
@Repository
public interface OptimizedTypingSessionRepository extends JpaRepository<TypingSessionEntity, UUID> {

  /**
   * Finds recent typing sessions for a user with optimized pagination. Uses covering index to avoid
   * table lookups.
   */
  @Query(
      value =
          """
        SELECT ts.* FROM typing_sessions ts
        WHERE ts.user_id = :userId
        ORDER BY ts.started_at DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<TypingSessionEntity> findRecentByUserIdOptimized(
      @Param("userId") UUID userId, @Param("limit") int limit);

  /**
   * Gets user statistics using optimized aggregation query. This query uses the covering index for
   * better performance.
   */
  @Query(
      value =
          """
        SELECT
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_sessions,
            COALESCE(AVG(CASE WHEN completed_at IS NOT NULL THEN accuracy END), 0) as avg_accuracy,
            COALESCE(MAX(CASE WHEN completed_at IS NOT NULL THEN accuracy END), 0) as max_accuracy,
            COALESCE(SUM(CASE WHEN completed_at IS NOT NULL THEN total_characters END), 0) as total_characters,
            COALESCE(SUM(CASE WHEN completed_at IS NOT NULL THEN duration_ms END), 0) as total_duration_ms
        FROM typing_sessions
        WHERE user_id = :userId
        """,
      nativeQuery = true)
  Object[] getUserStatisticsOptimized(@Param("userId") UUID userId);

  /**
   * Finds typing sessions within date range with optimized query. Uses composite index for
   * efficient range scanning.
   */
  @Query(
      value =
          """
        SELECT ts.* FROM typing_sessions ts
        WHERE ts.user_id = :userId
        AND ts.started_at >= :startDate
        AND ts.started_at <= :endDate
        AND ts.completed_at IS NOT NULL
        ORDER BY ts.started_at DESC
        """,
      nativeQuery = true)
  List<TypingSessionEntity> findCompletedSessionsInDateRangeOptimized(
      @Param("userId") UUID userId,
      @Param("startDate") LocalDateTime startDate,
      @Param("endDate") LocalDateTime endDate);

  /**
   * Gets accuracy trend data for a user over time. Optimized for dashboard and analytics queries.
   */
  @Query(
      value =
          """
        SELECT
            DATE(started_at) as session_date,
            AVG(accuracy) as avg_accuracy,
            COUNT(*) as session_count,
            MAX(accuracy) as max_accuracy
        FROM typing_sessions
        WHERE user_id = :userId
        AND completed_at IS NOT NULL
        AND started_at >= :fromDate
        GROUP BY DATE(started_at)
        ORDER BY session_date DESC
        """,
      nativeQuery = true)
  List<Object[]> getAccuracyTrendOptimized(
      @Param("userId") UUID userId, @Param("fromDate") LocalDateTime fromDate);

  /** Finds top performing sessions for a user. Uses partial index on completed sessions only. */
  @Query(
      value =
          """
        SELECT ts.* FROM typing_sessions ts
        WHERE ts.user_id = :userId
        AND ts.completed_at IS NOT NULL
        ORDER BY ts.accuracy DESC, ts.started_at DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<TypingSessionEntity> findTopPerformingSessionsOptimized(
      @Param("userId") UUID userId, @Param("limit") int limit);

  /** Gets study book performance statistics. Optimized for study book analysis queries. */
  @Query(
      value =
          """
        SELECT
            study_book_id,
            COUNT(*) as attempt_count,
            AVG(accuracy) as avg_accuracy,
            MAX(accuracy) as max_accuracy,
            COUNT(DISTINCT user_id) as unique_users
        FROM typing_sessions
        WHERE study_book_id = :studyBookId
        AND completed_at IS NOT NULL
        GROUP BY study_book_id
        """,
      nativeQuery = true)
  Object[] getStudyBookPerformanceOptimized(@Param("studyBookId") UUID studyBookId);

  /**
   * Finds sessions that need performance analysis. Identifies slow or problematic sessions for
   * optimization.
   */
  @Query(
      value =
          """
        SELECT ts.* FROM typing_sessions ts
        WHERE ts.completed_at IS NOT NULL
        AND (
            ts.duration_ms > :maxDurationMs
            OR ts.accuracy < :minAccuracy
            OR (ts.total_characters > 0 AND ts.correct_characters * 100.0 / ts.total_characters != ts.accuracy)
        )
        ORDER BY ts.started_at DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<TypingSessionEntity> findProblematicSessionsOptimized(
      @Param("maxDurationMs") Long maxDurationMs,
      @Param("minAccuracy") BigDecimal minAccuracy,
      @Param("limit") int limit);

  /**
   * Gets daily session counts for activity tracking. Optimized for dashboard widgets and activity
   * monitoring.
   */
  @Query(
      value =
          """
        SELECT
            DATE(started_at) as session_date,
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_sessions,
            COUNT(DISTINCT user_id) as active_users
        FROM typing_sessions
        WHERE started_at >= :fromDate
        GROUP BY DATE(started_at)
        ORDER BY session_date DESC
        """,
      nativeQuery = true)
  List<Object[]> getDailyActivityOptimized(@Param("fromDate") LocalDateTime fromDate);

  /**
   * Finds sessions by accuracy range for performance analysis. Uses function-based index on
   * accuracy calculations.
   */
  @Query(
      value =
          """
        SELECT ts.* FROM typing_sessions ts
        WHERE ts.user_id = :userId
        AND ts.completed_at IS NOT NULL
        AND ts.accuracy BETWEEN :minAccuracy AND :maxAccuracy
        ORDER BY ts.accuracy DESC, ts.started_at DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<TypingSessionEntity> findSessionsByAccuracyRangeOptimized(
      @Param("userId") UUID userId,
      @Param("minAccuracy") BigDecimal minAccuracy,
      @Param("maxAccuracy") BigDecimal maxAccuracy,
      @Param("limit") int limit);

  /**
   * Gets language-specific performance statistics. Joins with study_books table using optimized
   * indexes.
   */
  @Query(
      value =
          """
        SELECT
            sb.language,
            COUNT(ts.id) as session_count,
            AVG(ts.accuracy) as avg_accuracy,
            MAX(ts.accuracy) as max_accuracy,
            SUM(ts.total_characters) as total_characters
        FROM typing_sessions ts
        JOIN study_books sb ON ts.study_book_id = sb.id
        WHERE ts.user_id = :userId
        AND ts.completed_at IS NOT NULL
        GROUP BY sb.language
        ORDER BY session_count DESC
        """,
      nativeQuery = true)
  List<Object[]> getLanguagePerformanceOptimized(@Param("userId") UUID userId);
}
