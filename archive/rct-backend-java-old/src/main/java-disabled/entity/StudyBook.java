package com.rct.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "study_book")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyBook {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = true)
  private LoginInfo user;

  @Column(name = "language", nullable = false, length = 20)
  private String language;

  @Column(name = "question", nullable = false, columnDefinition = "TEXT")
  private String question;

  @Column(name = "explanation", columnDefinition = "TEXT")
  private String explanation;

  @Column(name = "is_system_problem", nullable = false)
  private Boolean isSystemProblem = false;

  @Column(name = "created_by", length = 50)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
