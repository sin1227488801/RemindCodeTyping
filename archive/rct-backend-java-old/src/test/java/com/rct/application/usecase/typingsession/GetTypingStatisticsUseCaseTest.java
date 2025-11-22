package com.rct.application.usecase.typingsession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.typingsession.GetTypingStatisticsUseCase.GetTypingStatisticsCommand;
import com.rct.application.usecase.typingsession.GetTypingStatisticsUseCase.GetTypingStatisticsResult;
import com.rct.application.usecase.typingsession.GetTypingStatisticsUseCase.TypingStatisticsRetrievalException;
import com.rct.domain.model.typingsession.TypingSession;
import com.rct.domain.model.typingsession.TypingSessionRepository;
import com.rct.domain.model.user.UserId;
import com.rct.util.TestDataBuilder;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetTypingStatisticsUseCase Tests")
class GetTypingStatisticsUseCaseTest {

  @Mock private TypingSessionRepository typingSessionRepository;

  private GetTypingStatisticsUseCase useCase;

  @BeforeEach
  void setUp() {
    useCase = new GetTypingStatisticsUseCase(typingSessionRepository);
  }

  @Test
  @DisplayName("Should get typing statistics successfully")
  void shouldGetTypingStatisticsSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    LocalDate fromDate = LocalDate.now().minusDays(30);
    LocalDate toDate = LocalDate.now();
    GetTypingStatisticsCommand command = new GetTypingStatisticsCommand(userId, fromDate, toDate);

    List<TypingSession> sessions =
        Arrays.asList(
            TestDataBuilder.createTypingSession(),
            TestDataBuilder.createTypingSession(),
            TestDataBuilder.createTypingSession());

    when(typingSessionRepository.findByUserIdAndDateRange(
            any(UserId.class), eq(fromDate), eq(toDate)))
        .thenReturn(sessions);

    // When
    GetTypingStatisticsResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTotalSessions()).isEqualTo(3);
    assertThat(result.getErrorMessage()).isNull();
    verify(typingSessionRepository)
        .findByUserIdAndDateRange(any(UserId.class), eq(fromDate), eq(toDate));
  }

  @Test
  @DisplayName("Should get typing statistics for all time when dates are null")
  void shouldGetTypingStatisticsForAllTimeWhenDatesAreNull() {
    // Given
    UUID userId = UUID.randomUUID();
    GetTypingStatisticsCommand command = new GetTypingStatisticsCommand(userId, null, null);

    List<TypingSession> sessions =
        Arrays.asList(TestDataBuilder.createTypingSession(), TestDataBuilder.createTypingSession());

    when(typingSessionRepository.findByUserId(any(UserId.class))).thenReturn(sessions);

    // When
    GetTypingStatisticsResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTotalSessions()).isEqualTo(2);
    verify(typingSessionRepository).findByUserId(any(UserId.class));
  }

  @Test
  @DisplayName("Should return empty statistics when no sessions found")
  void shouldReturnEmptyStatisticsWhenNoSessionsFound() {
    // Given
    UUID userId = UUID.randomUUID();
    LocalDate fromDate = LocalDate.now().minusDays(7);
    LocalDate toDate = LocalDate.now();
    GetTypingStatisticsCommand command = new GetTypingStatisticsCommand(userId, fromDate, toDate);

    when(typingSessionRepository.findByUserIdAndDateRange(
            any(UserId.class), eq(fromDate), eq(toDate)))
        .thenReturn(Collections.emptyList());

    // When
    GetTypingStatisticsResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTotalSessions()).isEqualTo(0);
    assertThat(result.getAverageAccuracy()).isEqualTo(0.0);
    assertThat(result.getAverageDuration()).isEqualTo(0L);
  }

  @Test
  @DisplayName("Should calculate statistics correctly with multiple sessions")
  void shouldCalculateStatisticsCorrectlyWithMultipleSessions() {
    // Given
    UUID userId = UUID.randomUUID();
    LocalDate fromDate = LocalDate.now().minusDays(7);
    LocalDate toDate = LocalDate.now();
    GetTypingStatisticsCommand command = new GetTypingStatisticsCommand(userId, fromDate, toDate);

    List<TypingSession> sessions =
        Arrays.asList(
            TestDataBuilder.createTypingSession(),
            TestDataBuilder.createTypingSession(),
            TestDataBuilder.createTypingSession());

    when(typingSessionRepository.findByUserIdAndDateRange(
            any(UserId.class), eq(fromDate), eq(toDate)))
        .thenReturn(sessions);

    // When
    GetTypingStatisticsResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTotalSessions()).isEqualTo(3);
    assertThat(result.getAverageAccuracy()).isGreaterThan(0.0);
    assertThat(result.getAverageDuration()).isGreaterThan(0L);
  }

  @Test
  @DisplayName("Should throw exception when command is null")
  void shouldThrowExceptionWhenCommandIsNull() {
    // When & Then
    assertThatThrownBy(() -> useCase.execute(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Get typing statistics command cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when repository fails")
  void shouldThrowExceptionWhenRepositoryFails() {
    // Given
    UUID userId = UUID.randomUUID();
    LocalDate fromDate = LocalDate.now().minusDays(7);
    LocalDate toDate = LocalDate.now();
    GetTypingStatisticsCommand command = new GetTypingStatisticsCommand(userId, fromDate, toDate);

    when(typingSessionRepository.findByUserIdAndDateRange(
            any(UserId.class), eq(fromDate), eq(toDate)))
        .thenThrow(new RuntimeException("Database error"));

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(TypingStatisticsRetrievalException.class)
        .hasMessageContaining("Failed to retrieve typing statistics");
  }

  @Test
  @DisplayName("Should throw exception when userId is null in command")
  void shouldThrowExceptionWhenUserIdIsNull() {
    // When & Then
    assertThatThrownBy(
            () ->
                new GetTypingStatisticsCommand(null, LocalDate.now().minusDays(7), LocalDate.now()))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("User ID cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when fromDate is after toDate")
  void shouldThrowExceptionWhenFromDateIsAfterToDate() {
    // When & Then
    assertThatThrownBy(
            () ->
                new GetTypingStatisticsCommand(
                    UUID.randomUUID(), LocalDate.now(), LocalDate.now().minusDays(1)))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("From date cannot be after to date");
  }

  @Test
  @DisplayName("Should handle single session correctly")
  void shouldHandleSingleSessionCorrectly() {
    // Given
    UUID userId = UUID.randomUUID();
    LocalDate fromDate = LocalDate.now().minusDays(1);
    LocalDate toDate = LocalDate.now();
    GetTypingStatisticsCommand command = new GetTypingStatisticsCommand(userId, fromDate, toDate);

    List<TypingSession> sessions = Arrays.asList(TestDataBuilder.createTypingSession());

    when(typingSessionRepository.findByUserIdAndDateRange(
            any(UserId.class), eq(fromDate), eq(toDate)))
        .thenReturn(sessions);

    // When
    GetTypingStatisticsResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTotalSessions()).isEqualTo(1);
    assertThat(result.getAverageAccuracy()).isGreaterThan(0.0);
    assertThat(result.getAverageDuration()).isGreaterThan(0L);
  }

  @Test
  @DisplayName("Should handle same from and to date")
  void shouldHandleSameFromAndToDate() {
    // Given
    UUID userId = UUID.randomUUID();
    LocalDate date = LocalDate.now();
    GetTypingStatisticsCommand command = new GetTypingStatisticsCommand(userId, date, date);

    List<TypingSession> sessions = Arrays.asList(TestDataBuilder.createTypingSession());

    when(typingSessionRepository.findByUserIdAndDateRange(any(UserId.class), eq(date), eq(date)))
        .thenReturn(sessions);

    // When
    GetTypingStatisticsResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getTotalSessions()).isEqualTo(1);
    verify(typingSessionRepository).findByUserIdAndDateRange(any(UserId.class), eq(date), eq(date));
  }
}
