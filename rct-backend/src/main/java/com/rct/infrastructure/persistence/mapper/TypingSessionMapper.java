package com.rct.infrastructure.persistence.mapper;

import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.typingsession.*;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.persistence.entity.TypingSessionEntity;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

/**
 * Mapper class for converting between TypingSession domain entity and TypingSessionEntity JPA
 * entity. This maintains the separation between domain and infrastructure layers.
 */
@Component
public class TypingSessionMapper {

  /**
   * Converts a domain TypingSession to a JPA TypingSessionEntity.
   *
   * @param typingSession the domain typing session
   * @return the corresponding JPA entity
   */
  public TypingSessionEntity toEntity(TypingSession typingSession) {
    if (typingSession == null) {
      return null;
    }

    TypingSessionEntity entity = new TypingSessionEntity(typingSession.getId().getValue());
    entity.setUserId(typingSession.getUserId().getValue());
    entity.setStudyBookId(typingSession.getStudyBookId().getValue());
    entity.setStartedAt(typingSession.getStartedAt());
    entity.setCompletedAt(typingSession.getCompletedAt());
    entity.setCreatedAt(typingSession.getCreatedAt());

    if (typingSession.isCompleted()) {
      TypingResult result = typingSession.getResult();
      entity.setDurationMs(result.getDuration().getMilliseconds());
      entity.setTotalCharacters(result.getTotalCharacters());
      entity.setCorrectCharacters(result.getCorrectCharacters());
      entity.setAccuracy(result.getAccuracy());
    }

    return entity;
  }

  /**
   * Converts a JPA TypingSessionEntity to a domain TypingSession.
   *
   * @param entity the JPA entity
   * @return the corresponding domain typing session
   */
  public TypingSession toDomain(TypingSessionEntity entity) {
    if (entity == null) {
      return null;
    }

    TypingSessionId sessionId = TypingSessionId.of(entity.getId());
    UserId userId = UserId.of(entity.getUserId());
    StudyBookId studyBookId = StudyBookId.of(entity.getStudyBookId());

    TypingResult result = null;
    if (entity.getCompletedAt() != null
        && entity.getDurationMs() != null
        && entity.getTotalCharacters() != null
        && entity.getCorrectCharacters() != null
        && entity.getAccuracy() != null) {

      Duration duration = Duration.of(entity.getDurationMs());
      result = TypingResult.create(
              entity.getTotalCharacters(),
              entity.getCorrectCharacters(),
              duration);
    }

    return TypingSession.reconstruct(
        sessionId,
        userId,
        studyBookId,
        entity.getStartedAt(),
        result,
        entity.getCompletedAt(),
        entity.getCreatedAt());
  }

  /**
   * Creates a new TypingSessionEntity for a new domain TypingSession (without ID).
   *
   * @param typingSession the domain typing session
   * @return the corresponding JPA entity without ID set
   */
  public TypingSessionEntity toNewEntity(TypingSession typingSession) {
    if (typingSession == null) {
      return null;
    }

    Long durationMs = null;
    Integer totalCharacters = null;
    Integer correctCharacters = null;
    BigDecimal accuracy = null;

    if (typingSession.isCompleted()) {
      TypingResult result = typingSession.getResult();
      durationMs = result.getDuration().getMilliseconds();
      totalCharacters = result.getTotalCharacters();
      correctCharacters = result.getCorrectCharacters();
      accuracy = result.getAccuracy();
    }

    return new TypingSessionEntity(
        typingSession.getUserId().getValue(),
        typingSession.getStudyBookId().getValue(),
        typingSession.getStartedAt(),
        typingSession.getCompletedAt(),
        durationMs,
        totalCharacters,
        correctCharacters,
        accuracy);
  }

  /**
   * Updates an existing TypingSessionEntity with data from a domain TypingSession.
   *
   * @param entity the existing JPA entity
   * @param typingSession the domain typing session with updated data
   */
  public void updateEntity(TypingSessionEntity entity, TypingSession typingSession) {
    if (entity == null || typingSession == null) {
      return;
    }

    entity.setUserId(typingSession.getUserId().getValue());
    entity.setStudyBookId(typingSession.getStudyBookId().getValue());
    entity.setStartedAt(typingSession.getStartedAt());
    entity.setCompletedAt(typingSession.getCompletedAt());

    if (typingSession.isCompleted()) {
      TypingResult result = typingSession.getResult();
      entity.setDurationMs(result.getDuration().getMilliseconds());
      entity.setTotalCharacters(result.getTotalCharacters());
      entity.setCorrectCharacters(result.getCorrectCharacters());
      entity.setAccuracy(result.getAccuracy());
    }
  }
}