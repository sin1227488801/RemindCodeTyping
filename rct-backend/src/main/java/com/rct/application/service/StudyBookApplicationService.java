package com.rct.application.service;

import com.rct.application.command.*;
import com.rct.application.result.StudyBookListResult;
import com.rct.application.result.StudyBookPageResult;
import com.rct.application.result.StudyBookResult;
import com.rct.application.usecase.studybook.CreateStudyBookUseCase;
import com.rct.application.usecase.studybook.DeleteStudyBookUseCase;
import com.rct.application.usecase.studybook.GetStudyBooksUseCase;
import com.rct.application.usecase.studybook.UpdateStudyBookUseCase;
import com.rct.domain.model.studybook.StudyBook;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

/**
 * Application service that coordinates study book-related use cases. Provides a unified interface
 * for study book operations and handles cross-cutting concerns.
 *
 * <p>This service acts as a facade for study book use cases and can handle transaction management,
 * security, and other cross-cutting concerns.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StudyBookApplicationService {

  private final CreateStudyBookUseCase createStudyBookUseCase;
  private final UpdateStudyBookUseCase updateStudyBookUseCase;
  private final DeleteStudyBookUseCase deleteStudyBookUseCase;
  private final GetStudyBooksUseCase getStudyBooksUseCase;

  /**
   * Creates a new study book.
   *
   * @param command the create study book command
   * @return the creation result
   */
  public StudyBookResult createStudyBook(CreateStudyBookCommand command) {
    log.debug("Processing create study book request for user: {}", command.getUserId());

    var useCaseCommand =
        new CreateStudyBookUseCase.CreateStudyBookCommand(
            command.getUserId(),
            command.getLanguage(),
            command.getQuestion(),
            command.getExplanation(),
            false // User problems are not system problems
            );

    var result = createStudyBookUseCase.execute(useCaseCommand);

    if (!result.isSuccess()) {
      throw new RuntimeException(result.getErrorMessage());
    }

    return StudyBookResult.from(result.getStudyBook());
  }

  /**
   * Updates an existing study book.
   *
   * @param command the update study book command
   * @return the update result
   */
  public StudyBookResult updateStudyBook(UpdateStudyBookCommand command) {
    log.debug(
        "Processing update study book request: {} by user: {}",
        command.getStudyBookId(),
        command.getUserId());

    var useCaseCommand =
        new UpdateStudyBookUseCase.UpdateStudyBookCommand(
            command.getStudyBookId(),
            command.getUserId(),
            command.getLanguage(),
            command.getQuestion(),
            command.getExplanation());

    var result = updateStudyBookUseCase.execute(useCaseCommand);

    if (!result.isSuccess()) {
      throw new RuntimeException(result.getErrorMessage());
    }

    return StudyBookResult.from(result.getStudyBook());
  }

  /**
   * Deletes a study book.
   *
   * @param command the delete study book command
   */
  public void deleteStudyBook(DeleteStudyBookCommand command) {
    log.debug(
        "Processing delete study book request: {} by user: {}",
        command.getStudyBookId(),
        command.getUserId());

    var useCaseCommand =
        new DeleteStudyBookUseCase.DeleteStudyBookCommand(
            command.getStudyBookId(), command.getUserId());

    var result = deleteStudyBookUseCase.execute(useCaseCommand);

    if (!result.isSuccess()) {
      throw new RuntimeException(result.getErrorMessage());
    }
  }

  /**
   * Retrieves study books for a user with optional filtering and pagination.
   *
   * @param command the get study books command
   * @return the query result
   */
  public StudyBookPageResult getStudyBooks(GetStudyBooksCommand command) {
    log.debug(
        "Processing get study books request for user: {} with language filter: {}",
        command.getUserId(),
        command.getLanguage());

    var query =
        new GetStudyBooksUseCase.StudyBookQuery(
            command.getUserId(), command.getLanguage(), command.getPage(), command.getSize());

    var result = getStudyBooksUseCase.execute(query);

    if (!result.isSuccess()) {
      throw new RuntimeException(result.getErrorMessage());
    }

    Page<StudyBook> studyBooks = result.getStudyBooks();
    Page<StudyBookResult> studyBookResults = studyBooks.map(StudyBookResult::from);

    return StudyBookPageResult.from(studyBookResults);
  }

  /**
   * Retrieves random study books for practice.
   *
   * @param command the get random study books command
   * @return the query result
   */
  public StudyBookListResult getRandomStudyBooks(GetRandomStudyBooksCommand command) {
    log.debug(
        "Processing get random study books request for language: {} with limit: {}",
        command.getLanguage(),
        command.getLimit());

    var query =
        new GetStudyBooksUseCase.RandomStudyBookQuery(command.getLanguage(), command.getLimit());

    var result = getStudyBooksUseCase.executeRandom(query);

    if (!result.isSuccess()) {
      throw new RuntimeException(result.getErrorMessage());
    }

    List<StudyBookResult> studyBookResults =
        result.getStudyBooks().stream().map(StudyBookResult::from).collect(Collectors.toList());

    return StudyBookListResult.from(studyBookResults);
  }

  /**
   * Retrieves all available languages.
   *
   * @param command the get languages command
   * @return the list of languages
   */
  public List<String> getAllLanguages(GetLanguagesCommand command) {
    log.debug("Processing get all languages request for user: {}", command.getUserId());

    // For now, delegate to the existing use case
    var query =
        new GetStudyBooksUseCase.StudyBookQuery(
            command.getUserId(),
            null, // No language filter
            0,
            1 // We just need to trigger the query, not get actual results
            );

    // This is a simplified implementation - in a real scenario,
    // you might want a dedicated use case for getting languages
    var result = getStudyBooksUseCase.execute(query);

    if (!result.isSuccess()) {
      throw new RuntimeException(result.getErrorMessage());
    }

    // Extract unique languages from the results
    // This is a placeholder - you might want to implement a more efficient approach
    return result.getStudyBooks().getContent().stream()
        .map(studyBook -> studyBook.getLanguage().getValue())
        .distinct()
        .collect(Collectors.toList());
  }
}
