package com.rct.domain.model.studybook;

import static org.assertj.core.api.Assertions.*;

import com.rct.domain.model.user.UserId;
import com.rct.util.TestDataBuilder;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("StudyBook Domain Model Tests")
class StudyBookTest {

  @Nested
  @DisplayName("Creation Tests")
  class CreationTests {

    @Test
    @DisplayName("Should create user problem with valid data")
    void shouldCreateUserProblemWithValidData() {
      // Given
      StudyBookId id = new StudyBookId(UUID.randomUUID());
      UserId userId = TestDataBuilder.createUserId();
      Language language = new Language("Java");
      Question question = new Question("Write a hello world program");
      Explanation explanation = new Explanation("Use System.out.println");

      // When
      StudyBook studyBook =
          StudyBook.createUserProblem(id, userId, language, question, explanation);

      // Then
      assertThat(studyBook.getId()).isEqualTo(id);
      assertThat(studyBook.getUserId()).isEqualTo(userId);
      assertThat(studyBook.getLanguage()).isEqualTo(language);
      assertThat(studyBook.getQuestion()).isEqualTo(question);
      assertThat(studyBook.getExplanation()).isEqualTo(explanation);
      assertThat(studyBook.isUserProblem()).isTrue();
      assertThat(studyBook.isSystemProblem()).isFalse();
      assertThat(studyBook.getCreatedAt()).isNotNull();
      assertThat(studyBook.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should create system problem with valid data")
    void shouldCreateSystemProblemWithValidData() {
      // Given
      StudyBookId id = new StudyBookId(UUID.randomUUID());
      Language language = new Language("JavaScript");
      Question question = new Question("Implement a function to reverse a string");
      Explanation explanation = new Explanation("Use built-in methods or loops");

      // When
      StudyBook studyBook = StudyBook.createSystemProblem(id, language, question, explanation);

      // Then
      assertThat(studyBook.getId()).isEqualTo(id);
      assertThat(studyBook.getUserId()).isNull();
      assertThat(studyBook.getLanguage()).isEqualTo(language);
      assertThat(studyBook.getQuestion()).isEqualTo(question);
      assertThat(studyBook.getExplanation()).isEqualTo(explanation);
      assertThat(studyBook.isSystemProblem()).isTrue();
      assertThat(studyBook.isUserProblem()).isFalse();
    }

    @Test
    @DisplayName("Should create user problem with null explanation")
    void shouldCreateUserProblemWithNullExplanation() {
      // Given
      StudyBookId id = new StudyBookId(UUID.randomUUID());
      UserId userId = TestDataBuilder.createUserId();
      Language language = new Language("Python");
      Question question = new Question("Write a function to calculate factorial");

      // When
      StudyBook studyBook = StudyBook.createUserProblem(id, userId, language, question, null);

      // Then
      assertThat(studyBook.getExplanation()).isNull();
      assertThat(studyBook.isUserProblem()).isTrue();
    }

    @Test
    @DisplayName("Should throw exception when creating user problem with null user ID")
    void shouldThrowExceptionWhenCreatingUserProblemWithNullUserId() {
      // Given
      StudyBookId id = new StudyBookId(UUID.randomUUID());
      Language language = new Language("Java");
      Question question = new Question("Test question");
      Explanation explanation = new Explanation("Test explanation");

      // When & Then
      assertThatThrownBy(
              () -> StudyBook.createUserProblem(id, null, language, question, explanation))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("User ID cannot be null for user problems");
    }

    @Test
    @DisplayName("Should throw exception when creating with null required fields")
    void shouldThrowExceptionWhenCreatingWithNullRequiredFields() {
      // Given
      UserId userId = TestDataBuilder.createUserId();
      Language language = new Language("Java");
      Question question = new Question("Test question");
      Explanation explanation = new Explanation("Test explanation");

      // When & Then
      assertThatThrownBy(
              () -> StudyBook.createUserProblem(null, userId, language, question, explanation))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("StudyBook ID cannot be null");

      assertThatThrownBy(
              () ->
                  StudyBook.createUserProblem(
                      new StudyBookId(UUID.randomUUID()), userId, null, question, explanation))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("Language cannot be null");

      assertThatThrownBy(
              () ->
                  StudyBook.createUserProblem(
                      new StudyBookId(UUID.randomUUID()), userId, language, null, explanation))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("Question cannot be null");
    }
  }

  @Nested
  @DisplayName("Business Logic Tests")
  class BusinessLogicTests {

    @Test
    @DisplayName("Should update user problem content successfully")
    void shouldUpdateUserProblemContentSuccessfully() {
      // Given
      StudyBook originalStudyBook = TestDataBuilder.createUserStudyBook();
      Question newQuestion = new Question("Updated question content");
      Explanation newExplanation = new Explanation("Updated explanation");

      // When
      StudyBook updatedStudyBook = originalStudyBook.updateContent(newQuestion, newExplanation);

      // Then
      assertThat(updatedStudyBook.getId()).isEqualTo(originalStudyBook.getId());
      assertThat(updatedStudyBook.getUserId()).isEqualTo(originalStudyBook.getUserId());
      assertThat(updatedStudyBook.getLanguage()).isEqualTo(originalStudyBook.getLanguage());
      assertThat(updatedStudyBook.getQuestion()).isEqualTo(newQuestion);
      assertThat(updatedStudyBook.getExplanation()).isEqualTo(newExplanation);
      assertThat(updatedStudyBook.getCreatedAt()).isEqualTo(originalStudyBook.getCreatedAt());
      assertThat(updatedStudyBook.getUpdatedAt()).isAfter(originalStudyBook.getUpdatedAt());
    }

    @Test
    @DisplayName("Should throw exception when updating system problem")
    void shouldThrowExceptionWhenUpdatingSystemProblem() {
      // Given
      StudyBook systemStudyBook = TestDataBuilder.createSystemStudyBook();
      Question newQuestion = new Question("Updated question");
      Explanation newExplanation = new Explanation("Updated explanation");

      // When & Then
      assertThatThrownBy(() -> systemStudyBook.updateContent(newQuestion, newExplanation))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("System problems cannot be updated");
    }

    @Test
    @DisplayName("Should correctly identify ownership")
    void shouldCorrectlyIdentifyOwnership() {
      // Given
      UserId userId = TestDataBuilder.createUserId();
      UserId otherUserId = TestDataBuilder.createUserId();
      StudyBook userStudyBook = TestDataBuilder.createUserStudyBookForUser(userId);
      StudyBook systemStudyBook = TestDataBuilder.createSystemStudyBook();

      // When & Then
      assertThat(userStudyBook.belongsToUser(userId)).isTrue();
      assertThat(userStudyBook.belongsToUser(otherUserId)).isFalse();
      assertThat(systemStudyBook.belongsToUser(userId)).isFalse();
      assertThat(systemStudyBook.belongsToUser(otherUserId)).isFalse();
    }

    @Test
    @DisplayName("Should validate content successfully")
    void shouldValidateContentSuccessfully() {
      // Given
      StudyBook validStudyBook = TestDataBuilder.createUserStudyBook();

      // When & Then
      assertThatCode(() -> validStudyBook.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should validate content with null explanation")
    void shouldValidateContentWithNullExplanation() {
      // Given
      StudyBookId id = new StudyBookId(UUID.randomUUID());
      UserId userId = TestDataBuilder.createUserId();
      Language language = new Language("Java");
      Question question = new Question("Valid question");
      StudyBook studyBook = StudyBook.createUserProblem(id, userId, language, question, null);

      // When & Then
      assertThatCode(() -> studyBook.validate()).doesNotThrowAnyException();
    }
  }

  @Nested
  @DisplayName("Reconstruction Tests")
  class ReconstructionTests {

    @Test
    @DisplayName("Should reconstruct study book from persistence data")
    void shouldReconstructStudyBookFromPersistenceData() {
      // Given
      StudyBookId id = new StudyBookId(UUID.randomUUID());
      UserId userId = TestDataBuilder.createUserId();
      Language language = new Language("Java");
      Question question = new Question("Reconstructed question");
      Explanation explanation = new Explanation("Reconstructed explanation");
      LocalDateTime createdAt = LocalDateTime.now().minusDays(1);
      LocalDateTime updatedAt = LocalDateTime.now().minusHours(1);

      // When
      StudyBook studyBook =
          StudyBook.reconstruct(
              id, userId, language, question, explanation, false, createdAt, updatedAt);

      // Then
      assertThat(studyBook.getId()).isEqualTo(id);
      assertThat(studyBook.getUserId()).isEqualTo(userId);
      assertThat(studyBook.getLanguage()).isEqualTo(language);
      assertThat(studyBook.getQuestion()).isEqualTo(question);
      assertThat(studyBook.getExplanation()).isEqualTo(explanation);
      assertThat(studyBook.isUserProblem()).isTrue();
      assertThat(studyBook.getCreatedAt()).isEqualTo(createdAt);
      assertThat(studyBook.getUpdatedAt()).isEqualTo(updatedAt);
    }

    @Test
    @DisplayName("Should reconstruct system study book from persistence data")
    void shouldReconstructSystemStudyBookFromPersistenceData() {
      // Given
      StudyBookId id = new StudyBookId(UUID.randomUUID());
      Language language = new Language("Python");
      Question question = new Question("System question");
      Explanation explanation = new Explanation("System explanation");
      LocalDateTime createdAt = LocalDateTime.now().minusDays(5);
      LocalDateTime updatedAt = LocalDateTime.now().minusDays(5);

      // When
      StudyBook studyBook =
          StudyBook.reconstruct(
              id, null, language, question, explanation, true, createdAt, updatedAt);

      // Then
      assertThat(studyBook.getUserId()).isNull();
      assertThat(studyBook.isSystemProblem()).isTrue();
      assertThat(studyBook.isUserProblem()).isFalse();
    }
  }

  @Nested
  @DisplayName("Equality and Hash Code Tests")
  class EqualityTests {

    @Test
    @DisplayName("Should be equal when IDs are equal")
    void shouldBeEqualWhenIdsAreEqual() {
      // Given
      StudyBookId id = new StudyBookId(UUID.randomUUID());
      StudyBook studyBook1 = TestDataBuilder.createUserStudyBookWithId(id);
      StudyBook studyBook2 = TestDataBuilder.createUserStudyBookWithId(id);

      // When & Then
      assertThat(studyBook1).isEqualTo(studyBook2);
      assertThat(studyBook1.hashCode()).isEqualTo(studyBook2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal when IDs are different")
    void shouldNotBeEqualWhenIdsAreDifferent() {
      // Given
      StudyBook studyBook1 = TestDataBuilder.createUserStudyBook();
      StudyBook studyBook2 = TestDataBuilder.createUserStudyBook();

      // When & Then
      assertThat(studyBook1).isNotEqualTo(studyBook2);
    }

    @Test
    @DisplayName("Should not be equal to null or different class")
    void shouldNotBeEqualToNullOrDifferentClass() {
      // Given
      StudyBook studyBook = TestDataBuilder.createUserStudyBook();

      // When & Then
      assertThat(studyBook).isNotEqualTo(null);
      assertThat(studyBook).isNotEqualTo("not a study book");
    }

    @Test
    @DisplayName("Should be equal to itself")
    void shouldBeEqualToItself() {
      // Given
      StudyBook studyBook = TestDataBuilder.createUserStudyBook();

      // When & Then
      assertThat(studyBook).isEqualTo(studyBook);
    }
  }

  @Nested
  @DisplayName("String Representation Tests")
  class StringRepresentationTests {

    @Test
    @DisplayName("Should provide meaningful string representation for user problem")
    void shouldProvideMeaningfulStringRepresentationForUserProblem() {
      // Given
      StudyBook userStudyBook = TestDataBuilder.createUserStudyBook();

      // When
      String toString = userStudyBook.toString();

      // Then
      assertThat(toString).contains("StudyBook");
      assertThat(toString).contains(userStudyBook.getId().toString());
      assertThat(toString).contains(userStudyBook.getUserId().toString());
      assertThat(toString).contains(userStudyBook.getLanguage().toString());
      assertThat(toString).contains("isSystemProblem=false");
    }

    @Test
    @DisplayName("Should provide meaningful string representation for system problem")
    void shouldProvideMeaningfulStringRepresentationForSystemProblem() {
      // Given
      StudyBook systemStudyBook = TestDataBuilder.createSystemStudyBook();

      // When
      String toString = systemStudyBook.toString();

      // Then
      assertThat(toString).contains("StudyBook");
      assertThat(toString).contains(systemStudyBook.getId().toString());
      assertThat(toString).contains("userId=null");
      assertThat(toString).contains("isSystemProblem=true");
    }
  }
}
