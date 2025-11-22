package com.rct.domain.model.studybook;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Question Value Object Tests")
class QuestionTest {

  @Nested
  @DisplayName("Creation Tests")
  class CreationTests {

    @Test
    @DisplayName("Should create question with valid content")
    void shouldCreateQuestionWithValidContent() {
      // Given
      String content = "Write a function to calculate factorial";

      // When
      Question question = new Question(content);

      // Then
      assertThat(question.getContent()).isEqualTo(content);
    }

    @Test
    @DisplayName("Should create question with multiline content")
    void shouldCreateQuestionWithMultilineContent() {
      // Given
      String content =
          "Write a function that:\n1. Takes a number as input\n2. Returns its factorial";

      // When
      Question question = new Question(content);

      // Then
      assertThat(question.getContent()).isEqualTo(content);
    }

    @Test
    @DisplayName("Should throw exception when creating with null content")
    void shouldThrowExceptionWhenCreatingWithNullContent() {
      // When & Then
      assertThatThrownBy(() -> new Question(null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Question content cannot be null or empty");
    }

    @Test
    @DisplayName("Should throw exception when creating with empty content")
    void shouldThrowExceptionWhenCreatingWithEmptyContent() {
      // When & Then
      assertThatThrownBy(() -> new Question(""))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Question content cannot be null or empty");
    }

    @Test
    @DisplayName("Should throw exception when creating with whitespace-only content")
    void shouldThrowExceptionWhenCreatingWithWhitespaceOnlyContent() {
      // When & Then
      assertThatThrownBy(() -> new Question("   \t\n   "))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Question content cannot be null or empty");
    }
  }

  @Nested
  @DisplayName("Validation Tests")
  class ValidationTests {

    @Test
    @DisplayName("Should validate question with normal content")
    void shouldValidateQuestionWithNormalContent() {
      // Given
      Question question = new Question("Write a hello world program");

      // When & Then
      assertThatCode(() -> question.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should validate question with minimum length")
    void shouldValidateQuestionWithMinimumLength() {
      // Given
      Question question = new Question("a".repeat(10));

      // When & Then
      assertThatCode(() -> question.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when question is too short")
    void shouldThrowExceptionWhenQuestionIsTooShort() {
      // Given
      Question question = new Question("short");

      // When & Then
      assertThatThrownBy(() -> question.validate())
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Question content must be at least 10 characters long");
    }

    @Test
    @DisplayName("Should validate question at maximum length")
    void shouldValidateQuestionAtMaximumLength() {
      // Given
      String content = "a".repeat(5000);
      Question question = new Question(content);

      // When & Then
      assertThatCode(() -> question.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when question exceeds maximum length")
    void shouldThrowExceptionWhenQuestionExceedsMaximumLength() {
      // Given
      String content = "a".repeat(5001);
      Question question = new Question(content);

      // When & Then
      assertThatThrownBy(() -> question.validate())
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Question content cannot exceed 5000 characters");
    }

    @Test
    @DisplayName("Should validate question with special characters")
    void shouldValidateQuestionWithSpecialCharacters() {
      // Given
      Question question = new Question("Write a function that uses @, #, $, %, and other symbols");

      // When & Then
      assertThatCode(() -> question.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should validate question with code snippets")
    void shouldValidateQuestionWithCodeSnippets() {
      // Given
      String content = "Complete this function: public int add(int a, int b) { return ___; }";
      Question question = new Question(content);

      // When & Then
      assertThatCode(() -> question.validate()).doesNotThrowAnyException();
    }
  }

  @Nested
  @DisplayName("Content Analysis Tests")
  class ContentAnalysisTests {

    @Test
    @DisplayName("Should return correct character count")
    void shouldReturnCorrectCharacterCount() {
      // Given
      String content = "Write a function to reverse a string";
      Question question = new Question(content);

      // When
      int length = question.getLength();

      // Then
      assertThat(length).isEqualTo(content.length());
    }

    @Test
    @DisplayName("Should detect if question contains code")
    void shouldDetectIfQuestionContainsCode() {
      // Given
      Question codeQuestion =
          new Question("Complete: public void main() { System.out.println(); }");
      Question textQuestion = new Question("Write a function to calculate the sum of two numbers");

      // When & Then
      assertThat(codeQuestion.containsCode()).isTrue();
      assertThat(textQuestion.containsCode()).isFalse();
    }

    @Test
    @DisplayName("Should detect code with various programming constructs")
    void shouldDetectCodeWithVariousProgrammingConstructs() {
      // Given & When & Then
      assertThat(new Question("function test() { return true; }").containsCode()).isTrue();
      assertThat(new Question("if (condition) { doSomething(); }").containsCode()).isTrue();
      assertThat(new Question("for (int i = 0; i < 10; i++) {}").containsCode()).isTrue();
      assertThat(new Question("class MyClass extends BaseClass").containsCode()).isTrue();
      assertThat(new Question("import java.util.List;").containsCode()).isTrue();
      assertThat(new Question("const variable = 'value';").containsCode()).isTrue();
    }

    @Test
    @DisplayName("Should not detect code in regular text")
    void shouldNotDetectCodeInRegularText() {
      // Given & When & Then
      assertThat(new Question("Write a program that calculates factorial").containsCode())
          .isFalse();
      assertThat(new Question("Explain the concept of inheritance").containsCode()).isFalse();
      assertThat(new Question("What is the difference between class and object").containsCode())
          .isFalse();
    }

    @Test
    @DisplayName("Should check if question is multiline")
    void shouldCheckIfQuestionIsMultiline() {
      // Given
      Question singleLine = new Question("Write a simple function");
      Question multiLine =
          new Question("Write a function that:\n1. Takes input\n2. Returns output");

      // When & Then
      assertThat(singleLine.isMultiline()).isFalse();
      assertThat(multiLine.isMultiline()).isTrue();
    }
  }

  @Nested
  @DisplayName("Equality and Hash Code Tests")
  class EqualityTests {

    @Test
    @DisplayName("Should be equal when content is equal")
    void shouldBeEqualWhenContentIsEqual() {
      // Given
      String content = "Write a function to sort an array";
      Question question1 = new Question(content);
      Question question2 = new Question(content);

      // When & Then
      assertThat(question1).isEqualTo(question2);
      assertThat(question1.hashCode()).isEqualTo(question2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal when content is different")
    void shouldNotBeEqualWhenContentIsDifferent() {
      // Given
      Question question1 = new Question("Write a function to sort an array");
      Question question2 = new Question("Write a function to reverse an array");

      // When & Then
      assertThat(question1).isNotEqualTo(question2);
    }

    @Test
    @DisplayName("Should be case sensitive in equality")
    void shouldBeCaseSensitiveInEquality() {
      // Given
      Question question1 = new Question("Write a Function");
      Question question2 = new Question("Write a function");

      // When & Then
      assertThat(question1).isNotEqualTo(question2);
    }

    @Test
    @DisplayName("Should not be equal to null or different class")
    void shouldNotBeEqualToNullOrDifferentClass() {
      // Given
      Question question = new Question("Test question content");

      // When & Then
      assertThat(question).isNotEqualTo(null);
      assertThat(question).isNotEqualTo("Test question content");
    }

    @Test
    @DisplayName("Should be equal to itself")
    void shouldBeEqualToItself() {
      // Given
      Question question = new Question("Test question content");

      // When & Then
      assertThat(question).isEqualTo(question);
    }
  }

  @Nested
  @DisplayName("String Representation Tests")
  class StringRepresentationTests {

    @Test
    @DisplayName("Should provide meaningful string representation for short content")
    void shouldProvideMeaningfulStringRepresentationForShortContent() {
      // Given
      String content = "Short question";
      Question question = new Question(content);

      // When
      String toString = question.toString();

      // Then
      assertThat(toString).contains("Question");
      assertThat(toString).contains(content);
      assertThat(toString).doesNotContain("...");
    }

    @Test
    @DisplayName("Should truncate long content in string representation")
    void shouldTruncateLongContentInStringRepresentation() {
      // Given
      String longContent = "a".repeat(200);
      Question question = new Question(longContent);

      // When
      String toString = question.toString();

      // Then
      assertThat(toString).contains("Question");
      assertThat(toString).contains("...");
      assertThat(toString.length()).isLessThan(longContent.length() + 50);
    }

    @Test
    @DisplayName("Should handle multiline content in string representation")
    void shouldHandleMultilineContentInStringRepresentation() {
      // Given
      String multilineContent = "Line 1\nLine 2\nLine 3";
      Question question = new Question(multilineContent);

      // When
      String toString = question.toString();

      // Then
      assertThat(toString).contains("Question");
      assertThat(toString).contains("Line 1");
    }
  }
}
