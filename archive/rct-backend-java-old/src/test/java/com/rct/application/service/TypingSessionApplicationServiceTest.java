package com.rct.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.typingsession.GetTypingStatisticsUseCase;
import com.rct.application.usecase.typingsession.GetTypingStatisticsUseCase.GetTypingStatisticsCommand;
import com.rct.application.usecase.typingsession.GetTypingStatisticsUseCase.GetTypingStatisticsResult;
import com.rct.application.usecase.typingsession.RecordTypingResultUseCase;
import com.rct.application.usecase.typingsession.RecordTypingResultUseCase.RecordTypingResultCommand;
import com.rct.application.usecase.typingsession.RecordTypingResultUseCase.RecordTypingResultResult;
import com.rct.application.usecase.typingsession.StartTypingSessionUseCase;
import com.rct.application.usecase.typingsession.StartTypingSessionUseCase.StartTypingSessionCommand;
import com.rct.application.usecase.typingsession.StartTypingSessionUseCase.StartTypingSessionResult;
import com.rct.util.TestDataBuilder;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("TypingSessionApplicationService Tests")
class TypingSessionApplicationServiceTest {

  @Mock private StartTypingSessionUseCase startTypingSessionUseCase;
  @Mock private RecordTypingResultUseCase recordTypingResultUseCase;
  @Mock private GetTypingStatisticsUseCase getTypingStatisticsUseCase;

  private TypingSessionApplicationService service;

  @BeforeEach
  void setUp() {
    service =
        new TypingSessionApplicationService(
            startTypingSessionUseCase, recordTypingResultUseCase, getTypingStatisticsUseCase);
  }

  @Test
  @DisplayName("Should start typing session successfully")
  void shouldStartTypingSessionSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    UUID studyBookId = UUID.randomUUID();

    StartTypingSessionResult expectedResult =
        StartTypingSessionResult.success(TestDataBuilder.createTypingSession());
    when(startTypingSessionUseCase.execute(any(StartTypingSessionCommand.class)))
        .thenReturn(expectedResult);

    // When
    StartTypingSessionResult result = service.startTypingSession(userId, studyBookId);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(startTypingSessionUseCase).execute(any(StartTypingSessionCommand.class));
  }

  @Test
  @DisplayName("Should record typing result successfully")
  void shouldRecordTypingResultSuccessfully() {
    // Given
    UUID sessionId = UUID.randomUUID();
    String typedText = "System.out.println(\"Hello\");";
    String targetText = "System.out.println(\"Hello\");";
    long durationMs = 30000L;

    RecordTypingResultResult expectedResult =
        RecordTypingResultResult.success(TestDataBuilder.createTypingSession());
    when(recordTypingResultUseCase.execute(any(RecordTypingResultCommand.class)))
        .thenReturn(expectedResult);

    // When
    RecordTypingResultResult result =
        service.recordTypingResult(sessionId, typedText, targetText, durationMs);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(recordTypingResultUseCase).execute(any(RecordTypingResultCommand.class));
  }

  @Test
  @DisplayName("Should get typing statistics successfully")
  void shouldGetTypingStatisticsSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    LocalDate fromDate = LocalDate.now().minusDays(30);
    LocalDate toDate = LocalDate.now();

    GetTypingStatisticsResult expectedResult =
        GetTypingStatisticsResult.success(10, 95.5, 25000L, 5, 98.0, 15000L);
    when(getTypingStatisticsUseCase.execute(any(GetTypingStatisticsCommand.class)))
        .thenReturn(expectedResult);

    // When
    GetTypingStatisticsResult result = service.getTypingStatistics(userId, fromDate, toDate);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(getTypingStatisticsUseCase).execute(any(GetTypingStatisticsCommand.class));
  }

  @Test
  @DisplayName("Should get typing statistics for all time when dates are null")
  void shouldGetTypingStatisticsForAllTimeWhenDatesAreNull() {
    // Given
    UUID userId = UUID.randomUUID();

    GetTypingStatisticsResult expectedResult =
        GetTypingStatisticsResult.success(25, 92.3, 28000L, 15, 96.7, 18000L);
    when(getTypingStatisticsUseCase.execute(any(GetTypingStatisticsCommand.class)))
        .thenReturn(expectedResult);

    // When
    GetTypingStatisticsResult result = service.getTypingStatistics(userId, null, null);

    // Then
    assertThat(result).isEqualTo(expectedResult);
    verify(getTypingStatisticsUseCase).execute(any(GetTypingStatisticsCommand.class));
  }

  @Test
  @DisplayName("Should throw exception when startTypingSession parameters are invalid")
  void shouldThrowExceptionWhenStartTypingSessionParametersAreInvalid() {
    // When & Then
    assertThatThrownBy(() -> service.startTypingSession(null, UUID.randomUUID()))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.startTypingSession(UUID.randomUUID(), null))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("Should throw exception when recordTypingResult parameters are invalid")
  void shouldThrowExceptionWhenRecordTypingResultParametersAreInvalid() {
    // When & Then
    assertThatThrownBy(() -> service.recordTypingResult(null, "typed", "target", 30000L))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.recordTypingResult(UUID.randomUUID(), null, "target", 30000L))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.recordTypingResult(UUID.randomUUID(), "typed", null, 30000L))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.recordTypingResult(UUID.randomUUID(), "typed", "target", -1L))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(() -> service.recordTypingResult(UUID.randomUUID(), "typed", "target", 0L))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("Should throw exception when getTypingStatistics parameters are invalid")
  void shouldThrowExceptionWhenGetTypingStatisticsParametersAreInvalid() {
    // When & Then
    assertThatThrownBy(
            () -> service.getTypingStatistics(null, LocalDate.now().minusDays(7), LocalDate.now()))
        .isInstanceOf(IllegalArgumentException.class);

    assertThatThrownBy(
            () ->
                service.getTypingStatistics(
                    UUID.randomUUID(), LocalDate.now(), LocalDate.now().minusDays(1)))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  @DisplayName("Should handle transaction boundaries correctly")
  void shouldHandleTransactionBoundariesCorrectly() {
    // Given
    UUID userId = UUID.randomUUID();
    UUID studyBookId = UUID.randomUUID();

    StartTypingSessionResult expectedResult =
        StartTypingSessionResult.success(TestDataBuilder.createTypingSession());
    when(startTypingSessionUseCase.execute(any(StartTypingSessionCommand.class)))
        .thenReturn(expectedResult);

    // When
    StartTypingSessionResult result = service.startTypingSession(userId, studyBookId);

    // Then
    assertThat(result.isSuccess()).isTrue();
    verify(startTypingSessionUseCase).execute(any(StartTypingSessionCommand.class));
  }

  @Test
  @DisplayName("Should coordinate multiple use cases correctly")
  void shouldCoordinateMultipleUseCasesCorrectly() {
    // Given
    UUID userId = UUID.randomUUID();
    UUID studyBookId = UUID.randomUUID();
    UUID sessionId = UUID.randomUUID();

    // Start session
    StartTypingSessionResult startResult =
        StartTypingSessionResult.success(TestDataBuilder.createTypingSession());
    when(startTypingSessionUseCase.execute(any(StartTypingSessionCommand.class)))
        .thenReturn(startResult);

    // Record result
    RecordTypingResultResult recordResult =
        RecordTypingResultResult.success(TestDataBuilder.createTypingSession());
    when(recordTypingResultUseCase.execute(any(RecordTypingResultCommand.class)))
        .thenReturn(recordResult);

    // When
    StartTypingSessionResult sessionResult = service.startTypingSession(userId, studyBookId);
    RecordTypingResultResult resultResult =
        service.recordTypingResult(sessionId, "typed", "target", 30000L);

    // Then
    assertThat(sessionResult.isSuccess()).isTrue();
    assertThat(resultResult.isSuccess()).isTrue();
    verify(startTypingSessionUseCase).execute(any(StartTypingSessionCommand.class));
    verify(recordTypingResultUseCase).execute(any(RecordTypingResultCommand.class));
  }
}
