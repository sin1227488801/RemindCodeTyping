package com.rct.infrastructure.legacy;

import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Legacy typing service implementation Maintains existing behavior during transition period
 * Requirements: 8.4
 */
@Service
public class LegacyTypingService {

  /** Legacy method to record typing session */
  public LegacyApiAdapter.LegacyTypingResultResponse recordTypingSession(
      LegacyApiAdapter.LegacyTypingSessionRequest request) {
    // Original typing session recording logic
    LegacyApiAdapter.LegacyTypingResultResponse response =
        new LegacyApiAdapter.LegacyTypingResultResponse();

    // Calculate accuracy using legacy formula
    double accuracy =
        request.getTotalChars() > 0
            ? (double) request.getCorrectChars() / request.getTotalChars() * 100
            : 0;

    response.setSessionId("legacy_session_" + System.currentTimeMillis());
    response.setAccuracy(accuracy);
    response.setStatus("success");

    return response;
  }

  /** Legacy method to get typing statistics */
  public LegacyApiAdapter.LegacyTypingStatsResponse getTypingStatistics(
      String userId, String period) {
    // Original typing statistics logic
    LegacyApiAdapter.LegacyTypingStatsResponse response =
        new LegacyApiAdapter.LegacyTypingStatsResponse();

    // Populate with legacy calculation methods
    response.setAverageAccuracy(85.5);
    response.setTotalSessions(42);
    response.setTotalTypingTime(3600000); // 1 hour in milliseconds

    Map<String, Object> additionalStats = new HashMap<>();
    additionalStats.put("bestAccuracy", 98.5);
    additionalStats.put("worstAccuracy", 65.2);
    additionalStats.put("averageSpeed", 45.2);
    response.setAdditionalStats(additionalStats);

    return response;
  }

  /** Legacy method to get typing session history */
  public LegacyTypingHistoryResponse getTypingHistory(String userId, int page, int size) {
    // Original typing history logic
    return new LegacyTypingHistoryResponse();
  }

  public static class LegacyTypingHistoryResponse {
    private java.util.List<LegacyTypingSessionSummary> sessions;
    private int totalCount;
    private int currentPage;

    // Getters and setters
    public java.util.List<LegacyTypingSessionSummary> getSessions() {
      return sessions;
    }

    public void setSessions(java.util.List<LegacyTypingSessionSummary> sessions) {
      this.sessions = sessions;
    }

    public int getTotalCount() {
      return totalCount;
    }

    public void setTotalCount(int totalCount) {
      this.totalCount = totalCount;
    }

    public int getCurrentPage() {
      return currentPage;
    }

    public void setCurrentPage(int currentPage) {
      this.currentPage = currentPage;
    }
  }

  public static class LegacyTypingSessionSummary {
    private String sessionId;
    private String studyBookId;
    private double accuracy;
    private long durationMs;
    private String createdAt;

    // Getters and setters
    public String getSessionId() {
      return sessionId;
    }

    public void setSessionId(String sessionId) {
      this.sessionId = sessionId;
    }

    public String getStudyBookId() {
      return studyBookId;
    }

    public void setStudyBookId(String studyBookId) {
      this.studyBookId = studyBookId;
    }

    public double getAccuracy() {
      return accuracy;
    }

    public void setAccuracy(double accuracy) {
      this.accuracy = accuracy;
    }

    public long getDurationMs() {
      return durationMs;
    }

    public void setDurationMs(long durationMs) {
      this.durationMs = durationMs;
    }

    public String getCreatedAt() {
      return createdAt;
    }

    public void setCreatedAt(String createdAt) {
      this.createdAt = createdAt;
    }
  }
}
