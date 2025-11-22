package com.rct.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.studybook.CreateStudyBookUseCase;
import com.rct.application.usecase.studybook.CreateStudyBookUseCase.CreateStudyBookCommand;
import com.rct.application.usecase.studybook.CreateStudyBookUseCase.StudyBookCreationResult;
import com.rct.application.usecase.studybook.DeleteStudyBookUseCase;
import com.rct.application.usecase.studybook.DeleteStudyBookUseCase.DeleteStudyBookCommand;
import com.rct.application.usecase.studybook.DeleteStudyBookUseCase.DeleteStudyBookResult;
import com.rct.application.usecase.studybook.GetStudyBooksUseCase;
import com.rct.application.usecase.studybook.GetStudyBooksUseCase.GetStudyBooksCommand;
import com.rct.application.usecase.studybook.GetStudyBooksUseCase.GetStudyBooksResult;
import com.rct.application.usecase.studybook.UpdateStudyBookUseCase;
import com.rct.application.usecase.studybook.UpdateStudyBookUseCase.UpdateStudyBookCommand;
import com.rct.application.usecase.studybook.UpdateStudyBookUseCase.UpdateStudyBookResult;
import com.rct.util.TestDataBuilder;
import java.util.Arrays;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("StudyBookApplicationService Tests")
class StudyBookApplicationServiceTest {

  @Mock private CreateStudyBookUseCase createStudyBookUseCase;
  @Mock private UpdateStudyBookUseCase updateStudyBookUseCase;
  @Mock private DeleteStudyBookUseCase deleteStudyBookUseCase;
  @Mock private GetStudyBooksUseCase getStudyBooksUseCase;

  private StudyBookApplicationService service;

  @BeforeEach
  void setUp() {
    service =
        new StudyBookApplicationService(
            createStudyBookUseCase,
            updateStudyBookUseCase,
            deleteStudyBookUseCase,
            getStudyBooksUseCase);
  }

  @Test
  @DisplayName("Should create study book successfully")
  void shouldCreateStudyBookSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    String language = "Java";
    String question = "System.out.println(\"Hello\");";
    String explanation = "Basic print statement";
    boolean isSystemProblem = false;

    StudyBookCreationResult expectedResult =
        StudyBookCreationResult.success(TestDataBuilder.createUserStudyBook());
    when(createStudyBookUseCase.execute(any(CreateStudyBookCommand.class)))
        .thenReturn(expectedResult);

    // When
    StudyBookCreationResult result =
        service.createStudyBook(userId, language, question, explanation, isSystemProblem);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(createStudyBookUseCase).execute(any(CreateStudyBookCommand.class));
  }

  @Test
  @DisplayName("Should update study book successfully")
  void shouldUpdateStudyBookSuccessfully() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    String language = "Python";
    String question = "print('Hello')";
    String explanation = "Python print statement";

    UpdateStudyBookResult expectedResult =
        UpdateStudyBookResult.success(TestDataBuilder.createUserStudyBook());
    when(updateStudyBookUseCase.execute(any(UpdateStudyBookCommand.class)))
        .thenReturn(expectedResult);

    // When
    UpdateStudyBookResult result =
        service.updateStudyBook(studyBookId, userId, language, question, explanation);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(updateStudyBookUseCase).execute(any(UpdateStudyBookCommand.class));
  }

  @Test
  @DisplayName("Should delete study book successfully")
  void shouldDeleteStudyBookSuccessfully() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    DeleteStudyBookResult expectedResult = DeleteStudyBookResult.success();
    when(deleteStudyBookUseCase.execute(any(DeleteStudyBookCommand.class)))
        .thenReturn(expectedResult);

    // When
    DeleteStudyBookResult result = service.deleteStudyBook(studyBookId, userId);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(deleteStudyBookUseCase).execute(any(DeleteStudyBookCommand.class));
  }

  @Test
  @DisplayName("Should get study books successfully")
  void shouldGetStudyBooksSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    String language = "JavaScript";
    int page = 0;
    int size = 10;

    GetStudyBooksResult expectedResult =
        GetStudyBooksResult.success(
            Arrays.asList(TestDataBuilder.createUserStudyBook()), 1, 1, 0, 10);
    when(getStudyBooksUseCase.execute(any(GetStudyBooksCommand.class))).thenReturn(expectedResult);

    // When
    GetStudyBooksResult result = service.getStudyBooks(userId, language, page, size);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(getStudyBooksUseCase).execute(any(GetStudyBooksCommand.class));
  }

  @Test
  @DisplayName("Should get random study books successfully")
  void shouldGetRandomStudyBooksSuccessfully() {
    // Given
    String language = "Python";
    int limit = 5;

    GetStudyBooksResult expectedResult =
        GetStudyBooksResult.success(
            Arrays.asList(
                TestDataBuilder.createSystemStudyBook(), TestDataBuilder.createSystemStudyBook()),
            2,
            1,
            0,
            5);
    when(getStudyBooksUseCase.execute(any(GetStudyBooksCommand.class))).thenReturn(expectedResult);

    // When
    GetStudyBooksResult result = service.getRandomStudyBooks(language, limit);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(getStudyBooksUseCase).execute(any(GetStudyBooksCommand.class));
  }

  @Test
  @DisplayName("Should throw exception when createStudyBook parameters are invalid")
  void shouldThrowExceptionWhenCreateStudyBookParametersAreInvalid() {
    // When & Then
    assertThatThrownBy(
            () -> service.createStudyBook(null, "Java", "question", "explanation", false))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(
            () ->
                service.createStudyBook(UUID.randomUUID(), null, "question", "explanation", false))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(
            () -> service.createStudyBook(UUID.randomUUID(), "Java", null, "explanation", false))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("Should throw exception when updateStudyBook parameters are invalid")
  void shouldThrowExceptionWhenUpdateStudyBookParametersAreInvalid() {
    // When & Then
    assertThatThrownBy(
            () ->
                service.updateStudyBook(null, UUID.randomUUID(), "Java", "question", "explanation"))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(
            () ->
                service.updateStudyBook(UUID.randomUUID(), null, "Java", "question", "explanation"))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(
            () ->
                service.updateStudyBook(
                    UUID.randomUUID(), UUID.randomUUID(), null, "question", "explanation"))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(
            () ->
                service.updateStudyBook(
                    UUID.randomUUID(), UUID.randomUUID(), "Java", null, "explanation"))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("Should throw exception when deleteStudyBook parameters are invalid")
  void shouldThrowExceptionWhenDeleteStudyBookParametersAreInvalid() {
    // When & Then
    assertThatThrownBy(() -> service.deleteStudyBook(null, UUID.randomUUID()))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.deleteStudyBook(UUID.randomUUID(), null))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("Should throw exception when getStudyBooks parameters are invalid")
  void shouldThrowExceptionWhenGetStudyBooksParametersAreInvalid() {
    // When & Then
    assertThatThrownBy(() -> service.getStudyBooks(null, "Java", 0, 10))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.getStudyBooks(UUID.randomUUID(), "Java", -1, 10))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.getStudyBooks(UUID.randomUUID(), "Java", 0, 0))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("Should throw exception when getRandomStudyBooks parameters are invalid")
  void shouldThrowExceptionWhenGetRandomStudyBooksParametersAreInvalid() {
    // When & Then
    assertThatThrownBy(() -> service.getRandomStudyBooks(null, 5))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.getRandomStudyBooks("Java", 0))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.getRandomStudyBooks("Java", -1))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
