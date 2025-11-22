package com.rct.infrastructure.persistence.repository;

import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.typingsession.*;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.persistence.entity.TypingSessionEntity;
import com.rct.infrastructure.persistence.mapper.TypingSessionMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * JPA implementation of the TypingSessionRepository domain interface. This class bridges the domain
 * layer with the persistence infrastructure while maintaining clean architecture boundaries.
 */
@Repository
@Transactional
public class JpaTypingSessionRepositoryImpl implements TypingSessionRepository {

  private final JpaTypingSessionEntityRepository jpaRepository;
  private final TypingSessionMapper typingSessionMapper;

  public JpaTypingSessionRepositoryImpl(
      JpaTypingSessionEntityRepository jpaRepository, TypingSessionMapper typingSessionMapper) {
    this.jpaRepository = jpaRepository;
    this.typingSessionMapper = typingSessionMapper;
  }

  @Override
  public TypingSession save(TypingSession session) {
    if (session == null) {
      throw new IllegalArgumentException("TypingSession cannot be null");
    }

    TypingSessionEntity entity;
    if (session.getId().getValue() == null) {
      // New typing session - create new entity
      entity = typingSessionMapper.toNewEntity(session);
      entity = jpaRepository.save(entity);

      // Create a new TypingSession with the generated ID
      TypingSessionId newSessionId = TypingSessionId.of(entity.getId());
      return TypingSession.reconstruct(
          newSessionId,
          session.getUserId(),
          session.getStudyBookId(),
          session.getStartedAt(),
          session.isCompleted() ? session.getResult() : null,
          session.getCompletedAt(),
          entity.getCreatedAt());
    } else {
      // Existing typing session - update existing entity
      Optional<TypingSessionEntity> existingEntity =
          jpaRepository.findById(session.getId().getValue());
      if (existingEntity.isPresent()) {
        entity = existingEntity.get();
        typingSessionMapper.updateEntity(entity, session);
        entity = jpaRepository.save(entity);
      } else {
        // Entity doesn't exist, create new one with the provided ID
        entity = typingSessionMapper.toEntity(session);
        entity = jpaRepository.save(entity);
      }
    }

    return typingSessionMapper.toDomain(entity);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<TypingSession> findById(TypingSessionId id) {
    if (id == null) {
      throw new IllegalArgumentException("TypingSessionId cannot be null");
    }

    return jpaRepository.findById(id.getValue()).map(typingSessionMapper::toDomain);
  }

  @Override
  @Transactional(readOnly = true)
  public List<TypingSession> findByUserId(UserId userId) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }

    return jpaRepository.findByUserIdOrderByStartedAtDesc(userId.getValue()).stream()
        .map(typingSessionMapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public List<TypingSession> findByUserIdAndDateRange(
      UserId userId, LocalDateTime startDate, LocalDateTime endDate) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }
    if (startDate == null) {
      throw new IllegalArgumentException("Start date cannot be null");
    }
    if (endDate == null) {
      throw new IllegalArgumentException("End date cannot be null");
    }
    if (startDate.isAfter(endDate)) {
      throw new IllegalArgumentException("Start date cannot be after end date");
    }

    return jpaRepository
        .findByUserIdAndStartedAtBetweenOrderByStartedAtDesc(userId.getValue(), startDate, endDate)
        .stream()
        .map(typingSessionMapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public List<TypingSession> findByStudyBookId(StudyBookId studyBookId) {
    if (studyBookId == null) {
      throw new IllegalArgumentException("StudyBookId cannot be null");
    }

    return jpaRepository.findByStudyBookId(studyBookId.getValue()).stream()
        .map(typingSessionMapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public List<TypingSession> findRecentByUserId(UserId userId, int limit) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }
    if (limit <= 0) {
      throw new IllegalArgumentException("Limit must be positive");
    }

    return jpaRepository
        .findByUserIdOrderByStartedAtDesc(userId.getValue(), PageRequest.of(0, limit))
        .stream()
        .map(typingSessionMapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public double calculateAverageAccuracy(UserId userId) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }

    BigDecimal average = jpaRepository.findAverageAccuracyByUserId(userId.getValue());
    return average != null ? average.doubleValue() : 0.0;
  }

  @Override
  @Transactional(readOnly = true)
  public long countByUserId(UserId userId) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }

    return jpaRepository.countByUserId(userId.getValue());
  }

  @Override
  public boolean deleteById(TypingSessionId id) {
    if (id == null) {
      throw new IllegalArgumentException("TypingSessionId cannot be null");
    }

    if (jpaRepository.existsById(id.getValue())) {
      jpaRepository.deleteById(id.getValue());
      return true;
    }
    return false;
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsById(TypingSessionId id) {
    if (id == null) {
      throw new IllegalArgumentException("TypingSessionId cannot be null");
    }

    return jpaRepository.existsById(id.getValue());
  }
}
