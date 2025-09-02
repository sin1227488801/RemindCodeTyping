package com.rct.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "login_info")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginInfo {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "login_id", unique = true, nullable = false, length = 50)
  private String loginId;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "last_login_date")
  private LocalDate lastLoginDate;

  @Column(name = "last_login_days", nullable = false)
  private Integer lastLoginDays = 0;

  @Column(name = "max_login_days", nullable = false)
  private Integer maxLoginDays = 0;

  @Column(name = "total_login_days", nullable = false)
  private Integer totalLoginDays = 0;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
