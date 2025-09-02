package com.rct.application.usecase.studybook;

import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.domain.model.user.UserId;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case for deleting a study book. Handles the business logic for study book deletion including
 * authorization and persistence.
 *
 * <p>This use case follows the Single Responsibility Principle by focusing solely on study book
 * deletion logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeleteStudyBookUseCase {

  private final StudyBookRepository studyBookRepository;

  /**
   * Deletes a study book.
   *
   * @param command the deletion command containing study book information
   * @return the deletion result
   * @throws IllegalArgumentException if command is null
   * @throws StudyBookDeletionException if deletion fails
   */
  @Transactional
  public StudyBookDeletionResult execute(DeleteStudyBookCommand command) {
    Objects.requireNonNull(command, "Delete study book command cannot be null");

    log.debug("Deleting study book: {}", command.getStudyBookId());

    StudyBookId studyBookId = StudyBookId.of(command.getStudyBookId());
    StudyBook existingStudyBook =
        studyBookRepository
            .findById(studyBookId)
            .orElseThrow(
                () -> {
                  log.warn("Study book not found: {}", studyBookId);
                  return new StudyBookDeletionException("Study book not found");
                });

    // Verify ownership
    UserId requestingUserId = UserId.of(command.getUserId());
    if (!existingStudyBook.belongsToUser(requestingUserId)) {
      log.warn(
          "User {} attempted to delete study book {} owned by different user",
          requestingUserId,
          studyBookId);
      throw new StudyBookDeletionException("Not authorized to delete this study book");
    }

    // Prevent deletion of system problems
    if (existingStudyBook.isSystemProblem()) {
      log.warn("User {} attempted to delete system study book: {}", requestingUserId, studyBookId);
      throw new StudyBookDeletionException("Cannot delete system study books");
    }

    try {
      studyBookRepository.deleteById(studyBookId);

      log.info("Study book deleted successfully: {}", studyBookId);

      return StudyBookDeletionResult.success();
    } catch (Exception e) {
      log.error("Failed to delete study book: {}", studyBookId, e);
      throw new StudyBookDeletionException("Failed to delete study book: " + e.getMessage(), e);
    }
  }

  /** Command object for study book deletion request. */
  public static class DeleteStudyBookCommand {
    private final UUID studyBookId;
    private final UUID userId;

    public DeleteStudyBookCommand(UUID studyBookId, UUID userId) {
      this.studyBookId = Objects.requireNonNull(studyBookId, "Study book ID cannot be null");
      this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    }

    public UUID getStudyBookId() {
      return studyBookId;
    }

    public UUID getUserId() {
      return userId;
    }
  }

  /** Result object for study book deletion response. */
  public static class StudyBookDeletionResult {
    private final boolean success;
    private final String errorMessage;

    private StudyBookDeletionResult(boolean success, String errorMessage) {
      this.success = success;
      this.errorMessage = errorMessage;
    }

    public static StudyBookDeletionResult success() {
      return new StudyBookDeletionResult(true, null);
    }

    public static StudyBookDeletionResult failure(String errorMessage) {
      return new StudyBookDeletionResult(false, errorMessage);
    }

    public boolean isSuccess() {
      return success;
    }

    public String getErrorMessage() {
      return errorMessage;
    }
  }

  /** Exception thrown when study book deletion fails. */
  public static class StudyBookDeletionException extends RuntimeException {
    public StudyBookDeletionException(String message) {
      super(message);
    }

    public StudyBookDeletionException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
