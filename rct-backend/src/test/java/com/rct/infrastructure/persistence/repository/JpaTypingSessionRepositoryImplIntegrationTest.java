package com.rct.infrastructure.persistence.repository;

import static org.assertj.core.api.Assertions.*;

import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.typingsession.*;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.persistence.BaseRepositoryIntegrationTest;
import com.rct.infrastructure.persistence.mapper.TypingSessionMapper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

/**
 * Integration tests for JpaTypingSessionRepositoryImpl using TestContainers with PostgreSQL. These
 * tests verify the repository implementation against a real database.
 */
@Import({JpaTypingSessionRepositoryImpl.class, TypingSessionMapper.class})
@DisplayName("JpaTypingSessionRepositoryImpl Integration Tests")
class JpaTypingSessionRepositoryImplIntegrationTest extends BaseRepositoryIntegrationTest {

  @Autowired private TestEntityManager entityManager;

  @Autowired private JpaTypingSessionEntityRepository jpaTypingSessionEntityRepository;

  @Autowired private JpaTypingSessionRepositoryImpl typingSessionRepository;

  private UserId testUserId;
  private StudyBookId testStudyBookId;
  private TypingSession testTypingSession;

  @BeforeEach
  void setUpTestData() {
    testUserId = new UserId(UUID.randomUUID());
    testStudyBookId = new StudyBookId(UUID.randomUUID());
    testTypingSession =
        TypingSession.start(new TypingSessionId(UUID.randomUUID()), testUserId, testStudyBookId);
  }

  @Test
  @DisplayName("Should save new typing session and generate ID")
  void shouldSaveNewTypingSessionAndGenerateId() {
    // Given
    TypingSession newSession =
        TypingSession.start(new TypingSessionId(null), testUserId, testStudyBookId);

    // When
    TypingSession savedSession = typingSessionRepository.save(newSession);

    // Then
    assertThat(savedSession).isNotNull();
    assertThat(savedSession.getId().getValue()).isNotNull();
    assertThat(savedSession.getUserId()).isEqualTo(testUserId);
    assertThat(savedSession.getStudyBookId()).isEqualTo(testStudyBookId);
    assertThat(savedSession.getStartedAt()).isNotNull();
    assertThat(savedSession.isCompleted()).isFalse();

    // Verify in database
    entityManager.flush();
    entityManager.clear();

    Optional<TypingSession> foundSession = typingSessionRepository.findById(savedSession.getId());
    assertThat(foundSession).isPresent();
    assertThat(foundSession.get().getUserId()).isEqualTo(testUserId);
  }

  @Test
  @DisplayName("Should find typing sessions by user ID")
  void shouldFindTypingSessionsByUserId() {
    // Given
    TypingSession savedSession = typingSessionRepository.save(testTypingSession);
    entityManager.flush();
    entityManager.clear();

    // When
    List<TypingSession> userSessions = typingSessionRepository.findByUserId(testUserId);

    // Then
    assertThat(userSessions).hasSize(1);
    assertThat(userSessions.get(0).getId()).isEqualTo(savedSession.getId());
    assertThat(userSessions.get(0).belongsToUser(testUserId)).isTrue();
  }

  @Test
  @DisplayName("Should complete typing session with result")
  void shouldCompleteTypingSessionWithResult() {
    // Given
    TypingSession savedSession = typingSessionRepository.save(testTypingSession);
    entityManager.flush();
    entityManager.clear();

    // Complete the session
    Duration duration = new Duration(5000L); // 5 seconds
    TypingResult result = new TypingResult(100, 95, 95.0, duration);
    savedSession.completeWithResult(result);

    // When
    TypingSession updatedSession = typingSessionRepository.save(savedSession);

    // Then
    assertThat(updatedSession.isCompleted()).isTrue();
    assertThat(updatedSession.getResult().getAccuracy()).isEqualTo(95.0);
    assertThat(updatedSession.getResult().getTotalCharacters()).isEqualTo(100);
    assertThat(updatedSession.getResult().getCorrectCharacters()).isEqualTo(95);

    // Verify in database
    entityManager.flush();
    entityManager.clear();

    Optional<TypingSession> foundSession = typingSessionRepository.findById(savedSession.getId());
    assertThat(foundSession).isPresent();
    assertThat(foundSession.get().isCompleted()).isTrue();
    assertThat(foundSession.get().getResult().getAccuracy()).isEqualTo(95.0);
  }

  @Test
  @DisplayName("Should calculate average accuracy for user")
  void shouldCalculateAverageAccuracyForUser() {
    // Given
    // Create and save multiple completed sessions
    for (int i = 0; i < 3; i++) {
      TypingSession session =
          TypingSession.start(new TypingSessionId(UUID.randomUUID()), testUserId, testStudyBookId);
      Duration duration = new Duration(5000L);
      TypingResult result = new TypingResult(100, 80 + i * 5, 80.0 + i * 5, duration);
      session.completeWithResult(result);
      typingSessionRepository.save(session);
    }
    entityManager.flush();

    // When
    double averageAccuracy = typingSessionRepository.calculateAverageAccuracy(testUserId);

    // Then
    assertThat(averageAccuracy).isEqualTo(85.0); // (80 + 85 + 90) / 3 = 85
  }

  @Test
  @DisplayName("Should count typing sessions by user ID")
  void shouldCountTypingSessionsByUserId() {
    // Given
    typingSessionRepository.save(testTypingSession);
    TypingSession anotherSession =
        TypingSession.start(new TypingSessionId(UUID.randomUUID()), testUserId, testStudyBookId);
    typingSessionRepository.save(anotherSession);
    entityManager.flush();

    // When
    long count = typingSessionRepository.countByUserId(testUserId);

    // Then
    assertThat(count).isEqualTo(2);
  }

  @Test
  @DisplayName("Should find recent typing sessions with limit")
  void shouldFindRecentTypingSessionsWithLimit() {
    // Given
    // Create multiple sessions with different start times
    for (int i = 0; i < 5; i++) {
      TypingSession session =
          TypingSession.start(new TypingSessionId(UUID.randomUUID()), testUserId, testStudyBookId);
      typingSessionRepository.save(session);
    }
    entityManager.flush();
    entityManager.clear();

    // When
    List<TypingSession> recentSessions = typingSessionRepository.findRecentByUserId(testUserId, 3);

    // Then
    assertThat(recentSessions).hasSize(3);
    assertThat(recentSessions).allMatch(session -> session.belongsToUser(testUserId));
  }

  @Test
  @DisplayName("Should delete typing session by ID")
  void shouldDeleteTypingSessionById() {
    // Given
    TypingSession savedSession = typingSessionRepository.save(testTypingSession);
    entityManager.flush();

    assertThat(typingSessionRepository.findById(savedSession.getId())).isPresent();

    // When
    boolean deleted = typingSessionRepository.deleteById(savedSession.getId());

    // Then
    assertThat(deleted).isTrue();
    entityManager.flush();
    assertThat(typingSessionRepository.findById(savedSession.getId())).isEmpty();
  }

  @Test
  @DisplayName("Should throw exception when saving null typing session")
  void shouldThrowExceptionWhenSavingNullTypingSession() {
    // When & Then
    assertThatThrownBy(() -> typingSessionRepository.save(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("TypingSession cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when finding by null user ID")
  void shouldThrowExceptionWhenFindingByNullUserId() {
    // When & Then
    assertThatThrownBy(() -> typingSessionRepository.findByUserId(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("UserId cannot be null");
  }
}
