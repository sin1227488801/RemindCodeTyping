package com.rct.domain.model.studybook;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Language Value Object Tests")
class LanguageTest {

  @Nested
  @DisplayName("Creation Tests")
  class CreationTests {

    @Test
    @DisplayName("Should create language with valid name")
    void shouldCreateLanguageWithValidName() {
      // Given
      String languageName = "Java";

      // When
      Language language = new Language(languageName);

      // Then
      assertThat(language.getValue()).isEqualTo(languageName);
    }

    @Test
    @DisplayName("Should create language with different valid names")
    void shouldCreateLanguageWithDifferentValidNames() {
      // Given & When & Then
      assertThatCode(() -> new Language("JavaScript")).doesNotThrowAnyException();
      assertThatCode(() -> new Language("Python")).doesNotThrowAnyException();
      assertThatCode(() -> new Language("C++")).doesNotThrowAnyException();
      assertThatCode(() -> new Language("C#")).doesNotThrowAnyException();
      assertThatCode(() -> new Language("TypeScript")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when creating with null name")
    void shouldThrowExceptionWhenCreatingWithNullName() {
      // When & Then
      assertThatThrownBy(() -> new Language(null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Language name cannot be null or empty");
    }

    @Test
    @DisplayName("Should throw exception when creating with empty name")
    void shouldThrowExceptionWhenCreatingWithEmptyName() {
      // When & Then
      assertThatThrownBy(() -> new Language(""))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Language name cannot be null or empty");
    }

    @Test
    @DisplayName("Should throw exception when creating with whitespace-only name")
    void shouldThrowExceptionWhenCreatingWithWhitespaceOnlyName() {
      // When & Then
      assertThatThrownBy(() -> new Language("   \t\n   "))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Language name cannot be null or empty");
    }
  }

  @Nested
  @DisplayName("Validation Tests")
  class ValidationTests {

    @Test
    @DisplayName("Should validate language with normal name")
    void shouldValidateLanguageWithNormalName() {
      // Given
      Language language = new Language("Java");

      // When & Then
      assertThatCode(() -> language.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should validate language at maximum length")
    void shouldValidateLanguageAtMaximumLength() {
      // Given
      String languageName = "a".repeat(50);
      Language language = new Language(languageName);

      // When & Then
      assertThatCode(() -> language.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when language name exceeds maximum length")
    void shouldThrowExceptionWhenLanguageNameExceedsMaximumLength() {
      // Given
      String languageName = "a".repeat(51);
      Language language = new Language(languageName);

      // When & Then
      assertThatThrownBy(() -> language.validate())
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Language name cannot exceed 50 characters");
    }

    @Test
    @DisplayName("Should validate language with special characters")
    void shouldValidateLanguageWithSpecialCharacters() {
      // Given
      Language language = new Language("C++");

      // When & Then
      assertThatCode(() -> language.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should validate language with numbers")
    void shouldValidateLanguageWithNumbers() {
      // Given
      Language language = new Language("Python3");

      // When & Then
      assertThatCode(() -> language.validate()).doesNotThrowAnyException();
    }
  }

  @Nested
  @DisplayName("Equality and Hash Code Tests")
  class EqualityTests {

    @Test
    @DisplayName("Should be equal when language names are equal")
    void shouldBeEqualWhenLanguageNamesAreEqual() {
      // Given
      String languageName = "JavaScript";
      Language language1 = new Language(languageName);
      Language language2 = new Language(languageName);

      // When & Then
      assertThat(language1).isEqualTo(language2);
      assertThat(language1.hashCode()).isEqualTo(language2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal when language names are different")
    void shouldNotBeEqualWhenLanguageNamesAreDifferent() {
      // Given
      Language language1 = new Language("Java");
      Language language2 = new Language("Python");

      // When & Then
      assertThat(language1).isNotEqualTo(language2);
    }

    @Test
    @DisplayName("Should be case sensitive in equality")
    void shouldBeCaseSensitiveInEquality() {
      // Given
      Language language1 = new Language("Java");
      Language language2 = new Language("java");

      // When & Then
      assertThat(language1).isNotEqualTo(language2);
    }

    @Test
    @DisplayName("Should not be equal to null or different class")
    void shouldNotBeEqualToNullOrDifferentClass() {
      // Given
      Language language = new Language("Java");

      // When & Then
      assertThat(language).isNotEqualTo(null);
      assertThat(language).isNotEqualTo("Java");
    }

    @Test
    @DisplayName("Should be equal to itself")
    void shouldBeEqualToItself() {
      // Given
      Language language = new Language("Java");

      // When & Then
      assertThat(language).isEqualTo(language);
    }
  }

  @Nested
  @DisplayName("String Representation Tests")
  class StringRepresentationTests {

    @Test
    @DisplayName("Should provide meaningful string representation")
    void shouldProvideMeaningfulStringRepresentation() {
      // Given
      String languageName = "TypeScript";
      Language language = new Language(languageName);

      // When
      String toString = language.toString();

      // Then
      assertThat(toString).contains("Language");
      assertThat(toString).contains(languageName);
    }

    @Test
    @DisplayName("Should handle special characters in string representation")
    void shouldHandleSpecialCharactersInStringRepresentation() {
      // Given
      String languageName = "C++";
      Language language = new Language(languageName);

      // When
      String toString = language.toString();

      // Then
      assertThat(toString).contains("Language");
      assertThat(toString).contains("C++");
    }
  }

  @Nested
  @DisplayName("Business Logic Tests")
  class BusinessLogicTests {

    @Test
    @DisplayName("Should return correct value")
    void shouldReturnCorrectValue() {
      // Given
      String languageName = "Kotlin";
      Language language = new Language(languageName);

      // When
      String value = language.getValue();

      // Then
      assertThat(value).isEqualTo(languageName);
    }

    @Test
    @DisplayName("Should preserve original casing")
    void shouldPreserveOriginalCasing() {
      // Given
      String languageName = "JavaScript";
      Language language = new Language(languageName);

      // When
      String value = language.getValue();

      // Then
      assertThat(value).isEqualTo("JavaScript");
      assertThat(value).isNotEqualTo("javascript");
      assertThat(value).isNotEqualTo("JAVASCRIPT");
    }
  }
}
