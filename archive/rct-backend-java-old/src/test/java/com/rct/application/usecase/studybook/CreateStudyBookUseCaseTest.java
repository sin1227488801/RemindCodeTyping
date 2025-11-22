package com.rct.application.usecase.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.studybook.CreateStudyBookUseCase.CreateStudyBookCommand;
import com.rct.application.usecase.studybook.CreateStudyBookUseCase.StudyBookCreationException;
import com.rct.application.usecase.studybook.CreateStudyBookUseCase.StudyBookCreationResult;
import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.util.TestDataBuilder;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateStudyBookUseCase Tests")
class CreateStudyBookUseCaseTest {

  @Mock private StudyBookRepository studyBookRepository;

  private CreateStudyBookUseCase useCase;

  @BeforeEach
  void setUp() {
    useCase = new CreateStudyBookUseCase(studyBookRepository);
  }

  @Test
  @DisplayName("Should create study book successfully with all fields")
  void shouldCreateStudyBookSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    CreateStudyBookCommand command =
        new CreateStudyBookCommand(
            userId, "Java", "System.out.println(\"Hello\");", "Basic print statement", false);

    StudyBook savedStudyBook = TestDataBuilder.createUserStudyBook();
    when(studyBookRepository.save(any(StudyBook.class))).thenReturn(savedStudyBook);

    // When
    StudyBookCreationResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBook()).isEqualTo(savedStudyBook);
    assertThat(result.getErrorMessage()).isNull();
    verify(studyBookRepository).save(any(StudyBook.class));
  }

  @Test
  @DisplayName("Should create study book successfully without explanation")
  void shouldCreateStudyBookWithoutExplanation() {
    // Given
    UUID userId = UUID.randomUUID();
    CreateStudyBookCommand command =
        new CreateStudyBookCommand(userId, "JavaScript", "console.log('Hello');", null, false);

    StudyBook savedStudyBook = TestDataBuilder.createUserStudyBook();
    when(studyBookRepository.save(any(StudyBook.class))).thenReturn(savedStudyBook);

    // When
    StudyBookCreationResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBook()).isEqualTo(savedStudyBook);
    verify(studyBookRepository).save(any(StudyBook.class));
  }

  @Test
  @DisplayName("Should create system problem successfully")
  void shouldCreateSystemProblem() {
    // Given
    UUID userId = UUID.randomUUID();
    CreateStudyBookCommand command =
        new CreateStudyBookCommand(
            userId, "Python", "print('Hello World')", "Basic Python print", true);

    StudyBook savedStudyBook = TestDataBuilder.createSystemStudyBook();
    when(studyBookRepository.save(any(StudyBook.class))).thenReturn(savedStudyBook);

    // When
    StudyBookCreationResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBook()).isEqualTo(savedStudyBook);
    verify(studyBookRepository).save(any(StudyBook.class));
  }

  @Test
  @DisplayName("Should throw exception when command is null")
  void shouldThrowExceptionWhenCommandIsNull() {
    // When & Then
    assertThatThrownBy(() -> useCase.execute(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Create study book command cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when repository save fails")
  void shouldThrowExceptionWhenRepositorySaveFails() {
    // Given
    UUID userId = UUID.randomUUID();
    CreateStudyBookCommand command =
        new CreateStudyBookCommand(
            userId, "Java", "System.out.println(\"Hello\");", "Basic print statement", false);

    when(studyBookRepository.save(any(StudyBook.class)))
        .thenThrow(new RuntimeException("Database error"));

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(StudyBookCreationException.class)
        .hasMessageContaining("Failed to create study book");
  }

  @Test
  @DisplayName("Should throw exception when userId is null in command")
  void shouldThrowExceptionWhenUserIdIsNull() {
    // When & Then
    assertThatThrownBy(
            () ->
                new CreateStudyBookCommand(
                    null, "Java", "System.out.println(\"Hello\");", "Basic print statement", false))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("User ID cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when language is null in command")
  void shouldThrowExceptionWhenLanguageIsNull() {
    // When & Then
    assertThatThrownBy(
            () ->
                new CreateStudyBookCommand(
                    UUID.randomUUID(),
                    null,
                    "System.out.println(\"Hello\");",
                    "Basic print statement",
                    false))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Language cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when question is null in command")
  void shouldThrowExceptionWhenQuestionIsNull() {
    // When & Then
    assertThatThrownBy(
            () ->
                new CreateStudyBookCommand(
                    UUID.randomUUID(), "Java", null, "Basic print statement", false))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Question cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when language is empty in command")
  void shouldThrowExceptionWhenLanguageIsEmpty() {
    // When & Then
    assertThatThrownBy(
            () ->
                new CreateStudyBookCommand(
                    UUID.randomUUID(),
                    "",
                    "System.out.println(\"Hello\");",
                    "Basic print statement",
                    false))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Language cannot be empty");
  }

  @Test
  @DisplayName("Should throw exception when question is empty in command")
  void shouldThrowExceptionWhenQuestionIsEmpty() {
    // When & Then
    assertThatThrownBy(
            () ->
                new CreateStudyBookCommand(
                    UUID.randomUUID(), "Java", "", "Basic print statement", false))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Question cannot be empty");
  }

  @Test
  @DisplayName("Should throw exception when language is whitespace only in command")
  void shouldThrowExceptionWhenLanguageIsWhitespaceOnly() {
    // When & Then
    assertThatThrownBy(
            () ->
                new CreateStudyBookCommand(
                    UUID.randomUUID(),
                    "   ",
                    "System.out.println(\"Hello\");",
                    "Basic print statement",
                    false))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Language cannot be empty");
  }

  @Test
  @DisplayName("Should throw exception when question is whitespace only in command")
  void shouldThrowExceptionWhenQuestionIsWhitespaceOnly() {
    // When & Then
    assertThatThrownBy(
            () ->
                new CreateStudyBookCommand(
                    UUID.randomUUID(), "Java", "   ", "Basic print statement", false))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Question cannot be empty");
  }
}
