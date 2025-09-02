package com.rct.domain.model.studybook;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Explanation Value Object Tests")
class ExplanationTest {

  @Nested
  @DisplayName("Creation Tests")
  class CreationTests {

    @Test
    @DisplayName("Should create explanation with valid content")
    void shouldCreateExplanationWithValidContent() {
      // Given
      String content = "This is a valid explanation";

      // When
      Explanation explanation = new Explanation(content);

      // Then
      assertThat(explanation.getContent()).isEqualTo(content);
      assertThat(explanation.getRawContent()).isEqualTo(content);
      assertThat(explanation.hasContent()).isTrue();
    }

    @Test
    @DisplayName("Should create explanation with null content")
    void shouldCreateExplanationWithNullContent() {
      // When
      Explanation explanation = new Explanation(null);

      // Then
      assertThat(explanation.getContent()).isEqualTo("");
      assertThat(explanation.getRawContent()).isNull();
      assertThat(explanation.hasContent()).isFalse();
    }

    @Test
    @DisplayName("Should create explanation with empty content")
    void shouldCreateExplanationWithEmptyContent() {
      // When
      Explanation explanation = new Explanation("");

      // Then
      assertThat(explanation.getContent()).isEqualTo("");
      assertThat(explanation.getRawContent()).isEqualTo("");
      assertThat(explanation.hasContent()).isFalse();
    }

    @Test
    @DisplayName("Should create explanation with whitespace-only content")
    void shouldCreateExplanationWithWhitespaceOnlyContent() {
      // Given
      String content = "   \t\n   ";

      // When
      Explanation explanation = new Explanation(content);

      // Then
      assertThat(explanation.getContent()).isEqualTo(content);
      assertThat(explanation.getRawContent()).isEqualTo(content);
      assertThat(explanation.hasContent()).isFalse();
    }
  }

  @Nested
  @DisplayName("Validation Tests")
  class ValidationTests {

    @Test
    @DisplayName("Should validate explanation with normal content")
    void shouldValidateExplanationWithNormalContent() {
      // Given
      Explanation explanation = new Explanation("This is a normal explanation");

      // When & Then
      assertThatCode(() -> explanation.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should validate explanation with null content")
    void shouldValidateExplanationWithNullContent() {
      // Given
      Explanation explanation = new Explanation(null);

      // When & Then
      assertThatCode(() -> explanation.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should validate explanation with empty content")
    void shouldValidateExplanationWithEmptyContent() {
      // Given
      Explanation explanation = new Explanation("");

      // When & Then
      assertThatCode(() -> explanation.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should validate explanation at maximum length")
    void shouldValidateExplanationAtMaximumLength() {
      // Given
      String content = "a".repeat(2000);
      Explanation explanation = new Explanation(content);

      // When & Then
      assertThatCode(() -> explanation.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when explanation exceeds maximum length")
    void shouldThrowExceptionWhenExplanationExceedsMaximumLength() {
      // Given
      String content = "a".repeat(2001);
      Explanation explanation = new Explanation(content);

      // When & Then
      assertThatThrownBy(() -> explanation.validate())
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Explanation cannot exceed 2000 characters");
    }
  }

  @Nested
  @DisplayName("Content Checking Tests")
  class ContentCheckingTests {

    @Test
    @DisplayName("Should return true for hasContent with meaningful text")
    void shouldReturnTrueForHasContentWithMeaningfulText() {
      // Given
      Explanation explanation = new Explanation("Meaningful explanation");

      // When & Then
      assertThat(explanation.hasContent()).isTrue();
    }

    @Test
    @DisplayName("Should return false for hasContent with null")
    void shouldReturnFalseForHasContentWithNull() {
      // Given
      Explanation explanation = new Explanation(null);

      // When & Then
      assertThat(explanation.hasContent()).isFalse();
    }

    @Test
    @DisplayName("Should return false for hasContent with empty string")
    void shouldReturnFalseForHasContentWithEmptyString() {
      // Given
      Explanation explanation = new Explanation("");

      // When & Then
      assertThat(explanation.hasContent()).isFalse();
    }

    @Test
    @DisplayName("Should return false for hasContent with whitespace only")
    void shouldReturnFalseForHasContentWithWhitespaceOnly() {
      // Given
      Explanation explanation = new Explanation("   \t\n   ");

      // When & Then
      assertThat(explanation.hasContent()).isFalse();
    }

    @Test
    @DisplayName("Should return content as empty string when null")
    void shouldReturnContentAsEmptyStringWhenNull() {
      // Given
      Explanation explanation = new Explanation(null);

      // When & Then
      assertThat(explanation.getContent()).isEqualTo("");
    }

    @Test
    @DisplayName("Should return raw content as null when null")
    void shouldReturnRawContentAsNullWhenNull() {
      // Given
      Explanation explanation = new Explanation(null);

      // When & Then
      assertThat(explanation.getRawContent()).isNull();
    }
  }

  @Nested
  @DisplayName("Equality and Hash Code Tests")
  class EqualityTests {

    @Test
    @DisplayName("Should be equal when content is equal")
    void shouldBeEqualWhenContentIsEqual() {
      // Given
      String content = "Same explanation content";
      Explanation explanation1 = new Explanation(content);
      Explanation explanation2 = new Explanation(content);

      // When & Then
      assertThat(explanation1).isEqualTo(explanation2);
      assertThat(explanation1.hashCode()).isEqualTo(explanation2.hashCode());
    }

    @Test
    @DisplayName("Should be equal when both content is null")
    void shouldBeEqualWhenBothContentIsNull() {
      // Given
      Explanation explanation1 = new Explanation(null);
      Explanation explanation2 = new Explanation(null);

      // When & Then
      assertThat(explanation1).isEqualTo(explanation2);
      assertThat(explanation1.hashCode()).isEqualTo(explanation2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal when content is different")
    void shouldNotBeEqualWhenContentIsDifferent() {
      // Given
      Explanation explanation1 = new Explanation("First explanation");
      Explanation explanation2 = new Explanation("Second explanation");

      // When & Then
      assertThat(explanation1).isNotEqualTo(explanation2);
    }

    @Test
    @DisplayName("Should not be equal when one is null and other is not")
    void shouldNotBeEqualWhenOneIsNullAndOtherIsNot() {
      // Given
      Explanation explanation1 = new Explanation(null);
      Explanation explanation2 = new Explanation("Some content");

      // When & Then
      assertThat(explanation1).isNotEqualTo(explanation2);
    }

    @Test
    @DisplayName("Should not be equal to null or different class")
    void shouldNotBeEqualToNullOrDifferentClass() {
      // Given
      Explanation explanation = new Explanation("Test explanation");

      // When & Then
      assertThat(explanation).isNotEqualTo(null);
      assertThat(explanation).isNotEqualTo("not an explanation");
    }

    @Test
    @DisplayName("Should be equal to itself")
    void shouldBeEqualToItself() {
      // Given
      Explanation explanation = new Explanation("Test explanation");

      // When & Then
      assertThat(explanation).isEqualTo(explanation);
    }
  }

  @Nested
  @DisplayName("String Representation Tests")
  class StringRepresentationTests {

    @Test
    @DisplayName("Should provide meaningful string representation for normal content")
    void shouldProvideMeaningfulStringRepresentationForNormalContent() {
      // Given
      String content = "This is a test explanation";
      Explanation explanation = new Explanation(content);

      // When
      String toString = explanation.toString();

      // Then
      assertThat(toString).contains("Explanation");
      assertThat(toString).contains(content);
    }

    @Test
    @DisplayName("Should provide meaningful string representation for null content")
    void shouldProvideMeaningfulStringRepresentationForNullContent() {
      // Given
      Explanation explanation = new Explanation(null);

      // When
      String toString = explanation.toString();

      // Then
      assertThat(toString).contains("Explanation");
      assertThat(toString).contains("null");
    }

    @Test
    @DisplayName("Should truncate long content in string representation")
    void shouldTruncateLongContentInStringRepresentation() {
      // Given
      String longContent = "a".repeat(100);
      Explanation explanation = new Explanation(longContent);

      // When
      String toString = explanation.toString();

      // Then
      assertThat(toString).contains("Explanation");
      assertThat(toString).contains("...");
      assertThat(toString.length()).isLessThan(longContent.length() + 50);
    }

    @Test
    @DisplayName("Should not truncate short content in string representation")
    void shouldNotTruncateShortContentInStringRepresentation() {
      // Given
      String shortContent = "Short explanation";
      Explanation explanation = new Explanation(shortContent);

      // When
      String toString = explanation.toString();

      // Then
      assertThat(toString).contains("Explanation");
      assertThat(toString).contains(shortContent);
      assertThat(toString).doesNotContain("...");
    }
  }
}
