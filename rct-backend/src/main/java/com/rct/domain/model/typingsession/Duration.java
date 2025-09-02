package com.rct.domain.model.typingsession;

import java.util.Objects;

/**
 * Value object representing the duration of a typing session in milliseconds. Encapsulates
 * duration-related business logic and validation.
 */
public final class Duration {
  private final long milliseconds;

  private Duration(long milliseconds) {
    if (milliseconds < 0) {
      throw new IllegalArgumentException("Duration cannot be negative: " + milliseconds);
    }
    this.milliseconds = milliseconds;
  }

  public static Duration ofMilliseconds(long milliseconds) {
    return new Duration(milliseconds);
  }

  public static Duration ofSeconds(long seconds) {
    if (seconds < 0) {
      throw new IllegalArgumentException("Duration in seconds cannot be negative: " + seconds);
    }
    return new Duration(seconds * 1000);
  }

  public static Duration between(java.time.LocalDateTime start, java.time.LocalDateTime end) {
    Objects.requireNonNull(start, "Start time cannot be null");
    Objects.requireNonNull(end, "End time cannot be null");

    if (end.isBefore(start)) {
      throw new IllegalArgumentException("End time cannot be before start time");
    }

    long durationMs = java.time.Duration.between(start, end).toMillis();
    return new Duration(durationMs);
  }

  public long getMilliseconds() {
    return milliseconds;
  }

  public double getSeconds() {
    return milliseconds / 1000.0;
  }

  public double getMinutes() {
    return milliseconds / 60000.0;
  }

  /**
   * Checks if this duration is considered reasonable for a typing session. Business rule: Sessions
   * should be between 1 second and 1 hour.
   */
  public boolean isReasonable() {
    return milliseconds >= 1000 && milliseconds <= 3600000; // 1 second to 1 hour
  }

  /**
   * Calculates words per minute based on character count. Standard calculation: (characters / 5) /
   * (minutes)
   */
  public double calculateWordsPerMinute(int characterCount) {
    if (characterCount < 0) {
      throw new IllegalArgumentException("Character count cannot be negative");
    }
    if (milliseconds == 0) {
      return 0.0;
    }
    double minutes = getMinutes();
    return minutes > 0 ? (characterCount / 5.0) / minutes : 0.0;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    Duration duration = (Duration) obj;
    return milliseconds == duration.milliseconds;
  }

  @Override
  public int hashCode() {
    return Objects.hash(milliseconds);
  }

  @Override
  public String toString() {
    return String.format("Duration{%d ms (%.2f seconds)}", milliseconds, getSeconds());
  }
}
