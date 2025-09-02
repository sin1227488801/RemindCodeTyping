package com.rct.application.usecase.studybook;

import com.rct.domain.model.studybook.Explanation;
import com.rct.domain.model.studybook.Language;
import com.rct.domain.model.studybook.Question;
import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.domain.model.user.UserId;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case for creating a new study book. Handles the business logic for study book creation
 * including validation and persistence.
 *
 * <p>This use case follows the Single Responsibility Principle by focusing solely on study book
 * creation logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CreateStudyBookUseCase {

  private final StudyBookRepository studyBookRepository;

  /**
   * Creates a new study book with the provided information.
   *
   * @param command the creation command containing study book information
   * @return the creation result
   * @throws IllegalArgumentException if command is null
   * @throws StudyBookCreationException if creation fails
   */
  @Transactional
  public StudyBookCreationResult execute(CreateStudyBookCommand command) {
    Objects.requireNonNull(command, "Create study book command cannot be null");

    log.debug("Creating study book for user: {}", command.getUserId());

    try {
      // Create domain objects
      StudyBookId studyBookId = StudyBookId.generate();
      UserId userId = UserId.of(command.getUserId());
      Language language = Language.of(command.getLanguage());
      Question question = Question.of(command.getQuestion());
      Explanation explanation =
          command.getExplanation() != null ? Explanation.of(command.getExplanation()) : null;

      // Create study book
      StudyBook studyBook =
          StudyBook.create(
              studyBookId, userId, language, question, explanation);

      StudyBook savedStudyBook = studyBookRepository.save(studyBook);

      log.info("Study book created successfully: {}", studyBookId);

      return StudyBookCreationResult.success(savedStudyBook);
    } catch (Exception e) {
      log.error("Failed to create study book for user: {}", command.getUserId(), e);
      throw new StudyBookCreationException("Failed to create study book: " + e.getMessage(), e);
    }
  }

  /** Command object for study book creation request. */
  public static class CreateStudyBookCommand {
    private final java.util.UUID userId;
    private final String language;
    private final String question;
    private final String explanation;
    private final boolean isSystemProblem;

    public CreateStudyBookCommand(
        java.util.UUID userId,
        String language,
        String question,
        String explanation,
        boolean isSystemProblem) {
      this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
      this.language = Objects.requireNonNull(language, "Language cannot be null");
      this.question = Objects.requireNonNull(question, "Question cannot be null");
      this.explanation = explanation; // Can be null
      this.isSystemProblem = isSystemProblem;
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

    public java.util.UUID getUserId() {
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

    public boolean isSystemProblem() {
      return isSystemProblem;
    }
  }

  /** Result object for study book creation response. */
  public static class StudyBookCreationResult {
    private final boolean success;
    private final StudyBook studyBook;
    private final String errorMessage;

    private StudyBookCreationResult(boolean success, StudyBook studyBook, String errorMessage) {
      this.success = success;
      this.studyBook = studyBook;
      this.errorMessage = errorMessage;
    }

    public static StudyBookCreationResult success(StudyBook studyBook) {
      return new StudyBookCreationResult(true, studyBook, null);
    }

    public static StudyBookCreationResult failure(String errorMessage) {
      return new StudyBookCreationResult(false, null, errorMessage);
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

  /** Exception thrown when study book creation fails. */
  public static class StudyBookCreationException extends RuntimeException {
    public StudyBookCreationException(String message) {
      super(message);
    }

    public StudyBookCreationException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
