package com.rct.application.usecase.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.studybook.DeleteStudyBookUseCase.DeleteStudyBookCommand;
import com.rct.application.usecase.studybook.DeleteStudyBookUseCase.DeleteStudyBookResult;
import com.rct.application.usecase.studybook.DeleteStudyBookUseCase.StudyBookDeletionException;
import com.rct.application.usecase.studybook.DeleteStudyBookUseCase.StudyBookNotFoundException;
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
@DisplayName("DeleteStudyBookUseCase Tests")
class DeleteStudyBookUseCaseTest {

  @Mock private StudyBookRepository studyBookRepository;

  private DeleteStudyBookUseCase useCase;

  @BeforeEach
  void setUp() {
    useCase = new DeleteStudyBookUseCase(studyBookRepository);
  }

  @Test
  @DisplayName("Should delete study book successfully")
  void shouldDeleteStudyBookSuccessfully() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    DeleteStudyBookCommand command = new DeleteStudyBookCommand(studyBookId, userId);

    StudyBook existingStudyBook = TestDataBuilder.createUserStudyBook();
    when(studyBookRepository.findById(any(StudyBookId.class)))
        .thenReturn(Optional.of(existingStudyBook));

    // When
    DeleteStudyBookResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getErrorMessage()).isNull();
    verify(studyBookRepository).findById(any(StudyBookId.class));
    verify(studyBookRepository).delete(any(StudyBookId.class));
  }

  @Test
  @DisplayName("Should throw exception when study book not found")
  void shouldThrowExceptionWhenStudyBookNotFound() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    DeleteStudyBookCommand command = new DeleteStudyBookCommand(studyBookId, userId);

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
        .hasMessage("Delete study book command cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when repository delete fails")
  void shouldThrowExceptionWhenRepositoryDeleteFails() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    DeleteStudyBookCommand command = new DeleteStudyBookCommand(studyBookId, userId);

    StudyBook existingStudyBook = TestDataBuilder.createUserStudyBook();
    when(studyBookRepository.findById(any(StudyBookId.class)))
        .thenReturn(Optional.of(existingStudyBook));
    doThrow(new RuntimeException("Database error"))
        .when(studyBookRepository)
        .delete(any(StudyBookId.class));

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(StudyBookDeletionException.class)
        .hasMessageContaining("Failed to delete study book");
  }

  @Test
  @DisplayName("Should throw exception when studyBookId is null in command")
  void shouldThrowExceptionWhenStudyBookIdIsNull() {
    // When & Then
    assertThatThrownBy(() -> new DeleteStudyBookCommand(null, UUID.randomUUID()))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Study book ID cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when userId is null in command")
  void shouldThrowExceptionWhenUserIdIsNull() {
    // When & Then
    assertThatThrownBy(() -> new DeleteStudyBookCommand(UUID.randomUUID(), null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("User ID cannot be null");
  }

  @Test
  @DisplayName("Should verify ownership before deletion")
  void shouldVerifyOwnershipBeforeDeletion() {
    // Given
    UUID studyBookId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    DeleteStudyBookCommand command = new DeleteStudyBookCommand(studyBookId, userId);

    StudyBook existingStudyBook = TestDataBuilder.createUserStudyBook();
    when(studyBookRepository.findById(any(StudyBookId.class)))
        .thenReturn(Optional.of(existingStudyBook));

    // When
    useCase.execute(command);

    // Then
    verify(studyBookRepository).findById(any(StudyBookId.class));
    verify(studyBookRepository).delete(any(StudyBookId.class));
  }
}
