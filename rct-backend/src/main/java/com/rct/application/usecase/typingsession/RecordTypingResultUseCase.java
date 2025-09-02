package com.rct.application.usecase.typingsession;

import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.domain.model.typingsession.TypingSession;
import com.rct.domain.model.typingsession.TypingSessionId;
import com.rct.domain.model.typingsession.TypingSessionRepository;
import com.rct.domain.model.user.UserId;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case for recording typing session results. Handles the business logic for typing result
 * calculation and persistence.
 *
 * <p>This use case follows the Single Responsibility Principle by focusing solely on typing result
 * recording logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecordTypingResultUseCase {

  private final TypingSessionRepository typingSessionRepository;
  private final StudyBookRepository studyBookRepository;

  /**
   * Records the result of a typing session.
   *
   * @param command the command containing typing result information
   * @return the recording result
   * @throws IllegalArgumentException if command is null
   * @throws TypingResultException if recording fails
   */
  @Transactional
  public TypingResultRecordingResult execute(RecordTypingResultCommand command) {
    Objects.requireNonNull(command, "Record typing result command cannot be null");

    log.debug("Recording typing result for session: {}", command.getSessionId());

    try {
      // Find the typing session
      TypingSessionId sessionId = TypingSessionId.of(command.getSessionId());
      TypingSession typingSession =
          typingSessionRepository
              .findById(sessionId)
              .orElseThrow(
                  () -> {
                    log.warn("Typing session not found: {}", sessionId);
                    return new TypingResultException("Typing session not found");
                  });

      // Verify ownership
      UserId requestingUserId = UserId.of(command.getUserId());
      if (!typingSession.belongsToUser(requestingUserId)) {
        log.warn(
            "User {} attempted to record result for session {} owned by different user",
            requestingUserId,
            sessionId);
        throw new TypingResultException("Not authorized to record result for this session");
      }

      // Get the study book to get the target text
      StudyBook studyBook =
          studyBookRepository
              .findById(typingSession.getStudyBookId())
              .orElseThrow(
                  () -> {
                    log.warn("Study book not found for session: {}", sessionId);
                    return new TypingResultException("Study book not found for session");
                  });

      // Complete the typing session with the result
      TypingSession completedSession =
          typingSession.complete(command.getTypedText(), studyBook.getQuestion().getContent());

      TypingSession savedSession = typingSessionRepository.save(completedSession);

      log.info(
          "Typing result recorded successfully for session: {} with accuracy: {}%",
          sessionId, completedSession.getResult().getAccuracy());

      return TypingResultRecordingResult.success(savedSession);
    } catch (Exception e) {
      log.error("Failed to record typing result for session: {}", command.getSessionId(), e);
      throw new TypingResultException("Failed to record typing result: " + e.getMessage(), e);
    }
  }

  /** Command object for typing result recording request. */
  public static class RecordTypingResultCommand {
    private final UUID sessionId;
    private final UUID userId;
    private final String typedText;

    public RecordTypingResultCommand(UUID sessionId, UUID userId, String typedText) {
      this.sessionId = Objects.requireNonNull(sessionId, "Session ID cannot be null");
      this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
      this.typedText = Objects.requireNonNull(typedText, "Typed text cannot be null");
    }

    public UUID getSessionId() {
      return sessionId;
    }

    public UUID getUserId() {
      return userId;
    }

    public String getTypedText() {
      return typedText;
    }
  }

  /** Result object for typing result recording response. */
  public static class TypingResultRecordingResult {
    private final boolean success;
    private final TypingSession typingSession;
    private final String errorMessage;

    private TypingResultRecordingResult(
        boolean success, TypingSession typingSession, String errorMessage) {
      this.success = success;
      this.typingSession = typingSession;
      this.errorMessage = errorMessage;
    }

    public static TypingResultRecordingResult success(TypingSession typingSession) {
      return new TypingResultRecordingResult(true, typingSession, null);
    }

    public static TypingResultRecordingResult failure(String errorMessage) {
      return new TypingResultRecordingResult(false, null, errorMessage);
    }

    public boolean isSuccess() {
      return success;
    }

    public TypingSession getTypingSession() {
      return typingSession;
    }

    public String getErrorMessage() {
      return errorMessage;
    }
  }

  /** Exception thrown when typing result recording fails. */
  public static class TypingResultException extends RuntimeException {
    public TypingResultException(String message) {
      super(message);
    }

    public TypingResultException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
