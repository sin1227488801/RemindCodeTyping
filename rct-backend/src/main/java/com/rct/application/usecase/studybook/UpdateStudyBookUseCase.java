package com.rct.application.usecase.studybook;

import com.rct.domain.model.studybook.Explanation;
import com.rct.domain.model.studybook.Language;
import com.rct.domain.model.studybook.Question;
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
 * Use case for updating an existing study book. Handles the business logic for study book updates
 * including validation and persistence.
 *
 * <p>This use case follows the Single Responsibility Principle by focusing solely on study book
 * update logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UpdateStudyBookUseCase {

  private final StudyBookRepository studyBookRepository;

  /**
   * Updates an existing study book with the provided information.
   *
   * @param command the update command containing study book information
   * @return the update result
   * @throws IllegalArgumentException if command is null
   * @throws StudyBookUpdateException if update fails
   */
  @Transactional
  public StudyBookUpdateResult execute(UpdateStudyBookCommand command) {
    Objects.requireNonNull(command, "Update study book command cannot be null");

    log.debug("Updating study book: {}", command.getStudyBookId());

    StudyBookId studyBookId = StudyBookId.of(command.getStudyBookId());
    StudyBook existingStudyBook =
        studyBookRepository
            .findById(studyBookId)
            .orElseThrow(
                () -> {
                  log.warn("Study book not found: {}", studyBookId);
                  return new StudyBookUpdateException("Study book not found");
                });

    // Verify ownership
    UserId requestingUserId = UserId.of(command.getUserId());
    if (!existingStudyBook.belongsToUser(requestingUserId)) {
      log.warn(
          "User {} attempted to update study book {} owned by different user",
          requestingUserId,
          studyBookId);
      throw new StudyBookUpdateException("Not authorized to update this study book");
    }

    try {
      // Create updated domain objects
      Language language = Language.of(command.getLanguage());
      Question question = Question.of(command.getQuestion());
      Explanation explanation =
          command.getExplanation() != null ? Explanation.of(command.getExplanation()) : null;

      // Update study book
      StudyBook updatedStudyBook = existingStudyBook.update(language, question, explanation);
      StudyBook savedStudyBook = studyBookRepository.save(updatedStudyBook);

      log.info("Study book updated successfully: {}", studyBookId);

      return StudyBookUpdateResult.success(savedStudyBook);
    } catch (Exception e) {
      log.error("Failed to update study book: {}", studyBookId, e);
      throw new StudyBookUpdateException("Failed to update study book: " + e.getMessage(), e);
    }
  }

  /** Command object for study book update request. */
  public static class UpdateStudyBookCommand {
    private final UUID studyBookId;
    private final UUID userId;
    private final String language;
    private final String question;
    private final String explanation;

    public UpdateStudyBookCommand(
        UUID studyBookId, UUID userId, String language, String question, String explanation) {
      this.studyBookId = Objects.requireNonNull(studyBookId, "Study book ID cannot be null");
      this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
      this.language = Objects.requireNonNull(language, "Language cannot be null");
      this.question = Objects.requireNonNull(question, "Question cannot be null");
      this.explanation = explanation; // Can be null
      validateInput();
    }

    private void validateInput() {
      if (language.trim().isEmpty()) {
        throw new IllegalArgumentException("Language cannot be empty");
      }
      if (question.trim().isEmpty()) {
        throw new IllegalArgumentException("Question cannot be empty");
      }
    }

    public UUID getStudyBookId() {
      return studyBookId;
    }

    public UUID getUserId() {
      return userId;
    }

    public String getLanguage() {
      return language;
    }

    public String getQuestion() {
      return question;
    }

    public String getExplanation() {
      return explanation;
    }
  }

  /** Result object for study book update response. */
  public static class StudyBookUpdateResult {
    private final boolean success;
    private final StudyBook studyBook;
    private final String errorMessage;

    private StudyBookUpdateResult(boolean success, StudyBook studyBook, String errorMessage) {
      this.success = success;
      this.studyBook = studyBook;
      this.errorMessage = errorMessage;
    }

    public static StudyBookUpdateResult success(StudyBook studyBook) {
      return new StudyBookUpdateResult(true, studyBook, null);
    }

    public static StudyBookUpdateResult failure(String errorMessage) {
      return new StudyBookUpdateResult(false, null, errorMessage);
    }

    public boolean isSuccess() {
      return success;
    }

    public StudyBook getStudyBook() {
      return studyBook;
    }

    public String getErrorMessage() {
      return errorMessage;
    }
  }

  /** Exception thrown when study book update fails. */
  public static class StudyBookUpdateException extends RuntimeException {
    public StudyBookUpdateException(String message) {
      super(message);
    }

    public StudyBookUpdateException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
