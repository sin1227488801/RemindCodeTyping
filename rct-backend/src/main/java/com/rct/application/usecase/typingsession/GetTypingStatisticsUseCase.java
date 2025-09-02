package com.rct.application.usecase.typingsession;

import com.rct.domain.model.typingsession.TypingSession;
import com.rct.domain.model.typingsession.TypingSessionRepository;
import com.rct.domain.model.user.UserId;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case for retrieving typing statistics for a user. Handles the business logic for calculating
 * and returning typing performance statistics.
 *
 * <p>This use case follows the Single Responsibility Principle by focusing solely on typing
 * statistics calculation logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GetTypingStatisticsUseCase {

  private final TypingSessionRepository typingSessionRepository;

  /**
   * Retrieves typing statistics for a user.
   *
   * @param query the query containing user and time range information
   * @return the statistics result
   * @throws IllegalArgumentException if query is null
   */
  @Transactional(readOnly = true)
  public TypingStatisticsResult execute(TypingStatisticsQuery query) {
    Objects.requireNonNull(query, "Typing statistics query cannot be null");

    log.debug(
        "Retrieving typing statistics for user: {} from {} to {}",
        query.getUserId(),
        query.getFromDate(),
        query.getToDate());

    try {
      UserId userId = UserId.of(query.getUserId());
      List<TypingSession> sessions =
          typingSessionRepository.findCompletedSessionsByUserAndDateRange(
              userId, query.getFromDate(), query.getToDate());

      TypingStatistics statistics = calculateStatistics(sessions);

      log.debug(
          "Calculated typing statistics for user: {} - {} sessions, avg accuracy: {}%",
          userId, statistics.getTotalSessions(), statistics.getAverageAccuracy());

      return TypingStatisticsResult.success(statistics);
    } catch (Exception e) {
      log.error("Failed to retrieve typing statistics for user: {}", query.getUserId(), e);
      return TypingStatisticsResult.failure(
          "Failed to retrieve typing statistics: " + e.getMessage());
    }
  }

  private TypingStatistics calculateStatistics(List<TypingSession> sessions) {
    if (sessions.isEmpty()) {
      return new TypingStatistics(0, 0.0, 0.0, 0.0, 0L, 0L);
    }

    int totalSessions = sessions.size();
    double totalAccuracy =
        sessions.stream().mapToDouble(session -> session.getResult().getAccuracy()).sum();
    double averageAccuracy = totalAccuracy / totalSessions;

    double maxAccuracy =
        sessions.stream()
            .mapToDouble(session -> session.getResult().getAccuracy())
            .max()
            .orElse(0.0);

    double minAccuracy =
        sessions.stream()
            .mapToDouble(session -> session.getResult().getAccuracy())
            .min()
            .orElse(0.0);

    long totalCharacters =
        sessions.stream().mapToLong(session -> session.getResult().getTotalCharacters()).sum();

    long totalCorrectCharacters =
        sessions.stream().mapToLong(session -> session.getResult().getCorrectCharacters()).sum();

    return new TypingStatistics(
        totalSessions,
        averageAccuracy,
        maxAccuracy,
        minAccuracy,
        totalCharacters,
        totalCorrectCharacters);
  }

  /** Query object for typing statistics request. */
  public static class TypingStatisticsQuery {
    private final UUID userId;
    private final LocalDateTime fromDate;
    private final LocalDateTime toDate;

    public TypingStatisticsQuery(UUID userId, LocalDateTime fromDate, LocalDateTime toDate) {
      this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
      this.fromDate = fromDate; // Can be null for no start limit
      this.toDate = toDate; // Can be null for no end limit

      if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
        throw new IllegalArgumentException("From date cannot be after to date");
      }
    }

    public UUID getUserId() {
      return userId;
    }

    public LocalDateTime getFromDate() {
      return fromDate;
    }

    public LocalDateTime getToDate() {
      return toDate;
    }
  }

  /** Statistics data object. */
  public static class TypingStatistics {
    private final int totalSessions;
    private final double averageAccuracy;
    private final double maxAccuracy;
    private final double minAccuracy;
    private final long totalCharacters;
    private final long totalCorrectCharacters;

    public TypingStatistics(
        int totalSessions,
        double averageAccuracy,
        double maxAccuracy,
        double minAccuracy,
        long totalCharacters,
        long totalCorrectCharacters) {
      this.totalSessions = totalSessions;
      this.averageAccuracy = averageAccuracy;
      this.maxAccuracy = maxAccuracy;
      this.minAccuracy = minAccuracy;
      this.totalCharacters = totalCharacters;
      this.totalCorrectCharacters = totalCorrectCharacters;
    }

    public int getTotalSessions() {
      return totalSessions;
    }

    public double getAverageAccuracy() {
      return averageAccuracy;
    }

    public double getMaxAccuracy() {
      return maxAccuracy;
    }

    public double getMinAccuracy() {
      return minAccuracy;
    }

    public long getTotalCharacters() {
      return totalCharacters;
    }

    public long getTotalCorrectCharacters() {
      return totalCorrectCharacters;
    }
  }

  /** Result object for typing statistics response. */
  public static class TypingStatisticsResult {
    private final boolean success;
    private final TypingStatistics statistics;
    private final String errorMessage;

    private TypingStatisticsResult(
        boolean success, TypingStatistics statistics, String errorMessage) {
      this.success = success;
      this.statistics = statistics;
      this.errorMessage = errorMessage;
    }

    public static TypingStatisticsResult success(TypingStatistics statistics) {
      return new TypingStatisticsResult(true, statistics, null);
    }

    public static TypingStatisticsResult failure(String errorMessage) {
      return new TypingStatisticsResult(false, null, errorMessage);
    }

    public boolean isSuccess() {
      return success;
    }

    public TypingStatistics getStatistics() {
      return statistics;
    }

    public String getErrorMessage() {
      return errorMessage;
    }
  }
}
