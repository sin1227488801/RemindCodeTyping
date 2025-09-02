package com.rct.presentation.mapper;

import com.rct.application.command.GetTypingStatisticsCommand;
import com.rct.application.command.RecordTypingResultCommand;
import com.rct.application.result.TypingStatisticsResult;
import com.rct.presentation.dto.request.RecordTypingResultRequest;
import com.rct.presentation.dto.response.TypingStatisticsResponse;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between presentation DTOs and application layer objects for typing
 * sessions.
 */
@Component
public class TypingSessionDtoMapper {

  /** Converts RecordTypingResultRequest to RecordTypingResultCommand. */
  public RecordTypingResultCommand toRecordTypingResultCommand(
      UUID userId, RecordTypingResultRequest request) {
    return new RecordTypingResultCommand(
        userId,
        request.getStudyBookId(),
        request.getStartedAt(),
        request.getDurationMs(),
        request.getTotalChars(),
        request.getCorrectChars());
  }

  /** Converts parameters to GetTypingStatisticsCommand. */
  public GetTypingStatisticsCommand toGetTypingStatisticsCommand(UUID userId) {
    return new GetTypingStatisticsCommand(userId);
  }

  /** Converts TypingStatisticsResult to TypingStatisticsResponse. */
  public TypingStatisticsResponse toTypingStatisticsResponse(TypingStatisticsResult result) {
    return new TypingStatisticsResponse(
        result.getTotalAttempts(),
        result.getAverageAccuracy(),
        result.getBestAccuracy(),
        result.getTotalCharsTyped(),
        result.getTotalTimeMs(),
        result.getCurrentLoginStreak(),
        result.getMaxLoginStreak(),
        result.getTotalLoginDays());
  }
}
