package com.rct.application.service;

import com.rct.application.command.GetTypingStatisticsCommand;
import com.rct.application.command.RecordTypingResultCommand;
import com.rct.application.result.TypingStatisticsResult;
import com.rct.application.usecase.typingsession.GetTypingStatisticsUseCase;
import com.rct.application.usecase.typingsession.RecordTypingResultUseCase;
import com.rct.application.usecase.typingsession.StartTypingSessionUseCase;
import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.typingsession.Duration;
import com.rct.domain.model.typingsession.TypingResult;
import com.rct.domain.model.user.UserId;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Application service that coordinates typing session-related use cases. Provides a unified
 * interface for typing session operations and handles cross-cutting concerns.
 *
 * <p>This service acts as a facade for typing session use cases and can handle transaction
 * management, security, and other cross-cutting concerns.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TypingSessionApplicationService {

  private final StartTypingSessionUseCase startTypingSessionUseCase;
  private final RecordTypingResultUseCase recordTypingResultUseCase;
  private final GetTypingStatisticsUseCase getTypingStatisticsUseCase;

  /**
   * Records the result of a typing session.
   *
   * @param command the record typing result command
   */
  public void recordTypingResult(RecordTypingResultCommand command) {
    log.debug(
        "Processing record typing result request for user: {} with study book: {}",
        command.getUserId(),
        command.getStudyBookId());

    // Create domain objects
    UserId userId = UserId.of(command.getUserId());
    StudyBookId studyBookId = StudyBookId.of(command.getStudyBookId());
    Duration duration = Duration.ofMilliseconds(command.getDurationMs());

    // Start a new typing session first
    var startCommand = new StartTypingSessionUseCase.StartTypingSessionCommand(
        command.getUserId(),
        command.getStudyBookId()
    );
    
    var sessionResult = startTypingSessionUseCase.execute(startCommand);
    
    if (!sessionResult.isSuccess()) {
      throw new RuntimeException(sessionResult.getErrorMessage());
    }

    // Now record the result for the created session
    // For simplicity, we'll calculate the typed text based on accuracy
    String typedText = generateTypedTextFromAccuracy(command.getTotalChars(), command.getCorrectChars());
    
    var recordCommand = new RecordTypingResultUseCase.RecordTypingResultCommand(
        sessionResult.getTypingSession().getId().getValue(),
        command.getUserId(),
        typedText
    );

    var result = recordTypingResultUseCase.execute(recordCommand);

    if (!result.isSuccess()) {
      throw new RuntimeException(result.getErrorMessage());
    }

    log.info("Typing result recorded successfully for user: {}", command.getUserId());
  }
  
  private String generateTypedTextFromAccuracy(int totalChars, int correctChars) {
    // This is a simplified implementation for demo purposes
    // In a real application, the typed text would come from the frontend
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < totalChars; i++) {
      if (i < correctChars) {
        sb.append('a'); // Correct character
      } else {
        sb.append('x'); // Incorrect character
      }
    }
    return sb.toString();
  }

  /**
   * Retrieves typing statistics for a user.
   *
   * @param command the get typing statistics command
   * @return the statistics result
   */
  public TypingStatisticsResult getTypingStatistics(GetTypingStatisticsCommand command) {
    log.debug("Processing get typing statistics request for user: {}", command.getUserId());

    var query =
        new GetTypingStatisticsUseCase.TypingStatisticsQuery(
            command.getUserId(),
            null, // From date - get all time statistics
            null // To date - get all time statistics
            );

    var useCaseResult = getTypingStatisticsUseCase.execute(query);

    if (!useCaseResult.isSuccess()) {
      throw new RuntimeException(useCaseResult.getErrorMessage());
    }

    // Convert use case result to application result
    var statistics = useCaseResult.getStatistics();
    return new TypingStatisticsResult(
        (long) statistics.getTotalSessions(),
        java.math.BigDecimal.valueOf(statistics.getAverageAccuracy()),
        java.math.BigDecimal.valueOf(statistics.getMaxAccuracy()),
        statistics.getTotalCharacters(),
        0L, // Total time - would need to be calculated from sessions
        0, // Current login streak - would need user login data
        0, // Max login streak - would need user login data
        0 // Total login days - would need user login data
    );
  }
}
