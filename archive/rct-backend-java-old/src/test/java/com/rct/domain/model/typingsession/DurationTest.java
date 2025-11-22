package com.rct.domain.model.typingsession;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class DurationTest {

  @Test
  void shouldCreateDurationFromMilliseconds() {
    // Given
    long milliseconds = 5000;

    // When
    Duration duration = Duration.ofMilliseconds(milliseconds);

    // Then
    assertThat(duration.getMilliseconds()).isEqualTo(5000);
    assertThat(duration.getSeconds()).isEqualTo(5.0);
  }

  @Test
  void shouldCreateDurationFromSeconds() {
    // Given
    long seconds = 30;

    // When
    Duration duration = Duration.ofSeconds(seconds);

    // Then
    assertThat(duration.getMilliseconds()).isEqualTo(30000);
    assertThat(duration.getSeconds()).isEqualTo(30.0);
    assertThat(duration.getMinutes()).isEqualTo(0.5);
  }

  @Test
  void shouldCreateDurationBetweenTwoTimes() {
    // Given
    LocalDateTime start = LocalDateTime.of(2024, 1, 1, 10, 0, 0);
    LocalDateTime end = LocalDateTime.of(2024, 1, 1, 10, 2, 30); // 2 minutes 30 seconds later

    // When
    Duration duration = Duration.between(start, end);

    // Then
    assertThat(duration.getMilliseconds())
        .isEqualTo(150000); // 2.5 minutes = 150 seconds = 150000 ms
    assertThat(duration.getSeconds()).isEqualTo(150.0);
    assertThat(duration.getMinutes()).isEqualTo(2.5);
  }

  @Test
  void shouldThrowExceptionForNegativeMilliseconds() {
    // When & Then
    assertThatThrownBy(() -> Duration.ofMilliseconds(-1000))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Duration cannot be negative: -1000");
  }

  @Test
  void shouldThrowExceptionForNegativeSeconds() {
    // When & Then
    assertThatThrownBy(() -> Duration.ofSeconds(-10))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Duration in seconds cannot be negative: -10");
  }

  @Test
  void shouldThrowExceptionWhenEndTimeIsBeforeStartTime() {
    // Given
    LocalDateTime start = LocalDateTime.of(2024, 1, 1, 10, 0, 0);
    LocalDateTime end = LocalDateTime.of(2024, 1, 1, 9, 0, 0); // 1 hour before start

    // When & Then
    assertThatThrownBy(() -> Duration.between(start, end))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("End time cannot be before start time");
  }

  @Test
  void shouldThrowExceptionForNullStartTime() {
    // Given
    LocalDateTime end = LocalDateTime.now();

    // When & Then
    assertThatThrownBy(() -> Duration.between(null, end))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Start time cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullEndTime() {
    // Given
    LocalDateTime start = LocalDateTime.now();

    // When & Then
    assertThatThrownBy(() -> Duration.between(start, null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("End time cannot be null");
  }

  @Test
  void shouldReturnTrueForReasonableDuration() {
    // Given
    Duration shortDuration = Duration.ofSeconds(30); // 30 seconds
    Duration mediumDuration = Duration.ofSeconds(300); // 5 minutes
    Duration longDuration = Duration.ofSeconds(1800); // 30 minutes

    // When & Then
    assertThat(shortDuration.isReasonable()).isTrue();
    assertThat(mediumDuration.isReasonable()).isTrue();
    assertThat(longDuration.isReasonable()).isTrue();
  }

  @Test
  void shouldReturnFalseForUnreasonableDuration() {
    // Given
    Duration tooShort = Duration.ofMilliseconds(500); // 0.5 seconds
    Duration tooLong = Duration.ofSeconds(4000); // More than 1 hour

    // When & Then
    assertThat(tooShort.isReasonable()).isFalse();
    assertThat(tooLong.isReasonable()).isFalse();
  }

  @Test
  void shouldCalculateWordsPerMinuteCorrectly() {
    // Given
    Duration oneMinute = Duration.ofSeconds(60);
    int charactersTyped = 250; // 50 words (250 chars / 5 chars per word)

    // When
    double wpm = oneMinute.calculateWordsPerMinute(charactersTyped);

    // Then
    assertThat(wpm).isEqualTo(50.0);
  }

  @Test
  void shouldCalculateWordsPerMinuteForPartialMinute() {
    // Given
    Duration thirtySeconds = Duration.ofSeconds(30);
    int charactersTyped = 125; // 25 words in 30 seconds = 50 WPM

    // When
    double wpm = thirtySeconds.calculateWordsPerMinute(charactersTyped);

    // Then
    assertThat(wpm).isEqualTo(50.0);
  }

  @Test
  void shouldReturnZeroWPMForZeroDuration() {
    // Given
    Duration zeroDuration = Duration.ofMilliseconds(0);
    int charactersTyped = 100;

    // When
    double wpm = zeroDuration.calculateWordsPerMinute(charactersTyped);

    // Then
    assertThat(wpm).isEqualTo(0.0);
  }

  @Test
  void shouldThrowExceptionForNegativeCharacterCount() {
    // Given
    Duration duration = Duration.ofSeconds(60);

    // When & Then
    assertThatThrownBy(() -> duration.calculateWordsPerMinute(-10))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Character count cannot be negative");
  }

  @Test
  void shouldBeEqualWhenSameMilliseconds() {
    // Given
    Duration duration1 = Duration.ofMilliseconds(5000);
    Duration duration2 = Duration.ofSeconds(5);

    // When & Then
    assertThat(duration1).isEqualTo(duration2);
    assertThat(duration1.hashCode()).isEqualTo(duration2.hashCode());
  }

  @Test
  void shouldNotBeEqualWhenDifferentMilliseconds() {
    // Given
    Duration duration1 = Duration.ofSeconds(5);
    Duration duration2 = Duration.ofSeconds(10);

    // When & Then
    assertThat(duration1).isNotEqualTo(duration2);
  }

  @Test
  void shouldHaveDescriptiveToString() {
    // Given
    Duration duration = Duration.ofMilliseconds(5500);

    // When
    String result = duration.toString();

    // Then
    assertThat(result).contains("5500 ms");
    assertThat(result).contains("5.50 seconds");
  }
}
