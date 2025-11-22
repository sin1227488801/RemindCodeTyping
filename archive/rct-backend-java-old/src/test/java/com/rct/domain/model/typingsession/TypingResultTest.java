package com.rct.domain.model.typingsession;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class TypingResultTest {

  @Test
  void shouldCreateTypingResultWithValidParameters() {
    // Given
    int totalChars = 100;
    int correctChars = 85;
    Duration duration = Duration.ofSeconds(60);

    // When
    TypingResult result = TypingResult.create(totalChars, correctChars, duration);

    // Then
    assertThat(result.getTotalCharacters()).isEqualTo(100);
    assertThat(result.getCorrectCharacters()).isEqualTo(85);
    assertThat(result.getIncorrectCharacters()).isEqualTo(15);
    assertThat(result.getAccuracy()).isEqualTo(new BigDecimal("85.00"));
    assertThat(result.getDuration()).isEqualTo(duration);
  }

  @Test
  void shouldCreateTypingResultFromTextComparison() {
    // Given
    String typedText = "Hello World";
    String targetText = "Hello World";
    Duration duration = Duration.ofSeconds(30);

    // When
    TypingResult result = TypingResult.fromComparison(typedText, targetText, duration);

    // Then
    assertThat(result.getTotalCharacters()).isEqualTo(11);
    assertThat(result.getCorrectCharacters()).isEqualTo(11);
    assertThat(result.getAccuracy()).isEqualTo(new BigDecimal("100.00"));
  }

  @Test
  void shouldCalculateCorrectCharactersWithPartialMatch() {
    // Given
    String typedText = "Hello Wrold"; // "World" misspelled as "Wrold"
    String targetText = "Hello World";
    Duration duration = Duration.ofSeconds(30);

    // When
    TypingResult result = TypingResult.fromComparison(typedText, targetText, duration);

    // Then
    assertThat(result.getTotalCharacters()).isEqualTo(11);
    assertThat(result.getCorrectCharacters()).isEqualTo(9); // "Hello Wr" matches, "old" doesn't
    assertThat(result.getAccuracy()).isEqualTo(new BigDecimal("81.82"));
  }

  @Test
  void shouldHandleTypedTextShorterThanTarget() {
    // Given
    String typedText = "Hello";
    String targetText = "Hello World";
    Duration duration = Duration.ofSeconds(30);

    // When
    TypingResult result = TypingResult.fromComparison(typedText, targetText, duration);

    // Then
    assertThat(result.getTotalCharacters()).isEqualTo(11);
    assertThat(result.getCorrectCharacters()).isEqualTo(5); // Only "Hello" matches
    assertThat(result.getAccuracy()).isEqualTo(new BigDecimal("45.45"));
  }

  @Test
  void shouldHandleTypedTextLongerThanTarget() {
    // Given
    String typedText = "Hello World Extra";
    String targetText = "Hello World";
    Duration duration = Duration.ofSeconds(30);

    // When
    TypingResult result = TypingResult.fromComparison(typedText, targetText, duration);

    // Then
    assertThat(result.getTotalCharacters()).isEqualTo(11);
    assertThat(result.getCorrectCharacters()).isEqualTo(11); // All target characters match
    assertThat(result.getAccuracy()).isEqualTo(new BigDecimal("100.00"));
  }

  @Test
  void shouldCalculateZeroAccuracyForZeroTotalCharacters() {
    // Given
    String typedText = "";
    String targetText = "";
    Duration duration = Duration.ofSeconds(30);

    // When
    TypingResult result = TypingResult.fromComparison(typedText, targetText, duration);

    // Then
    assertThat(result.getTotalCharacters()).isEqualTo(0);
    assertThat(result.getCorrectCharacters()).isEqualTo(0);
    assertThat(result.getAccuracy()).isEqualTo(BigDecimal.ZERO);
  }

  @Test
  void shouldThrowExceptionForNegativeTotalCharacters() {
    // Given
    Duration duration = Duration.ofSeconds(30);

    // When & Then
    assertThatThrownBy(() -> TypingResult.create(-1, 0, duration))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Total characters cannot be negative: -1");
  }

  @Test
  void shouldThrowExceptionForNegativeCorrectCharacters() {
    // Given
    Duration duration = Duration.ofSeconds(30);

    // When & Then
    assertThatThrownBy(() -> TypingResult.create(100, -1, duration))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Correct characters cannot be negative: -1");
  }

  @Test
  void shouldThrowExceptionWhenCorrectCharactersExceedTotal() {
    // Given
    Duration duration = Duration.ofSeconds(30);

    // When & Then
    assertThatThrownBy(() -> TypingResult.create(50, 60, duration))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Correct characters (60) cannot exceed total characters (50)");
  }

  @Test
  void shouldThrowExceptionForNullDuration() {
    // When & Then
    assertThatThrownBy(() -> TypingResult.create(100, 85, null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Duration cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullTypedText() {
    // Given
    String targetText = "Hello World";
    Duration duration = Duration.ofSeconds(30);

    // When & Then
    assertThatThrownBy(() -> TypingResult.fromComparison(null, targetText, duration))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Typed text cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullTargetText() {
    // Given
    String typedText = "Hello World";
    Duration duration = Duration.ofSeconds(30);

    // When & Then
    assertThatThrownBy(() -> TypingResult.fromComparison(typedText, null, duration))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Target text cannot be null");
  }

  @Test
  void shouldCalculateWordsPerMinute() {
    // Given
    int totalChars = 300; // 60 words
    int correctChars = 250; // 50 words
    Duration duration = Duration.ofSeconds(60); // 1 minute
    TypingResult result = TypingResult.create(totalChars, correctChars, duration);

    // When
    double wpm = result.getWordsPerMinute();

    // Then
    assertThat(wpm).isEqualTo(50.0); // 250 correct chars / 5 chars per word / 1 minute
  }

  @Test
  void shouldReturnTrueForQualityStandardsWhenHighAccuracyAndReasonableDuration() {
    // Given
    int totalChars = 100;
    int correctChars = 85; // 85% accuracy
    Duration reasonableDuration = Duration.ofSeconds(60);
    TypingResult result = TypingResult.create(totalChars, correctChars, reasonableDuration);

    // When & Then
    assertThat(result.meetsQualityStandards()).isTrue();
  }

  @Test
  void shouldReturnFalseForQualityStandardsWhenLowAccuracy() {
    // Given
    int totalChars = 100;
    int correctChars = 70; // 70% accuracy (below 80% threshold)
    Duration reasonableDuration = Duration.ofSeconds(60);
    TypingResult result = TypingResult.create(totalChars, correctChars, reasonableDuration);

    // When & Then
    assertThat(result.meetsQualityStandards()).isFalse();
  }

  @Test
  void shouldReturnFalseForQualityStandardsWhenUnreasonableDuration() {
    // Given
    int totalChars = 100;
    int correctChars = 90; // 90% accuracy (good)
    Duration unreasonableDuration = Duration.ofMilliseconds(500); // Too short
    TypingResult result = TypingResult.create(totalChars, correctChars, unreasonableDuration);

    // When & Then
    assertThat(result.meetsQualityStandards()).isFalse();
  }

  @Test
  void shouldCalculateErrorRate() {
    // Given
    int totalChars = 100;
    int correctChars = 85; // 85% accuracy
    Duration duration = Duration.ofSeconds(60);
    TypingResult result = TypingResult.create(totalChars, correctChars, duration);

    // When
    BigDecimal errorRate = result.getErrorRate();

    // Then
    assertThat(errorRate).isEqualTo(new BigDecimal("15.00")); // 100% - 85% = 15%
  }

  @Test
  void shouldBeEqualWhenSameValues() {
    // Given
    Duration duration = Duration.ofSeconds(60);
    TypingResult result1 = TypingResult.create(100, 85, duration);
    TypingResult result2 = TypingResult.create(100, 85, duration);

    // When & Then
    assertThat(result1).isEqualTo(result2);
    assertThat(result1.hashCode()).isEqualTo(result2.hashCode());
  }

  @Test
  void shouldNotBeEqualWhenDifferentValues() {
    // Given
    Duration duration = Duration.ofSeconds(60);
    TypingResult result1 = TypingResult.create(100, 85, duration);
    TypingResult result2 = TypingResult.create(100, 80, duration);

    // When & Then
    assertThat(result1).isNotEqualTo(result2);
  }

  @Test
  void shouldHaveDescriptiveToString() {
    // Given
    Duration duration = Duration.ofSeconds(60);
    TypingResult result = TypingResult.create(100, 85, duration);

    // When
    String resultString = result.toString();

    // Then
    assertThat(resultString).contains("totalChars=100");
    assertThat(resultString).contains("correctChars=85");
    assertThat(resultString).contains("accuracy=85.00%");
    assertThat(resultString).contains("wpm=17.0");
  }
}
