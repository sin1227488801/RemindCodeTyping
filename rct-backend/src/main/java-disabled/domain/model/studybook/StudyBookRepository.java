package com.rct.domain.model.studybook;

import com.rct.domain.model.user.UserId;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for StudyBook domain entity. Defines the contract for StudyBook data access
 * without implementation details.
 *
 * <p>This interface follows the Repository pattern from Domain-Driven Design, providing a
 * collection-like interface for accessing StudyBook aggregates.
 */
public interface StudyBookRepository {

  /**
   * Finds all study books belonging to a specific user.
   *
   * @param userId the ID of the user whose study books to retrieve
   * @return a list of study books owned by the user
   * @throws IllegalArgumentException if userId is null
   */
  List<StudyBook> findByUserId(UserId userId);

  /**
   * Finds study books by user ID and language.
   *
   * @param userId the ID of the user
   * @param language the programming language to filter by
   * @return a list of study books matching the criteria
   * @throws IllegalArgumentException if userId or language is null
   */
  List<StudyBook> findByUserIdAndLanguage(UserId userId, String language);

  /**
   * Finds random study books for a specific language. This is typically used for practice sessions.
   *
   * @param language the programming language
   * @param limit the maximum number of study books to return
   * @return a list of random study books for the language
   * @throws IllegalArgumentException if language is null or limit is negative
   */
  List<StudyBook> findRandomByLanguage(String language, int limit);

  /**
   * Finds system problems (built-in study books) by language.
   *
   * @param language the programming language
   * @return a list of system study books for the language
   * @throws IllegalArgumentException if language is null
   */
  List<StudyBook> findSystemProblemsByLanguage(String language);

  /**
   * Finds a study book by its unique ID.
   *
   * @param studyBookId the study book ID to search for
   * @return an Optional containing the StudyBook if found, empty otherwise
   * @throws IllegalArgumentException if studyBookId is null
   */
  Optional<StudyBook> findById(StudyBookId studyBookId);

  /**
   * Saves a study book to the repository. This method handles both creation of new study books and
   * updates to existing ones.
   *
   * @param studyBook the study book to save
   * @return the saved study book (may include generated ID for new study books)
   * @throws IllegalArgumentException if studyBook is null
   */
  StudyBook save(StudyBook studyBook);

  /**
   * Deletes a study book from the repository.
   *
   * @param studyBookId the ID of the study book to delete
   * @throws IllegalArgumentException if studyBookId is null
   */
  void deleteById(StudyBookId studyBookId);

  /**
   * Gets all distinct languages available in the system. This includes both user-created and system
   * study books.
   *
   * @return a list of available programming languages
   */
  List<String> findAllLanguages();

  /**
   * Gets all distinct languages for system problems.
   *
   * @return a list of languages that have system problems
   */
  List<String> findSystemProblemLanguages();

  /**
   * Gets all distinct languages for a specific user's study books.
   *
   * @param userId the user ID
   * @return a list of languages the user has study books for
   * @throws IllegalArgumentException if userId is null
   */
  List<String> findUserProblemLanguages(UserId userId);
}
