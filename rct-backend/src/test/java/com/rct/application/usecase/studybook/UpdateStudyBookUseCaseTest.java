package com.rct.application.usecase.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.studybook.UpdateStudyBookUseCase.StudyBookNotFoundException;
import com.rct.application.usecase.studybook.UpdateStudyBookUseCase.StudyBookUpdateException;
import com.rct.application.usecase.studybook.UpdateStudyBookUseCase.UpdateStudyBookCommand;
import com.rct.application.usecase.studybook.UpdateStudyBookUseCase.UpdateStudyBookResult;
import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.util.TestDataBuilder;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateStudyBookUseCase Tests")
class UpdateStudyBookUseCaseTest {

  @Mock private StudyBookRepository studyBookRepository;

  private UpdateStudyBookUseCase useCase;

  @BeforeEach
  void setUp() {
    useCase = new UpdateStudyBookUseCase(studyBookRepository);
  }

  @Test
  @DisplayName("Should update study book successfully")
  void shouldUpdateStudyBookSuccessfully() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UpdateStudyBookCommand command =
        new UpdateStudyBookCommand(
            studyBookId, userId, "Python", "print('Updated')", "Updated explanation");

    StudyBook existingStudyBook = TestDataBuilder.createUserStudyBook();
    StudyBook updatedStudyBook = TestDataBuilder.createUserStudyBook();

    when(studyBookRepository.findById(any(StudyBookId.class)))
        .thenReturn(Optional.of(existingStudyBook));
    when(studyBookRepository.save(any(StudyBook.class))).thenReturn(updatedStudyBook);

    // When
    UpdateStudyBookResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBook()).isEqualTo(updatedStudyBook);
    assertThat(result.getErrorMessage()).isNull();
    verify(studyBookRepository).findById(any(StudyBookId.class));
    verify(studyBookRepository).save(any(StudyBook.class));
  }

  @Test
  @DisplayName("Should update study book without explanation")
  void shouldUpdateStudyBookWithoutExplanation() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UpdateStudyBookCommand command =
        new UpdateStudyBookCommand(studyBookId, userId, "JavaScript", "console.log('test');", null);

    StudyBook existingStudyBook = TestDataBuilder.createUserStudyBook();
    StudyBook updatedStudyBook = TestDataBuilder.createUserStudyBook();

    when(studyBookRepository.findById(any(StudyBookId.class)))
        .thenReturn(Optional.of(existingStudyBook));
    when(studyBookRepository.save(any(StudyBook.class))).thenReturn(updatedStudyBook);

    // When
    UpdateStudyBookResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBook()).isEqualTo(updatedStudyBook);
    verify(studyBookRepository).save(any(StudyBook.class));
  }

  @Test
  @DisplayName("Should throw exception when study book not found")
  void shouldThrowExceptionWhenStudyBookNotFound() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UpdateStudyBookCommand command =
        new UpdateStudyBookCommand(
            studyBookId, userId, "Java", "System.out.println(\"test\");", "Test explanation");

    when(studyBookRepository.findById(any(StudyBookId.class))).thenReturn(Optional.empty());

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(StudyBookNotFoundException.class)
        .hasMessageContaining("Study book not found");
  }

  @Test
  @DisplayName("Should throw exception when command is null")
  void shouldThrowExceptionWhenCommandIsNull() {
    // When & Then
    assertThatThrownBy(() -> useCase.execute(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Update study book command cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when repository save fails")
  void shouldThrowExceptionWhenRepositorySaveFails() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UpdateStudyBookCommand command =
        new UpdateStudyBookCommand(
            studyBookId, userId, "Java", "System.out.println(\"test\");", "Test explanation");

    StudyBook existingStudyBook = TestDataBuilder.createUserStudyBook();

    when(studyBookRepository.findById(any(StudyBookId.class)))
        .thenReturn(Optional.of(existingStudyBook));
    when(studyBookRepository.save(any(StudyBook.class)))
        .thenThrow(new RuntimeException("Database error"));

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(StudyBookUpdateException.class)
        .hasMessageContaining("Failed to update study book");
  }

  @Test
  @DisplayName("Should throw exception when studyBookId is null in command")
  void shouldThrowExceptionWhenStudyBookIdIsNull() {
    // When & Then
    assertThatThrownBy(
            () ->
                new UpdateStudyBookCommand(
                    null,
                    UUID.randomUUID(),
                    "Java",
                    "System.out.println(\"test\");",
                    "Test explanation"))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Study book ID cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when userId is null in command")
  void shouldThrowExceptionWhenUserIdIsNull() {
    // When & Then
    assertThatThrownBy(
            () ->
                new UpdateStudyBookCommand(
                    UUID.randomUUID(),
                    null,
                    "Java",
                    "System.out.println(\"test\");",
                    "Test explanation"))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("User ID cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when language is null in command")
  void shouldThrowExceptionWhenLanguageIsNull() {
    // When & Then
    assertThatThrownBy(
            () ->
                new UpdateStudyBookCommand(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    null,
                    "System.out.println(\"test\");",
                    "Test explanation"))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Language cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when question is null in command")
  void shouldThrowExceptionWhenQuestionIsNull() {
    // When & Then
    assertThatThrownBy(
            () ->
                new UpdateStudyBookCommand(
                    UUID.randomUUID(), UUID.randomUUID(), "Java", null, "Test explanation"))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Question cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when language is empty in command")
  void shouldThrowExceptionWhenLanguageIsEmpty() {
    // When & Then
    assertThatThrownBy(
            () ->
                new UpdateStudyBookCommand(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "",
                    "System.out.println(\"test\");",
                    "Test explanation"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Language cannot be empty");
  }

  @Test
  @DisplayName("Should throw exception when question is empty in command")
  void shouldThrowExceptionWhenQuestionIsEmpty() {
    // When & Then
    assertThatThrownBy(
            () ->
                new UpdateStudyBookCommand(
                    UUID.randomUUID(), UUID.randomUUID(), "Java", "", "Test explanation"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Question cannot be empty");
  }
}
