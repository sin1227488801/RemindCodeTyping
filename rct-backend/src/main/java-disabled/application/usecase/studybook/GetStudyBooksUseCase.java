package com.rct.application.usecase.studybook;

import com.rct.domain.model.studybook.Language;
import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.domain.model.user.UserId;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case for retrieving study books with filtering and pagination. Handles the business logic for
 * study book queries.
 *
 * <p>This use case follows the Single Responsibility Principle by focusing solely on study book
 * retrieval logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GetStudyBooksUseCase {

  private final StudyBookRepository studyBookRepository;

  /**
   * Retrieves study books with filtering and pagination.
   *
   * @param query the query containing filter and pagination parameters
   * @return the query result
   * @throws IllegalArgumentException if query is null
   */
  @Transactional(readOnly = true)
  public StudyBookQueryResult execute(StudyBookQuery query) {
    Objects.requireNonNull(query, "Study book query cannot be null");

    log.debug(
        "Querying study books for user: {} with filters: {}",
        query.getUserId(),
        query.getLanguage());

    try {
      UserId userId = UserId.of(query.getUserId());
      Pageable pageable = createPageable(query);

      List<StudyBook> studyBooksList;
      if (query.getLanguage() != null && !query.getLanguage().trim().isEmpty()) {
        studyBooksList = studyBookRepository.findByUserIdAndLanguage(userId, query.getLanguage());
      } else {
        studyBooksList = studyBookRepository.findByUserId(userId);
      }
      
      // Convert List to Page for compatibility
      Page<StudyBook> studyBooks = new PageImpl<>(studyBooksList, pageable, studyBooksList.size());

      log.debug("Found {} study books for user: {}", studyBooks.getTotalElements(), userId);

      return StudyBookQueryResult.success(studyBooks);
    } catch (Exception e) {
      log.error("Failed to query study books for user: {}", query.getUserId(), e);
      return StudyBookQueryResult.failure("Failed to retrieve study books: " + e.getMessage());
    }
  }

  /**
   * Retrieves random study books for practice.
   *
   * @param query the random query containing parameters
   * @return the query result
   * @throws IllegalArgumentException if query is null
   */
  @Transactional(readOnly = true)
  public RandomStudyBookResult executeRandom(RandomStudyBookQuery query) {
    Objects.requireNonNull(query, "Random study book query cannot be null");

    log.debug(
        "Querying random study books for language: {} with limit: {}",
        query.getLanguage(),
        query.getLimit());

    try {
      List<StudyBook> studyBooks =
          studyBookRepository.findRandomByLanguage(query.getLanguage(), query.getLimit());

      log.debug("Found {} random study books for language: {}", studyBooks.size(), query.getLanguage());

      return RandomStudyBookResult.success(studyBooks);
    } catch (Exception e) {
      log.error("Failed to query random study books for language: {}", query.getLanguage(), e);
      return RandomStudyBookResult.failure(
          "Failed to retrieve random study books: " + e.getMessage());
    }
  }

  private Pageable createPageable(StudyBookQuery query) {
    Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
    return PageRequest.of(query.getPage(), query.getSize(), sort);
  }

  /** Query object for study book retrieval request. */
  public static class StudyBookQuery {
    private final UUID userId;
    private final String language;
    private final int page;
    private final int size;

    public StudyBookQuery(UUID userId, String language, int page, int size) {
      this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
      this.language = language; // Can be null for no filtering
      this.page = Math.max(0, page);
      this.size = Math.min(Math.max(1, size), 100); // Limit size between 1 and 100
    }

    public UUID getUserId() {
      return userId;
    }

    public String getLanguage() {
      return language;
    }

    public int getPage() {
      return page;
    }

    public int getSize() {
      return size;
    }
  }

  /** Query object for random study book retrieval request. */
  public static class RandomStudyBookQuery {
    private final String language;
    private final int limit;

    public RandomStudyBookQuery(String language, int limit) {
      this.language = Objects.requireNonNull(language, "Language cannot be null");
      this.limit = Math.min(Math.max(1, limit), 50); // Limit between 1 and 50
    }

    public String getLanguage() {
      return language;
    }

    public int getLimit() {
      return limit;
    }
  }

  /** Result object for study book query response. */
  public static class StudyBookQueryResult {
    private final boolean success;
    private final Page<StudyBook> studyBooks;
    private final String errorMessage;

    private StudyBookQueryResult(boolean success, Page<StudyBook> studyBooks, String errorMessage) {
      this.success = success;
      this.studyBooks = studyBooks;
      this.errorMessage = errorMessage;
    }

    public static StudyBookQueryResult success(Page<StudyBook> studyBooks) {
      return new StudyBookQueryResult(true, studyBooks, null);
    }

    public static StudyBookQueryResult failure(String errorMessage) {
      return new StudyBookQueryResult(false, null, errorMessage);
    }

    public boolean isSuccess() {
      return success;
    }

    public Page<StudyBook> getStudyBooks() {
      return studyBooks;
    }

    public String getErrorMessage() {
      return errorMessage;
    }
  }

  /** Result object for random study book query response. */
  public static class RandomStudyBookResult {
    private final boolean success;
    private final List<StudyBook> studyBooks;
    private final String errorMessage;

    private RandomStudyBookResult(
        boolean success, List<StudyBook> studyBooks, String errorMessage) {
      this.success = success;
      this.studyBooks = studyBooks;
      this.errorMessage = errorMessage;
    }

    public static RandomStudyBookResult success(List<StudyBook> studyBooks) {
      return new RandomStudyBookResult(true, studyBooks, null);
    }

    public static RandomStudyBookResult failure(String errorMessage) {
      return new RandomStudyBookResult(false, null, errorMessage);
    }

    public boolean isSuccess() {
      return success;
    }

    public List<StudyBook> getStudyBooks() {
      return studyBooks;
    }

    public String getErrorMessage() {
      return errorMessage;
    }
  }
}
