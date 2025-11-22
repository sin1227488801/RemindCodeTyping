package com.rct.domain.model.typingsession;

import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.user.UserId;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for TypingSession domain entity. Defines contracts for data access without
 * implementation details.
 *
 * <p>Expected Behavior: - All methods should handle null parameters gracefully by throwing
 * IllegalArgumentException - Repository implementations should ensure data consistency and proper
 * transaction management - Queries should be optimized for performance with appropriate indexing -
 * All operations should be atomic and maintain referential integrity
 */
public interface TypingSessionRepository {

  /**
   * Saves a typing session to the repository.
   *
   * @param session the typing session to save (must not be null)
   * @return the saved typing session with updated metadata
   * @throws IllegalArgumentException if session is null
   */
  TypingSession save(TypingSession session);

  /**
   * Finds a typing session by its unique identifier.
   *
   * @param id the typing session ID (must not be null)
   * @return Optional containing the typing session if found, empty otherwise
   * @throws IllegalArgumentException if id is null
   */
  Optional<TypingSession> findById(TypingSessionId id);

  /**
   * Finds all typing sessions for a specific user. Results are ordered by start time in descending
   * order (most recent first).
   *
   * @param userId the user ID (must not be null)
   * @return list of typing sessions for the user, empty list if none found
   * @throws IllegalArgumentException if userId is null
   */
  List<TypingSession> findByUserId(UserId userId);

  /**
   * Finds typing sessions for a user within a date range. Results are ordered by start time in
   * descending order.
   *
   * @param userId the user ID (must not be null)
   * @param startDate the start date (inclusive, must not be null)
   * @param endDate the end date (inclusive, must not be null)
   * @return list of typing sessions within the date range
   * @throws IllegalArgumentException if any parameter is null or startDate is after endDate
   */
  List<TypingSession> findByUserIdAndDateRange(
      UserId userId, LocalDateTime startDate, LocalDateTime endDate);

  /**
   * Finds typing sessions for a specific study book. Useful for analyzing performance on specific
   * problems.
   *
   * @param studyBookId the study book ID (must not be null)
   * @return list of typing sessions for the study book
   * @throws IllegalArgumentException if studyBookId is null
   */
  List<TypingSession> findByStudyBookId(StudyBookId studyBookId);

  /**
   * Finds the most recent typing sessions for a user.
   *
   * @param userId the user ID (must not be null)
   * @param limit the maximum number of sessions to return (must be positive)
   * @return list of recent typing sessions, limited by the specified count
   * @throws IllegalArgumentException if userId is null or limit is not positive
   */
  List<TypingSession> findRecentByUserId(UserId userId, int limit);

  /**
   * Calculates the average accuracy for a user across all sessions.
   *
   * @param userId the user ID (must not be null)
   * @return the average accuracy as a percentage (0.0 to 100.0), or 0.0 if no sessions found
   * @throws IllegalArgumentException if userId is null
   */
  double calculateAverageAccuracy(UserId userId);

  /**
   * Counts the total number of typing sessions for a user.
   *
   * @param userId the user ID (must not be null)
   * @return the total count of typing sessions
   * @throws IllegalArgumentException if userId is null
   */
  long countByUserId(UserId userId);

  /**
   * Deletes a typing session by its ID.
   *
   * @param id the typing session ID (must not be null)
   * @return true if the session was deleted, false if it didn't exist
   * @throws IllegalArgumentException if id is null
   */
  boolean deleteById(TypingSessionId id);

  /**
   * Checks if a typing session exists with the given ID.
   *
   * @param id the typing session ID (must not be null)
   * @return true if the session exists, false otherwise
   * @throws IllegalArgumentException if id is null
   */
  boolean existsById(TypingSessionId id);
}
