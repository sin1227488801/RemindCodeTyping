package com.rct.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

/**
 * JPA entity for TypingSession persistence. This is separate from the domain TypingSession entity
 * to maintain clean architecture boundaries.
 */
@Entity
@Table(
    name = "typing_sessions",
    indexes = {
      @Index(name = "idx_typing_sessions_user_date", columnList = "user_id, started_at"),
      @Index(name = "idx_typing_sessions_accuracy", columnList = "accuracy")
    })
public class TypingSessionEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "study_book_id", nullable = false)
  private UUID studyBookId;

  @Column(name = "started_at", nullable = false)
  private LocalDateTime startedAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  @Column(name = "duration_ms")
  private Long durationMs;

  @Column(name = "total_characters")
  private Integer totalCharacters;

  @Column(name = "correct_characters")
  private Integer correctCharacters;

  @Column(name = "accuracy", precision = 5, scale = 2)
  private BigDecimal accuracy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  // Default constructor for JPA
  protected TypingSessionEntity() {}

  // Public default constructor for mappers
  public TypingSessionEntity(UUID id) {
    this.id = id;
  }

  // Constructor for creating new entities
  public TypingSessionEntity(
      UUID userId,
      UUID studyBookId,
      LocalDateTime startedAt,
      LocalDateTime completedAt,
      Long durationMs,
      Integer totalCharacters,
      Integer correctCharacters,
      BigDecimal accuracy) {
    this.userId = userId;
    this.studyBookId = studyBookId;
    this.startedAt = startedAt;
    this.completedAt = completedAt;
    this.durationMs = durationMs;
    this.totalCharacters = totalCharacters;
    this.correctCharacters = correctCharacters;
    this.accuracy = accuracy;
  }

  // Getters and setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public UUID getStudyBookId() {
    return studyBookId;
  }

  public void setStudyBookId(UUID studyBookId) {
    this.studyBookId = studyBookId;
  }

  public LocalDateTime getStartedAt() {
    return startedAt;
  }

  public void setStartedAt(LocalDateTime startedAt) {
    this.startedAt = startedAt;
  }

  public LocalDateTime getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(LocalDateTime completedAt) {
    this.completedAt = completedAt;
  }

  public Long getDurationMs() {
    return durationMs;
  }

  public void setDurationMs(Long durationMs) {
    this.durationMs = durationMs;
  }

  public Integer getTotalCharacters() {
    return totalCharacters;
  }

  public void setTotalCharacters(Integer totalCharacters) {
    this.totalCharacters = totalCharacters;
  }

  public Integer getCorrectCharacters() {
    return correctCharacters;
  }

  public void setCorrectCharacters(Integer correctCharacters) {
    this.correctCharacters = correctCharacters;
  }

  public BigDecimal getAccuracy() {
    return accuracy;
  }

  public void setAccuracy(BigDecimal accuracy) {
    this.accuracy = accuracy;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
