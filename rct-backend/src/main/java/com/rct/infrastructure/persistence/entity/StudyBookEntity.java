package com.rct.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * JPA entity for StudyBook persistence. This is separate from the domain StudyBook entity to
 * maintain clean architecture boundaries.
 */
@Entity
@Table(
    name = "study_books",
    indexes = {
      @Index(name = "idx_study_books_user_language", columnList = "user_id, language"),
      @Index(name = "idx_study_books_system_language", columnList = "is_system_problem, language")
    })
public class StudyBookEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id")
  private UUID userId; // null for system problems

  @Column(name = "language", nullable = false, length = 50)
  private String language;

  @Column(name = "question", nullable = false, columnDefinition = "TEXT")
  private String question;

  @Column(name = "explanation", columnDefinition = "TEXT")
  private String explanation;

  @Column(name = "is_system_problem", nullable = false)
  private Boolean isSystemProblem = false;

  @Column(name = "difficulty_level")
  private Integer difficultyLevel = 1;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Default constructor for JPA
  protected StudyBookEntity() {}

  // Constructor for creating new entities
  public StudyBookEntity(
      UUID userId,
      String language,
      String question,
      String explanation,
      Boolean isSystemProblem,
      Integer difficultyLevel) {
    this.userId = userId;
    this.language = language;
    this.question = question;
    this.explanation = explanation;
    this.isSystemProblem = isSystemProblem;
    this.difficultyLevel = difficultyLevel;
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

  public String getLanguage() {
    return language;
  }

  public void setLanguage(String language) {
    this.language = language;
  }

  public String getQuestion() {
    return question;
  }

  public void setQuestion(String question) {
    this.question = question;
  }

  public String getExplanation() {
    return explanation;
  }

  public void setExplanation(String explanation) {
    this.explanation = explanation;
  }

  public Boolean getIsSystemProblem() {
    return isSystemProblem;
  }

  public void setIsSystemProblem(Boolean isSystemProblem) {
    this.isSystemProblem = isSystemProblem;
  }

  public Integer getDifficultyLevel() {
    return difficultyLevel;
  }

  public void setDifficultyLevel(Integer difficultyLevel) {
    this.difficultyLevel = difficultyLevel;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
