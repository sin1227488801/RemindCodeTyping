package com.rct.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * JPA entity for User persistence. This is separate from the domain User entity to maintain clean
 * architecture boundaries.
 */
@Entity
@Table(name = "users")
public class UserEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "login_id", unique = true, nullable = false, length = 50)
  private String loginId;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "role", nullable = false, length = 20)
  private String role = "USER";

  @Column(name = "last_login_date")
  private LocalDate lastLoginDate;

  @Column(name = "consecutive_login_days", nullable = false)
  private Integer consecutiveLoginDays = 0;

  @Column(name = "max_consecutive_login_days", nullable = false)
  private Integer maxConsecutiveLoginDays = 0;

  @Column(name = "total_login_days", nullable = false)
  private Integer totalLoginDays = 0;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Default constructor for JPA
  protected UserEntity() {}

  // Constructor for creating new entities
  public UserEntity(
      String loginId,
      String passwordHash,
      String role,
      LocalDate lastLoginDate,
      Integer consecutiveLoginDays,
      Integer maxConsecutiveLoginDays,
      Integer totalLoginDays) {
    this.loginId = loginId;
    this.passwordHash = passwordHash;
    this.role = role;
    this.lastLoginDate = lastLoginDate;
    this.consecutiveLoginDays = consecutiveLoginDays;
    this.maxConsecutiveLoginDays = maxConsecutiveLoginDays;
    this.totalLoginDays = totalLoginDays;
  }

  // Getters and setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getLoginId() {
    return loginId;
  }

  public void setLoginId(String loginId) {
    this.loginId = loginId;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public String getRole() {
    return role;
  }

  public void setRole(String role) {
    this.role = role;
  }

  public LocalDate getLastLoginDate() {
    return lastLoginDate;
  }

  public void setLastLoginDate(LocalDate lastLoginDate) {
    this.lastLoginDate = lastLoginDate;
  }

  public Integer getConsecutiveLoginDays() {
    return consecutiveLoginDays;
  }

  public void setConsecutiveLoginDays(Integer consecutiveLoginDays) {
    this.consecutiveLoginDays = consecutiveLoginDays;
  }

  public Integer getMaxConsecutiveLoginDays() {
    return maxConsecutiveLoginDays;
  }

  public void setMaxConsecutiveLoginDays(Integer maxConsecutiveLoginDays) {
    this.maxConsecutiveLoginDays = maxConsecutiveLoginDays;
  }

  public Integer getTotalLoginDays() {
    return totalLoginDays;
  }

  public void setTotalLoginDays(Integer totalLoginDays) {
    this.totalLoginDays = totalLoginDays;
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
