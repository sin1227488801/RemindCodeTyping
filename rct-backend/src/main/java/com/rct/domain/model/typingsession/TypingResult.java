package com.rct.domain.model.typingsession;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Value object representing the result of a typing session. Encapsulates accuracy calculation and
 * typing performance metrics.
 */
public final class TypingResult {
  private final int totalCharacters;
  private final int correctCharacters;
  private final BigDecimal accuracy;
  private final Duration duration;

  private TypingResult(int totalCharacters, int correctCharacters, Duration duration) {
    if (totalCharacters < 0) {
      throw new IllegalArgumentException("Total characters cannot be negative: " + totalCharacters);
    }
    if (correctCharacters < 0) {
      throw new IllegalArgumentException(
          "Correct characters cannot be negative: " + correctCharacters);
    }
    if (correctCharacters > totalCharacters) {
      throw new IllegalArgumentException(
          "Correct characters ("
              + correctCharacters
              + ") cannot exceed total characters ("
              + totalCharacters
              + ")");
    }

    this.totalCharacters = totalCharacters;
    this.correctCharacters = correctCharacters;
    this.duration = Objects.requireNonNull(duration, "Duration cannot be null");
    this.accuracy = calculateAccuracy(totalCharacters, correctCharacters);
  }

  public static TypingResult create(int totalCharacters, int correctCharacters, Duration duration) {
    return new TypingResult(totalCharacters, correctCharacters, duration);
  }

  /**
   * Creates a TypingResult by comparing typed text with target text. Business logic for accuracy
   * calculation.
   */
  public static TypingResult fromComparison(
      String typedText, String targetText, Duration duration) {
    Objects.requireNonNull(typedText, "Typed text cannot be null");
    Objects.requireNonNull(targetText, "Target text cannot be null");
    Objects.requireNonNull(duration, "Duration cannot be null");

    int totalChars = targetText.length();
    int correctChars = calculateCorrectCharacters(typedText, targetText);

    return new TypingResult(totalChars, correctChars, duration);
  }

  /**
   * Calculates the number of correct characters by comparing typed and target text. Business rule:
   * Character-by-character comparison up to the length of typed text.
   */
  private static int calculateCorrectCharacters(String typedText, String targetText) {
    int correctCount = 0;
    int minLength = Math.min(typedText.length(), targetText.length());

    for (int i = 0; i < minLength; i++) {
      if (typedText.charAt(i) == targetText.charAt(i)) {
        correctCount++;
      }
    }

    return correctCount;
  }

  /**
   * Calculates accuracy as a percentage. Business rule: (correct characters / total characters) *
   * 100
   */
  private static BigDecimal calculateAccuracy(int totalCharacters, int correctCharacters) {
    if (totalCharacters == 0) {
      return BigDecimal.ZERO;
    }

    return BigDecimal.valueOf(correctCharacters)
        .divide(BigDecimal.valueOf(totalCharacters), 4, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100))
        .setScale(2, RoundingMode.HALF_UP);
  }

  /** Calculates words per minute based on the duration and character count. */
  public double getWordsPerMinute() {
    return duration.calculateWordsPerMinute(correctCharacters);
  }

  /**
   * Checks if the typing result meets minimum quality standards. Business rule: At least 80%
   * accuracy and reasonable duration.
   */
  public boolean meetsQualityStandards() {
    return accuracy.compareTo(BigDecimal.valueOf(80)) >= 0 && duration.isReasonable();
  }

  /** Gets the error rate as a percentage. */
  public BigDecimal getErrorRate() {
    return BigDecimal.valueOf(100).subtract(accuracy);
  }

  // Getters
  public int getTotalCharacters() {
    return totalCharacters;
  }

  public int getCorrectCharacters() {
    return correctCharacters;
  }

  public int getIncorrectCharacters() {
    return totalCharacters - correctCharacters;
  }

  public BigDecimal getAccuracy() {
    return accuracy;
  }

  public Duration getDuration() {
    return duration;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    TypingResult that = (TypingResult) obj;
    return totalCharacters == that.totalCharacters
        && correctCharacters == that.correctCharacters
        && Objects.equals(accuracy, that.accuracy)
        && Objects.equals(duration, that.duration);
  }

  @Override
  public int hashCode() {
    return Objects.hash(totalCharacters, correctCharacters, accuracy, duration);
  }

  @Override
  public String toString() {
    return String.format(
        "TypingResult{totalChars=%d, correctChars=%d, accuracy=%s%%, duration=%s, wpm=%.1f}",
        totalCharacters, correctCharacters, accuracy, duration, getWordsPerMinute());
  }
}
