package com.rct.application.usecase.typingsession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.typingsession.RecordTypingResultUseCase.RecordTypingResultCommand;
import com.rct.application.usecase.typingsession.RecordTypingResultUseCase.RecordTypingResultResult;
import com.rct.application.usecase.typingsession.RecordTypingResultUseCase.TypingResultRecordException;
import com.rct.application.usecase.typingsession.RecordTypingResultUseCase.TypingSessionNotFoundException;
import com.rct.domain.model.typingsession.TypingSession;
import com.rct.domain.model.typingsession.TypingSessionId;
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
@DisplayName("RecordTypingResultUseCase Tests")
class RecordTypingResultUseCaseTest {

  @Mock private TypingSessionRepository typingSessionRepository;

  private RecordTypingResultUseCase useCase;

  @BeforeEach
  void setUp() {
    useCase = new RecordTypingResultUseCase(typingSessionRepository);
  }

  @Test
  @DisplayName("Should record typing result successfully")
  void shouldRecordTypingResultSuccessfully() {
    // Given
    UUID sessionId = UUID.randomUUID();
    String typedText = "System.out.println(\"Hello World\");";
    String targetText = "System.out.println(\"Hello World\");";
    long durationMs = 30000L;

    RecordTypingResultCommand command =
        new RecordTypingResultCommand(sessionId, typedText, targetText, durationMs);

    TypingSession typingSession = TestDataBuilder.createTypingSession();
    TypingSession updatedSession = TestDataBuilder.createTypingSession();

    when(typingSessionRepository.findById(any(TypingSessionId.class)))
        .thenReturn(Optional.of(typingSession));
    when(typingSessionRepository.save(any(TypingSession.class))).thenReturn(updatedSession);

    // When
    RecordTypingResultResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTypingSession()).isEqualTo(updatedSession);
    assertThat(result.getErrorMessage()).isNull();
    verify(typingSessionRepository).findById(any(TypingSessionId.class));
    verify(typingSessionRepository).save(any(TypingSession.class));
  }

  @Test
  @DisplayName("Should record typing result with partial accuracy")
  void shouldRecordTypingResultWithPartialAccuracy() {
    // Given
    UUID sessionId = UUID.randomUUID();
    String typedText = "System.out.println(\"Hello Wrld\");"; // Missing 'o'
    String targetText = "System.out.println(\"Hello World\");";
    long durationMs = 25000L;

    RecordTypingResultCommand command =
        new RecordTypingResultCommand(sessionId, typedText, targetText, durationMs);

    TypingSession typingSession = TestDataBuilder.createTypingSession();
    TypingSession updatedSession = TestDataBuilder.createTypingSession();

    when(typingSessionRepository.findById(any(TypingSessionId.class)))
        .thenReturn(Optional.of(typingSession));
    when(typingSessionRepository.save(any(TypingSession.class))).thenReturn(updatedSession);

    // When
    RecordTypingResultResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTypingSession()).isEqualTo(updatedSession);
    verify(typingSessionRepository).save(any(TypingSession.class));
  }

  @Test
  @DisplayName("Should record typing result with empty typed text")
  void shouldRecordTypingResultWithEmptyTypedText() {
    // Given
    UUID sessionId = UUID.randomUUID();
    String typedText = "";
    String targetText = "System.out.println(\"Hello World\");";
    long durationMs = 5000L;

    RecordTypingResultCommand command =
        new RecordTypingResultCommand(sessionId, typedText, targetText, durationMs);

    TypingSession typingSession = TestDataBuilder.createTypingSession();
    TypingSession updatedSession = TestDataBuilder.createTypingSession();

    when(typingSessionRepository.findById(any(TypingSessionId.class)))
        .thenReturn(Optional.of(typingSession));
    when(typingSessionRepository.save(any(TypingSession.class))).thenReturn(updatedSession);

    // When
    RecordTypingResultResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    verify(typingSessionRepository).save(any(TypingSession.class));
  }

  @Test
  @DisplayName("Should throw exception when typing session not found")
  void shouldThrowExceptionWhenTypingSessionNotFound() {
    // Given
    UUID sessionId = UUID.randomUUID();
    RecordTypingResultCommand command =
        new RecordTypingResultCommand(sessionId, "typed text", "target text", 30000L);

    when(typingSessionRepository.findById(any(TypingSessionId.class))).thenReturn(Optional.empty());

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(TypingSessionNotFoundException.class)
        .hasMessageContaining("Typing session not found");
  }

  @Test
  @DisplayName("Should throw exception when command is null")
  void shouldThrowExceptionWhenCommandIsNull() {
    // When & Then
    assertThatThrownBy(() -> useCase.execute(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Record typing result command cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when repository save fails")
  void shouldThrowExceptionWhenRepositorySaveFails() {
    // Given
    UUID sessionId = UUID.randomUUID();
    RecordTypingResultCommand command =
        new RecordTypingResultCommand(sessionId, "typed text", "target text", 30000L);

    TypingSession typingSession = TestDataBuilder.createTypingSession();
    when(typingSessionRepository.findById(any(TypingSessionId.class)))
        .thenReturn(Optional.of(typingSession));
    when(typingSessionRepository.save(any(TypingSession.class)))
        .thenThrow(new RuntimeException("Database error"));

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(TypingResultRecordException.class)
        .hasMessageContaining("Failed to record typing result");
  }

  @Test
  @DisplayName("Should throw exception when sessionId is null in command")
  void shouldThrowExceptionWhenSessionIdIsNull() {
    // When & Then
    assertThatThrownBy(
            () -> new RecordTypingResultCommand(null, "typed text", "target text", 30000L))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Session ID cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when typedText is null in command")
  void shouldThrowExceptionWhenTypedTextIsNull() {
    // When & Then
    assertThatThrownBy(
            () -> new RecordTypingResultCommand(UUID.randomUUID(), null, "target text", 30000L))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Typed text cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when targetText is null in command")
  void shouldThrowExceptionWhenTargetTextIsNull() {
    // When & Then
    assertThatThrownBy(
            () -> new RecordTypingResultCommand(UUID.randomUUID(), "typed text", null, 30000L))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Target text cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when duration is negative in command")
  void shouldThrowExceptionWhenDurationIsNegative() {
    // When & Then
    assertThatThrownBy(
            () ->
                new RecordTypingResultCommand(
                    UUID.randomUUID(), "typed text", "target text", -1000L))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Duration must be positive");
  }

  @Test
  @DisplayName("Should throw exception when duration is zero in command")
  void shouldThrowExceptionWhenDurationIsZero() {
    // When & Then
    assertThatThrownBy(
            () -> new RecordTypingResultCommand(UUID.randomUUID(), "typed text", "target text", 0L))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Duration must be positive");
  }
}
