package com.rct.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "typing_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingLog {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private LoginInfo user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "study_book_id", nullable = false)
  private StudyBook studyBook;

  @Column(name = "started_at", nullable = false)
  private LocalDateTime startedAt;

  @Column(name = "duration_ms", nullable = false)
  private Long durationMs;

  @Column(name = "total_chars", nullable = false)
  private Integer totalChars;

  @Column(name = "correct_chars", nullable = false)
  private Integer correctChars;

  @Column(name = "accuracy", nullable = false, precision = 5, scale = 2)
  private BigDecimal accuracy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
}
