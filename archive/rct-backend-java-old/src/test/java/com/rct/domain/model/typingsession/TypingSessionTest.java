package com.rct.domain.model.typingsession;

import static org.assertj.core.api.Assertions.*;

import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.user.UserId;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class TypingSessionTest {

  private final TypingSessionId sessionId = TypingSessionId.generate();
  private final UserId userId = UserId.generate();
  private final StudyBookId studyBookId = StudyBookId.generate();

  @Test
  void shouldCreateNewTypingSession() {
    // When
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // Then
    assertThat(session.getId()).isEqualTo(sessionId);
    assertThat(session.getUserId()).isEqualTo(userId);
    assertThat(session.getStudyBookId()).isEqualTo(studyBookId);
    assertThat(session.getStartedAt()).isNotNull();
    assertThat(session.getCreatedAt()).isNotNull();
    assertThat(session.isCompleted()).isFalse();
    assertThat(session.getCompletedAt()).isNull();
  }

  @Test
  void shouldReconstructTypingSessionFromPersistence() {
    // Given
    LocalDateTime startedAt = LocalDateTime.now().minusMinutes(5);
    LocalDateTime completedAt = LocalDateTime.now().minusMinutes(2);
    LocalDateTime createdAt = LocalDateTime.now().minusMinutes(10);
    TypingResult result = TypingResult.create(100, 85, Duration.ofSeconds(180));

    // When
    TypingSession session =
        TypingSession.reconstruct(
            sessionId, userId, studyBookId, startedAt, result, completedAt, createdAt);

    // Then
    assertThat(session.getId()).isEqualTo(sessionId);
    assertThat(session.getUserId()).isEqualTo(userId);
    assertThat(session.getStudyBookId()).isEqualTo(studyBookId);
    assertThat(session.getStartedAt()).isEqualTo(startedAt);
    assertThat(session.getCompletedAt()).isEqualTo(completedAt);
    assertThat(session.getCreatedAt()).isEqualTo(createdAt);
    assertThat(session.isCompleted()).isTrue();
  }

  @Test
  void shouldCompleteSessionWithTextComparison() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);
    String typedText = "Hello World";
    String targetText = "Hello World";

    // When
    session.complete(typedText, targetText);

    // Then
    assertThat(session.isCompleted()).isTrue();
    assertThat(session.getCompletedAt()).isNotNull();
    assertThat(session.getResult()).isNotNull();
    assertThat(session.getResult().getTotalCharacters()).isEqualTo(11);
    assertThat(session.getResult().getCorrectCharacters()).isEqualTo(11);
  }

  @Test
  void shouldCompleteSessionWithPreCalculatedResult() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);
    TypingResult result = TypingResult.create(100, 85, Duration.ofSeconds(60));

    // When
    session.completeWithResult(result);

    // Then
    assertThat(session.isCompleted()).isTrue();
    assertThat(session.getCompletedAt()).isNotNull();
    assertThat(session.getResult()).isEqualTo(result);
  }

  @Test
  void shouldThrowExceptionWhenCompletingAlreadyCompletedSession() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);
    session.complete("Hello", "Hello");

    // When & Then
    assertThatThrownBy(() -> session.complete("World", "World"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Typing session is already completed");
  }

  @Test
  void shouldThrowExceptionWhenCompletingWithResultAlreadyCompletedSession() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);
    TypingResult result1 = TypingResult.create(100, 85, Duration.ofSeconds(60));
    TypingResult result2 = TypingResult.create(50, 40, Duration.ofSeconds(30));
    session.completeWithResult(result1);

    // When & Then
    assertThatThrownBy(() -> session.completeWithResult(result2))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Typing session is already completed");
  }

  @Test
  void shouldThrowExceptionWhenGettingResultFromIncompleteSession() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When & Then
    assertThatThrownBy(() -> session.getResult())
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Cannot get result from incomplete session");
  }

  @Test
  void shouldReturnTrueWhenSessionBelongsToUser() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When & Then
    assertThat(session.belongsToUser(userId)).isTrue();
    assertThat(session.belongsToUser(UserId.generate())).isFalse();
  }

  @Test
  void shouldReturnTrueWhenSessionIsForStudyBook() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When & Then
    assertThat(session.isForStudyBook(studyBookId)).isTrue();
    assertThat(session.isForStudyBook(StudyBookId.generate())).isFalse();
  }

  @Test
  void shouldCalculateCurrentDurationForIncompleteSession() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When
    Duration currentDuration = session.getCurrentDuration();

    // Then
    assertThat(currentDuration.getMilliseconds()).isGreaterThan(0);
    assertThat(currentDuration.getMilliseconds()).isLessThan(1000); // Should be very recent
  }

  @Test
  void shouldReturnSessionDurationForCompletedSession() {
    // Given
    LocalDateTime startedAt = LocalDateTime.now().minusMinutes(5);
    LocalDateTime completedAt = LocalDateTime.now().minusMinutes(2);
    LocalDateTime createdAt = LocalDateTime.now().minusMinutes(10);
    TypingResult result = TypingResult.create(100, 85, Duration.ofSeconds(180));

    TypingSession session =
        TypingSession.reconstruct(
            sessionId, userId, studyBookId, startedAt, result, completedAt, createdAt);

    // When
    Duration currentDuration = session.getCurrentDuration();

    // Then
    assertThat(currentDuration.getMilliseconds()).isEqualTo(180000); // 3 minutes
  }

  @Test
  void shouldReturnFalseForAbandonedWhenCompleted() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);
    session.complete("Hello", "Hello");

    // When & Then
    assertThat(session.isAbandoned()).isFalse();
  }

  @Test
  void shouldReturnFalseForAbandonedWhenRecentSession() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When & Then
    assertThat(session.isAbandoned()).isFalse();
  }

  @Test
  void shouldThrowExceptionForNullSessionId() {
    // When & Then
    assertThatThrownBy(() -> TypingSession.start(null, userId, studyBookId))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("TypingSession ID cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullUserId() {
    // When & Then
    assertThatThrownBy(() -> TypingSession.start(sessionId, null, studyBookId))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("User ID cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullStudyBookId() {
    // When & Then
    assertThatThrownBy(() -> TypingSession.start(sessionId, userId, null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("StudyBook ID cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullTypedText() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When & Then
    assertThatThrownBy(() -> session.complete(null, "target"))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Typed text cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullTargetText() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When & Then
    assertThatThrownBy(() -> session.complete("typed", null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Target text cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullResult() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When & Then
    assertThatThrownBy(() -> session.completeWithResult(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Typing result cannot be null");
  }

  @Test
  void shouldBeEqualWhenSameId() {
    // Given
    TypingSession session1 = TypingSession.start(sessionId, userId, studyBookId);
    TypingSession session2 =
        TypingSession.start(sessionId, UserId.generate(), StudyBookId.generate());

    // When & Then
    assertThat(session1).isEqualTo(session2);
    assertThat(session1.hashCode()).isEqualTo(session2.hashCode());
  }

  @Test
  void shouldNotBeEqualWhenDifferentId() {
    // Given
    TypingSession session1 = TypingSession.start(sessionId, userId, studyBookId);
    TypingSession session2 = TypingSession.start(TypingSessionId.generate(), userId, studyBookId);

    // When & Then
    assertThat(session1).isNotEqualTo(session2);
  }

  @Test
  void shouldHaveDescriptiveToString() {
    // Given
    TypingSession session = TypingSession.start(sessionId, userId, studyBookId);

    // When
    String result = session.toString();

    // Then
    assertThat(result).contains("TypingSession");
    assertThat(result).contains(sessionId.toString());
    assertThat(result).contains(userId.toString());
    assertThat(result).contains(studyBookId.toString());
    assertThat(result).contains("completed=false");
  }
}
