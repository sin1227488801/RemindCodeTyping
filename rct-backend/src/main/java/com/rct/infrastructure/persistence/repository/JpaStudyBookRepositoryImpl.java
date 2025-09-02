package com.rct.infrastructure.persistence.repository;

import com.rct.domain.model.studybook.*;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.persistence.entity.StudyBookEntity;
import com.rct.infrastructure.persistence.mapper.StudyBookMapper;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * JPA implementation of the StudyBookRepository domain interface. This class bridges the domain
 * layer with the persistence infrastructure while maintaining clean architecture boundaries.
 */
@Repository
@Transactional
public class JpaStudyBookRepositoryImpl implements StudyBookRepository {

  private final JpaStudyBookEntityRepository jpaRepository;
  private final StudyBookMapper studyBookMapper;

  public JpaStudyBookRepositoryImpl(
      JpaStudyBookEntityRepository jpaRepository, StudyBookMapper studyBookMapper) {
    this.jpaRepository = jpaRepository;
    this.studyBookMapper = studyBookMapper;
  }

  @Override
  @Transactional(readOnly = true)
  public List<StudyBook> findByUserId(UserId userId) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }

    return jpaRepository.findByUserId(userId.getValue()).stream()
        .map(studyBookMapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public List<StudyBook> findByUserIdAndLanguage(UserId userId, String language) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }
    if (language == null) {
      throw new IllegalArgumentException("Language cannot be null");
    }

    return jpaRepository.findByUserIdAndLanguage(userId.getValue(), language).stream()
        .map(studyBookMapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public List<StudyBook> findRandomByLanguage(String language, int limit) {
    if (language == null) {
      throw new IllegalArgumentException("Language cannot be null");
    }
    if (limit < 0) {
      throw new IllegalArgumentException("Limit cannot be negative");
    }

    return jpaRepository.findRandomByLanguage(language, limit).stream()
        .map(studyBookMapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public List<StudyBook> findSystemProblemsByLanguage(String language) {
    if (language == null) {
      throw new IllegalArgumentException("Language cannot be null");
    }

    return jpaRepository.findByIsSystemProblemTrueAndLanguage(language).stream()
        .map(studyBookMapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<StudyBook> findById(StudyBookId studyBookId) {
    if (studyBookId == null) {
      throw new IllegalArgumentException("StudyBookId cannot be null");
    }

    return jpaRepository.findById(studyBookId.getValue()).map(studyBookMapper::toDomain);
  }

  @Override
  public StudyBook save(StudyBook studyBook) {
    if (studyBook == null) {
      throw new IllegalArgumentException("StudyBook cannot be null");
    }

    StudyBookEntity entity;
    if (studyBook.getId().getValue() == null) {
      // New study book - create new entity
      entity = studyBookMapper.toNewEntity(studyBook);
      entity = jpaRepository.save(entity);

      // Create a new StudyBook with the generated ID
      StudyBookId newStudyBookId = new StudyBookId(entity.getId());
      return StudyBook.reconstruct(
          newStudyBookId,
          studyBook.getUserId(),
          studyBook.getLanguage(),
          studyBook.getQuestion(),
          studyBook.getExplanation(),
          studyBook.isSystemProblem(),
          entity.getCreatedAt(),
          entity.getUpdatedAt());
    } else {
      // Existing study book - update existing entity
      Optional<StudyBookEntity> existingEntity =
          jpaRepository.findById(studyBook.getId().getValue());
      if (existingEntity.isPresent()) {
        entity = existingEntity.get();
        studyBookMapper.updateEntity(entity, studyBook);
        entity = jpaRepository.save(entity);
      } else {
        // Entity doesn't exist, create new one with the provided ID
        entity = studyBookMapper.toEntity(studyBook);
        entity = jpaRepository.save(entity);
      }
    }

    return studyBookMapper.toDomain(entity);
  }

  @Override
  public void deleteById(StudyBookId studyBookId) {
    if (studyBookId == null) {
      throw new IllegalArgumentException("StudyBookId cannot be null");
    }

    jpaRepository.deleteById(studyBookId.getValue());
  }

  @Override
  @Transactional(readOnly = true)
  public List<String> findAllLanguages() {
    return jpaRepository.findDistinctLanguages();
  }

  @Override
  @Transactional(readOnly = true)
  public List<String> findSystemProblemLanguages() {
    return jpaRepository.findDistinctSystemProblemLanguages();
  }

  @Override
  @Transactional(readOnly = true)
  public List<String> findUserProblemLanguages(UserId userId) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }

    return jpaRepository.findDistinctLanguagesByUserId(userId.getValue());
  }
}
