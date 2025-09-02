package com.rct.infrastructure.persistence.repository;

import com.rct.infrastructure.persistence.entity.StudyBookEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Optimized JPA repository for StudyBookEntity with performance-focused queries. This repository
 * includes optimized queries that leverage database indexes and minimize data transfer for better
 * performance.
 */
@Repository
public interface OptimizedStudyBookRepository extends JpaRepository<StudyBookEntity, UUID> {

  /**
   * Finds random study books with optimized sampling. Uses index on language and system flag for
   * efficient filtering.
   */
  @Query(
      value =
          """
        SELECT sb.* FROM study_books sb
        WHERE (:language IS NULL OR sb.language = :language)
        AND (:includeSystemProblems = true OR sb.is_system_problem = false)
        AND (:excludeUserId IS NULL OR sb.user_id != :excludeUserId)
        ORDER BY RANDOM()
        LIMIT :limit
        """,
      nativeQuery = true)
  List<StudyBookEntity> findRandomOptimized(
      @Param("language") String language,
      @Param("includeSystemProblems") boolean includeSystemProblems,
      @Param("excludeUserId") UUID excludeUserId,
      @Param("limit") int limit);

  /**
   * Finds user's study books with pagination and sorting. Uses covering index to avoid table
   * lookups.
   */
  @Query(
      value =
          """
        SELECT sb.* FROM study_books sb
        WHERE sb.user_id = :userId
        AND (:language IS NULL OR sb.language = :language)
        ORDER BY sb.created_at DESC
        LIMIT :limit OFFSET :offset
        """,
      nativeQuery = true)
  List<StudyBookEntity> findByUserIdOptimized(
      @Param("userId") UUID userId,
      @Param("language") String language,
      @Param("limit") int limit,
      @Param("offset") int offset);

  /**
   * Gets study book statistics with performance metrics. Joins with typing sessions using optimized
   * indexes.
   */
  @Query(
      value =
          """
        SELECT
            sb.id,
            sb.language,
            sb.question,
            sb.is_system_problem,
            sb.created_at,
            COUNT(ts.id) as attempt_count,
            COALESCE(AVG(ts.accuracy), 0) as avg_accuracy,
            COALESCE(MAX(ts.accuracy), 0) as max_accuracy,
            COUNT(DISTINCT ts.user_id) as unique_users
        FROM study_books sb
        LEFT JOIN typing_sessions ts ON sb.id = ts.study_book_id AND ts.completed_at IS NOT NULL
        WHERE sb.user_id = :userId
        GROUP BY sb.id, sb.language, sb.question, sb.is_system_problem, sb.created_at
        ORDER BY sb.created_at DESC
        """,
      nativeQuery = true)
  List<Object[]> findWithStatisticsByUserIdOptimized(@Param("userId") UUID userId);

  /**
   * Finds popular study books based on usage statistics. Uses materialized statistics for better
   * performance.
   */
  @Query(
      value =
          """
        SELECT
            sb.*,
            COUNT(ts.id) as usage_count,
            AVG(ts.accuracy) as avg_accuracy
        FROM study_books sb
        JOIN typing_sessions ts ON sb.id = ts.study_book_id
        WHERE sb.language = :language
        AND ts.completed_at IS NOT NULL
        AND ts.started_at >= :fromDate
        GROUP BY sb.id
        HAVING COUNT(ts.id) >= :minUsageCount
        ORDER BY usage_count DESC, avg_accuracy DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<Object[]> findPopularByLanguageOptimized(
      @Param("language") String language,
      @Param("fromDate") java.time.LocalDateTime fromDate,
      @Param("minUsageCount") int minUsageCount,
      @Param("limit") int limit);

  /**
   * Finds study books by difficulty level with performance data. Uses partial index on system
   * problems.
   */
  @Query(
      value =
          """
        SELECT sb.* FROM study_books sb
        WHERE sb.is_system_problem = true
        AND sb.language = :language
        AND (:difficultyLevel IS NULL OR sb.difficulty_level = :difficultyLevel)
        ORDER BY sb.difficulty_level, sb.created_at DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<StudyBookEntity> findSystemProblemsByDifficultyOptimized(
      @Param("language") String language,
      @Param("difficultyLevel") Integer difficultyLevel,
      @Param("limit") int limit);

  /** Gets language statistics with usage metrics. Optimized for dashboard and analytics. */
  @Query(
      value =
          """
        SELECT
            sb.language,
            COUNT(sb.id) as total_problems,
            COUNT(CASE WHEN sb.is_system_problem = true THEN 1 END) as system_problems,
            COUNT(CASE WHEN sb.is_system_problem = false THEN 1 END) as user_problems,
            COUNT(DISTINCT sb.user_id) as contributing_users,
            COALESCE(AVG(stats.avg_accuracy), 0) as overall_avg_accuracy,
            COALESCE(SUM(stats.total_attempts), 0) as total_attempts
        FROM study_books sb
        LEFT JOIN (
            SELECT
                ts.study_book_id,
                AVG(ts.accuracy) as avg_accuracy,
                COUNT(*) as total_attempts
            FROM typing_sessions ts
            WHERE ts.completed_at IS NOT NULL
            GROUP BY ts.study_book_id
        ) stats ON sb.id = stats.study_book_id
        GROUP BY sb.language
        ORDER BY total_problems DESC
        """,
      nativeQuery = true)
  List<Object[]> getLanguageStatisticsOptimized();

  /**
   * Finds study books that need review based on performance. Identifies problematic or
   * underperforming content.
   */
  @Query(
      value =
          """
        SELECT
            sb.*,
            stats.avg_accuracy,
            stats.attempt_count
        FROM study_books sb
        JOIN (
            SELECT
                ts.study_book_id,
                AVG(ts.accuracy) as avg_accuracy,
                COUNT(*) as attempt_count
            FROM typing_sessions ts
            WHERE ts.completed_at IS NOT NULL
            GROUP BY ts.study_book_id
            HAVING COUNT(*) >= :minAttempts
        ) stats ON sb.id = stats.study_book_id
        WHERE stats.avg_accuracy < :maxAccuracy
        ORDER BY stats.avg_accuracy ASC, stats.attempt_count DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<Object[]> findProblematicStudyBooksOptimized(
      @Param("maxAccuracy") double maxAccuracy,
      @Param("minAttempts") int minAttempts,
      @Param("limit") int limit);

  /** Finds similar study books for recommendations. Uses text similarity and language matching. */
  @Query(
      value =
          """
        SELECT sb.* FROM study_books sb
        WHERE sb.language = :language
        AND sb.id != :excludeId
        AND (:userId IS NULL OR sb.user_id != :userId)
        AND (
            LOWER(sb.question) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
            OR LOWER(sb.explanation) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
        )
        ORDER BY
            CASE WHEN sb.is_system_problem = true THEN 0 ELSE 1 END,
            sb.created_at DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<StudyBookEntity> findSimilarOptimized(
      @Param("language") String language,
      @Param("excludeId") UUID excludeId,
      @Param("userId") UUID userId,
      @Param("searchTerm") String searchTerm,
      @Param("limit") int limit);

  /** Gets user's progress statistics by language. Optimized for progress tracking and analytics. */
  @Query(
      value =
          """
        SELECT
            sb.language,
            COUNT(sb.id) as total_created,
            COUNT(DISTINCT ts.id) as total_attempts,
            COALESCE(AVG(ts.accuracy), 0) as avg_accuracy,
            COUNT(CASE WHEN ts.accuracy >= 90 THEN 1 END) as high_accuracy_count,
            MAX(ts.started_at) as last_practice_date
        FROM study_books sb
        LEFT JOIN typing_sessions ts ON sb.id = ts.study_book_id AND ts.completed_at IS NOT NULL
        WHERE sb.user_id = :userId
        GROUP BY sb.language
        ORDER BY total_attempts DESC
        """,
      nativeQuery = true)
  List<Object[]> getUserProgressByLanguageOptimized(@Param("userId") UUID userId);

  /** Finds recently active study books for a user. Uses composite index for efficient filtering. */
  @Query(
      value =
          """
        SELECT DISTINCT sb.* FROM study_books sb
        JOIN typing_sessions ts ON sb.id = ts.study_book_id
        WHERE (:userId IS NULL OR sb.user_id = :userId OR ts.user_id = :userId)
        AND ts.started_at >= :fromDate
        ORDER BY ts.started_at DESC
        LIMIT :limit
        """,
      nativeQuery = true)
  List<StudyBookEntity> findRecentlyActiveOptimized(
      @Param("userId") UUID userId,
      @Param("fromDate") java.time.LocalDateTime fromDate,
      @Param("limit") int limit);
}
