package com.rct.application.command;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;
import lombok.Data;

/** Command for recording typing results. */
@Data
public class RecordTypingResultCommand {
  private final UUID userId;
  private final UUID studyBookId;
  private final LocalDateTime startedAt;
  private final Long durationMs;
  private final Integer totalChars;
  private final Integer correctChars;

  public RecordTypingResultCommand(
      UUID userId,
      UUID studyBookId,
      LocalDateTime startedAt,
      Long durationMs,
      Integer totalChars,
      Integer correctChars) {
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.studyBookId = Objects.requireNonNull(studyBookId, "Study book ID cannot be null");
    this.startedAt = Objects.requireNonNull(startedAt, "Start time cannot be null");
    this.durationMs = Objects.requireNonNull(durationMs, "Duration cannot be null");
    this.totalChars = Objects.requireNonNull(totalChars, "Total chars cannot be null");
    this.correctChars = Objects.requireNonNull(correctChars, "Correct chars cannot be null");

    if (durationMs <= 0) {
      throw new IllegalArgumentException("Duration must be positive");
    }
    if (totalChars < 0) {
      throw new IllegalArgumentException("Total chars must be non-negative");
    }
    if (correctChars < 0) {
      throw new IllegalArgumentException("Correct chars must be non-negative");
    }
    if (correctChars > totalChars) {
      throw new IllegalArgumentException("Correct chars cannot exceed total chars");
    }
  }
}
