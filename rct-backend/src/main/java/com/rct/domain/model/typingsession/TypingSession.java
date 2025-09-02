package com.rct.domain.model.typingsession;

import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.user.UserId;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * TypingSession domain entity representing a user's typing practice session. Encapsulates typing
 * session business logic and maintains invariants.
 */
public class TypingSession {
  private final TypingSessionId id;
  private final UserId userId;
  private final StudyBookId studyBookId;
  private final LocalDateTime startedAt;
  private TypingResult result;
  private LocalDateTime completedAt;
  private final LocalDateTime createdAt;

  private TypingSession(
      TypingSessionId id,
      UserId userId,
      StudyBookId studyBookId,
      LocalDateTime startedAt,
      TypingResult result,
      LocalDateTime completedAt,
      LocalDateTime createdAt) {
    this.id = Objects.requireNonNull(id, "TypingSession ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.studyBookId = Objects.requireNonNull(studyBookId, "StudyBook ID cannot be null");
    this.startedAt = Objects.requireNonNull(startedAt, "Started at cannot be null");
    this.result = result; // Can be null for incomplete sessions
    this.completedAt = completedAt; // Can be null for incomplete sessions
    this.createdAt = Objects.requireNonNull(createdAt, "Created at cannot be null");
  }

  /** Creates a new typing session that has just started. */
  public static TypingSession start(TypingSessionId id, UserId userId, StudyBookId studyBookId) {
    LocalDateTime now = LocalDateTime.now();
    return new TypingSession(id, userId, studyBookId, now, null, null, now);
  }

  /** Reconstructs a typing session from persistence (for repository implementations). */
  public static TypingSession reconstruct(
      TypingSessionId id,
      UserId userId,
      StudyBookId studyBookId,
      LocalDateTime startedAt,
      TypingResult result,
      LocalDateTime completedAt,
      LocalDateTime createdAt) {
    return new TypingSession(id, userId, studyBookId, startedAt, result, completedAt, createdAt);
  }

  /**
   * Completes the typing session by calculating the result from typed text and target text.
   * Business rule: A session can only be completed once.
   */
  public void complete(String typedText, String targetText) {
    Objects.requireNonNull(typedText, "Typed text cannot be null");
    Objects.requireNonNull(targetText, "Target text cannot be null");

    if (isCompleted()) {
      throw new IllegalStateException("Typing session is already completed");
    }

    LocalDateTime endTime = LocalDateTime.now();
    Duration sessionDuration = Duration.between(startedAt, endTime);

    this.result = TypingResult.fromComparison(typedText, targetText, sessionDuration);
    this.completedAt = endTime;
  }

  /**
   * Completes the typing session with a pre-calculated result. Business rule: A session can only be
   * completed once.
   */
  public void completeWithResult(TypingResult result) {
    Objects.requireNonNull(result, "Typing result cannot be null");

    if (isCompleted()) {
      throw new IllegalStateException("Typing session is already completed");
    }

    this.result = result;
    this.completedAt = LocalDateTime.now();
  }

  /** Checks if the typing session has been completed. */
  public boolean isCompleted() {
    return result != null && completedAt != null;
  }

  /** Checks if this session belongs to the specified user. */
  public boolean belongsToUser(UserId userId) {
    return this.userId.equals(userId);
  }

  /** Checks if this session is for the specified study book. */
  public boolean isForStudyBook(StudyBookId studyBookId) {
    return this.studyBookId.equals(studyBookId);
  }

  /** Gets the duration of the session if completed, or current duration if still in progress. */
  public Duration getCurrentDuration() {
    LocalDateTime endTime = isCompleted() ? completedAt : LocalDateTime.now();
    return Duration.between(startedAt, endTime);
  }

  /**
   * Checks if the session has been running for too long and should be considered abandoned.
   * Business rule: Sessions running for more than 1 hour are considered abandoned.
   */
  public boolean isAbandoned() {
    if (isCompleted()) {
      return false;
    }
    Duration currentDuration = getCurrentDuration();
    return currentDuration.getMilliseconds() > 3600000; // 1 hour
  }

  /** Gets the typing performance if the session is completed. */
  public TypingResult getResult() {
    if (!isCompleted()) {
      throw new IllegalStateException("Cannot get result from incomplete session");
    }
    return result;
  }

  // Getters
  public TypingSessionId getId() {
    return id;
  }

  public UserId getUserId() {
    return userId;
  }

  public StudyBookId getStudyBookId() {
    return studyBookId;
  }

  public LocalDateTime getStartedAt() {
    return startedAt;
  }

  public LocalDateTime getCompletedAt() {
    return completedAt;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    TypingSession that = (TypingSession) obj;
    return Objects.equals(id, that.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }

  @Override
  public String toString() {
    return String.format(
        "TypingSession{id=%s, userId=%s, studyBookId=%s, startedAt=%s, completed=%s}",
        id, userId, studyBookId, startedAt, isCompleted());
  }
}
