package com.rct.application.usecase.typingsession;

import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.domain.model.typingsession.TypingSession;
import com.rct.domain.model.typingsession.TypingSessionId;
import com.rct.domain.model.typingsession.TypingSessionRepository;
import com.rct.domain.model.user.UserId;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case for starting a typing session. Handles the business logic for typing session
 * initialization.
 *
 * <p>This use case follows the Single Responsibility Principle by focusing solely on typing session
 * initialization logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StartTypingSessionUseCase {

  private final TypingSessionRepository typingSessionRepository;
  private final StudyBookRepository studyBookRepository;

  /**
   * Starts a new typing session.
   *
   * @param command the command containing session information
   * @return the session start result
   * @throws IllegalArgumentException if command is null
   * @throws TypingSessionException if session start fails
   */
  @Transactional
  public TypingSessionStartResult execute(StartTypingSessionCommand command) {
    Objects.requireNonNull(command, "Start typing session command cannot be null");

    log.debug(
        "Starting typing session for user: {} with study book: {}",
        command.getUserId(),
        command.getStudyBookId());

    try {
      // Validate study book exists
      StudyBookId studyBookId = StudyBookId.of(command.getStudyBookId());
      StudyBook studyBook =
          studyBookRepository
              .findById(studyBookId)
              .orElseThrow(
                  () -> {
                    log.warn("Study book not found: {}", studyBookId);
                    return new TypingSessionException("Study book not found");
                  });

      // Create typing session
      TypingSessionId sessionId = TypingSessionId.generate();
      UserId userId = UserId.of(command.getUserId());
      LocalDateTime startedAt = LocalDateTime.now();

      TypingSession typingSession = TypingSession.start(sessionId, userId, studyBookId);
      TypingSession savedSession = typingSessionRepository.save(typingSession);

      log.info("Typing session started successfully: {}", sessionId);

      return TypingSessionStartResult.success(savedSession, studyBook);
    } catch (Exception e) {
      log.error("Failed to start typing session for user: {}", command.getUserId(), e);
      throw new TypingSessionException("Failed to start typing session: " + e.getMessage(), e);
    }
  }

  /** Command object for typing session start request. */
  public static class StartTypingSessionCommand {
    private final UUID userId;
    private final UUID studyBookId;

    public StartTypingSessionCommand(UUID userId, UUID studyBookId) {
      this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
      this.studyBookId = Objects.requireNonNull(studyBookId, "Study book ID cannot be null");
    }

    public UUID getUserId() {
      return userId;
    }

    public UUID getStudyBookId() {
      return studyBookId;
    }
  }

  /** Result object for typing session start response. */
  public static class TypingSessionStartResult {
    private final boolean success;
    private final TypingSession typingSession;
    private final StudyBook studyBook;
    private final String errorMessage;

    private TypingSessionStartResult(
        boolean success, TypingSession typingSession, StudyBook studyBook, String errorMessage) {
      this.success = success;
      this.typingSession = typingSession;
      this.studyBook = studyBook;
      this.errorMessage = errorMessage;
    }

    public static TypingSessionStartResult success(
        TypingSession typingSession, StudyBook studyBook) {
      return new TypingSessionStartResult(true, typingSession, studyBook, null);
    }

    public static TypingSessionStartResult failure(String errorMessage) {
      return new TypingSessionStartResult(false, null, null, errorMessage);
    }

    public boolean isSuccess() {
      return success;
    }

    public TypingSession getTypingSession() {
      return typingSession;
    }

    public StudyBook getStudyBook() {
      return studyBook;
    }

    public String getErrorMessage() {
      return errorMessage;
    }
  }

  /** Exception thrown when typing session operations fail. */
  public static class TypingSessionException extends RuntimeException {
    public TypingSessionException(String message) {
      super(message);
    }

    public TypingSessionException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
