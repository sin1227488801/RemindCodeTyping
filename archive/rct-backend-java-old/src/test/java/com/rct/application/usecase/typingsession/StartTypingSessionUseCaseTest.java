package com.rct.application.usecase.typingsession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.typingsession.StartTypingSessionUseCase.StartTypingSessionCommand;
import com.rct.application.usecase.typingsession.StartTypingSessionUseCase.StartTypingSessionResult;
import com.rct.application.usecase.typingsession.StartTypingSessionUseCase.StudyBookNotFoundException;
import com.rct.application.usecase.typingsession.StartTypingSessionUseCase.TypingSessionStartException;
import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.domain.model.typingsession.TypingSession;
import com.rct.domain.model.typingsession.TypingSessionRepository;
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
@DisplayName("StartTypingSessionUseCase Tests")
class StartTypingSessionUseCaseTest {

  @Mock private TypingSessionRepository typingSessionRepository;
  @Mock private StudyBookRepository studyBookRepository;

  private StartTypingSessionUseCase useCase;

  @BeforeEach
  void setUp() {
    useCase = new StartTypingSessionUseCase(typingSessionRepository, studyBookRepository);
  }

  @Test
  @DisplayName("Should start typing session successfully")
  void shouldStartTypingSessionSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    UUID studyBookId = UUID.randomUUID();
    StartTypingSessionCommand command = new StartTypingSessionCommand(userId, studyBookId);

    StudyBook studyBook = TestDataBuilder.createUserStudyBook();
    TypingSession typingSession = TestDataBuilder.createTypingSession();

    when(studyBookRepository.findById(any(StudyBookId.class))).thenReturn(Optional.of(studyBook));
    when(typingSessionRepository.save(any(TypingSession.class))).thenReturn(typingSession);

    // When
    StartTypingSessionResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTypingSession()).isEqualTo(typingSession);
    assertThat(result.getErrorMessage()).isNull();
    verify(studyBookRepository).findById(any(StudyBookId.class));
    verify(typingSessionRepository).save(any(TypingSession.class));
  }

  @Test
  @DisplayName("Should throw exception when study book not found")
  void shouldThrowExceptionWhenStudyBookNotFound() {
    // Given
    UUID userId = UUID.randomUUID();
    UUID studyBookId = UUID.randomUUID();
    StartTypingSessionCommand command = new StartTypingSessionCommand(userId, studyBookId);

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
        .hasMessage("Start typing session command cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when repository save fails")
  void shouldThrowExceptionWhenRepositorySaveFails() {
    // Given
    UUID userId = UUID.randomUUID();
    UUID studyBookId = UUID.randomUUID();
    StartTypingSessionCommand command = new StartTypingSessionCommand(userId, studyBookId);

    StudyBook studyBook = TestDataBuilder.createUserStudyBook();
    when(studyBookRepository.findById(any(StudyBookId.class))).thenReturn(Optional.of(studyBook));
    when(typingSessionRepository.save(any(TypingSession.class)))
        .thenThrow(new RuntimeException("Database error"));

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(TypingSessionStartException.class)
        .hasMessageContaining("Failed to start typing session");
  }

  @Test
  @DisplayName("Should throw exception when userId is null in command")
  void shouldThrowExceptionWhenUserIdIsNull() {
    // When & Then
    assertThatThrownBy(() -> new StartTypingSessionCommand(null, UUID.randomUUID()))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("User ID cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when studyBookId is null in command")
  void shouldThrowExceptionWhenStudyBookIdIsNull() {
    // When & Then
    assertThatThrownBy(() -> new StartTypingSessionCommand(UUID.randomUUID(), null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Study book ID cannot be null");
  }

  @Test
  @DisplayName("Should create typing session with correct study book reference")
  void shouldCreateTypingSessionWithCorrectStudyBookReference() {
    // Given
    UUID userId = UUID.randomUUID();
    UUID studyBookId = UUID.randomUUID();
    StartTypingSessionCommand command = new StartTypingSessionCommand(userId, studyBookId);

    StudyBook studyBook = TestDataBuilder.createUserStudyBook();
    TypingSession typingSession = TestDataBuilder.createTypingSession();

    when(studyBookRepository.findById(any(StudyBookId.class))).thenReturn(Optional.of(studyBook));
    when(typingSessionRepository.save(any(TypingSession.class))).thenReturn(typingSession);

    // When
    StartTypingSessionResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    verify(studyBookRepository).findById(any(StudyBookId.class));
    verify(typingSessionRepository).save(any(TypingSession.class));
  }

  @Test
  @DisplayName("Should handle system study book correctly")
  void shouldHandleSystemStudyBookCorrectly() {
    // Given
    UUID userId = UUID.randomUUID();
    UUID studyBookId = UUID.randomUUID();
    StartTypingSessionCommand command = new StartTypingSessionCommand(userId, studyBookId);

    StudyBook systemStudyBook = TestDataBuilder.createSystemStudyBook();
    TypingSession typingSession = TestDataBuilder.createTypingSession();

    when(studyBookRepository.findById(any(StudyBookId.class)))
        .thenReturn(Optional.of(systemStudyBook));
    when(typingSessionRepository.save(any(TypingSession.class))).thenReturn(typingSession);

    // When
    StartTypingSessionResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTypingSession()).isEqualTo(typingSession);
    verify(studyBookRepository).findById(any(StudyBookId.class));
    verify(typingSessionRepository).save(any(TypingSession.class));
  }
}
