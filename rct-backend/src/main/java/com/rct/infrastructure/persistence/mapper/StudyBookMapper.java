package com.rct.infrastructure.persistence.mapper;

import com.rct.domain.model.studybook.*;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.persistence.entity.StudyBookEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper class for converting between StudyBook domain entity and StudyBookEntity JPA entity. This
 * maintains the separation between domain and infrastructure layers.
 */
@Component
public class StudyBookMapper {

  /**
   * Converts a domain StudyBook to a JPA StudyBookEntity.
   *
   * @param studyBook the domain study book
   * @return the corresponding JPA entity
   */
  public StudyBookEntity toEntity(StudyBook studyBook) {
    if (studyBook == null) {
      return null;
    }

    StudyBookEntity entity = new StudyBookEntity(studyBook.getId().getValue());
    entity.setUserId(studyBook.getUserId() != null ? studyBook.getUserId().getValue() : null);
    entity.setLanguage(studyBook.getLanguage().getValue());
    entity.setQuestion(studyBook.getQuestion().getContent());
    entity.setExplanation(
        studyBook.getExplanation() != null ? studyBook.getExplanation().getContent() : null);
    entity.setIsSystemProblem(studyBook.isSystemProblem());
    entity.setDifficultyLevel(1); // Default difficulty level
    entity.setCreatedAt(studyBook.getCreatedAt());
    entity.setUpdatedAt(studyBook.getUpdatedAt());

    return entity;
  }

  /**
   * Converts a JPA StudyBookEntity to a domain StudyBook.
   *
   * @param entity the JPA entity
   * @return the corresponding domain study book
   */
  public StudyBook toDomain(StudyBookEntity entity) {
    if (entity == null) {
      return null;
    }

    StudyBookId studyBookId = StudyBookId.of(entity.getId());
    UserId userId = entity.getUserId() != null ? UserId.of(entity.getUserId()) : null;
    Language language = Language.of(entity.getLanguage());
    Question question = Question.of(entity.getQuestion());
    Explanation explanation =
        entity.getExplanation() != null ? Explanation.of(entity.getExplanation()) : null;

    return StudyBook.reconstruct(
        studyBookId,
        userId,
        language,
        question,
        explanation,
        entity.getIsSystemProblem(),
        entity.getCreatedAt(),
        entity.getUpdatedAt());
  }

  /**
   * Creates a new StudyBookEntity for a new domain StudyBook (without ID).
   *
   * @param studyBook the domain study book
   * @return the corresponding JPA entity without ID set
   */
  public StudyBookEntity toNewEntity(StudyBook studyBook) {
    if (studyBook == null) {
      return null;
    }

    return new StudyBookEntity(
        studyBook.getUserId() != null ? studyBook.getUserId().getValue() : null,
        studyBook.getLanguage().getValue(),
        studyBook.getQuestion().getContent(),
        studyBook.getExplanation() != null ? studyBook.getExplanation().getContent() : null,
        studyBook.isSystemProblem(),
        1); // Default difficulty level
  }

  /**
   * Updates an existing StudyBookEntity with data from a domain StudyBook.
   *
   * @param entity the existing JPA entity
   * @param studyBook the domain study book with updated data
   */
  public void updateEntity(StudyBookEntity entity, StudyBook studyBook) {
    if (entity == null || studyBook == null) {
      return;
    }

    entity.setUserId(studyBook.getUserId() != null ? studyBook.getUserId().getValue() : null);
    entity.setLanguage(studyBook.getLanguage().getValue());
    entity.setQuestion(studyBook.getQuestion().getContent());
    entity.setExplanation(
        studyBook.getExplanation() != null ? studyBook.getExplanation().getContent() : null);
    entity.setIsSystemProblem(studyBook.isSystemProblem());
    entity.setUpdatedAt(studyBook.getUpdatedAt());
  }
}
