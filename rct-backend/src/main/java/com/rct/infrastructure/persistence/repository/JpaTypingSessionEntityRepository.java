package com.rct.infrastructure.persistence.repository;

import com.rct.infrastructure.persistence.entity.TypingSessionEntity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * JPA repository interface for TypingSessionEntity. This provides the basic CRUD operations and
 * custom queries for typing session persistence.
 */
@Repository
public interface JpaTypingSessionEntityRepository extends JpaRepository<TypingSessionEntity, UUID> {

  /**
   * Finds all typing session entities for a specific user, ordered by start time descending.
   *
   * @param userId the user ID
   * @return list of typing session entities for the user
   */
  List<TypingSessionEntity> findByUserIdOrderByStartedAtDesc(UUID userId);

  /**
   * Finds typing session entities for a user within a date range.
   *
   * @param userId the user ID
   * @param startDate the start date (inclusive)
   * @param endDate the end date (inclusive)
   * @return list of typing session entities within the date range
   */
  List<TypingSessionEntity> findByUserIdAndStartedAtBetweenOrderByStartedAtDesc(
      UUID userId, LocalDateTime startDate, LocalDateTime endDate);

  /**
   * Finds typing session entities for a specific study book.
   *
   * @param studyBookId the study book ID
   * @return list of typing session entities for the study book
   */
  List<TypingSessionEntity> findByStudyBookId(UUID studyBookId);

  /**
   * Finds the most recent typing session entities for a user.
   *
   * @param userId the user ID
   * @param pageable the pagination information
   * @return list of recent typing session entities
   */
  List<TypingSessionEntity> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

  /**
   * Calculates the average accuracy for a user across all completed sessions.
   *
   * @param userId the user ID
   * @return the average accuracy, or null if no sessions found
   */
  @Query(
      "SELECT AVG(t.accuracy) FROM TypingSessionEntity t WHERE t.userId = :userId AND t.completedAt IS NOT NULL")
  BigDecimal findAverageAccuracyByUserId(@Param("userId") UUID userId);

  /**
   * Counts the total number of typing sessions for a user.
   *
   * @param userId the user ID
   * @return the total count of typing sessions
   */
  long countByUserId(UUID userId);

  /**
   * Counts the total number of completed typing sessions for a user.
   *
   * @param userId the user ID
   * @return the total count of completed typing sessions
   */
  long countByUserIdAndCompletedAtIsNotNull(UUID userId);

  /**
   * Finds the maximum accuracy achieved by a user.
   *
   * @param userId the user ID
   * @return the maximum accuracy, or null if no sessions found
   */
  @Query(
      "SELECT MAX(t.accuracy) FROM TypingSessionEntity t WHERE t.userId = :userId AND t.completedAt IS NOT NULL")
  BigDecimal findMaxAccuracyByUserId(@Param("userId") UUID userId);

  /**
   * Calculates the total characters typed by a user.
   *
   * @param userId the user ID
   * @return the total number of characters typed
   */
  @Query(
      "SELECT COALESCE(SUM(t.totalCharacters), 0) FROM TypingSessionEntity t WHERE t.userId = :userId AND t.completedAt IS NOT NULL")
  Long sumTotalCharactersByUserId(@Param("userId") UUID userId);

  /**
   * Calculates the total typing time for a user.
   *
   * @param userId the user ID
   * @return the total typing time in milliseconds
   */
  @Query(
      "SELECT COALESCE(SUM(t.durationMs), 0) FROM TypingSessionEntity t WHERE t.userId = :userId AND t.completedAt IS NOT NULL")
  Long sumDurationMsByUserId(@Param("userId") UUID userId);
}
