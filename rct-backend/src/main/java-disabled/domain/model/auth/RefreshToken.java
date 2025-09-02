package com.rct.domain.model.auth;

import com.rct.domain.model.user.UserId;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Domain entity representing a refresh token for JWT authentication. Manages token lifecycle and
 * validation.
 */
public class RefreshToken {

  private final RefreshTokenId id;
  private final UserId userId;
  private final String token;
  private final LocalDateTime expiresAt;
  private final LocalDateTime createdAt;
  private boolean revoked;

  private RefreshToken(
      RefreshTokenId id,
      UserId userId,
      String token,
      LocalDateTime expiresAt,
      LocalDateTime createdAt,
      boolean revoked) {
    this.id = Objects.requireNonNull(id, "Refresh token ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.token = Objects.requireNonNull(token, "Token cannot be null");
    this.expiresAt = Objects.requireNonNull(expiresAt, "Expires at cannot be null");
    this.createdAt = Objects.requireNonNull(createdAt, "Created at cannot be null");
    this.revoked = revoked;

    if (token.trim().isEmpty()) {
      throw new IllegalArgumentException("Token cannot be empty");
    }
  }

  public static RefreshToken create(UserId userId, String token, LocalDateTime expiresAt) {
    RefreshTokenId id = RefreshTokenId.generate();
    LocalDateTime now = LocalDateTime.now();
    return new RefreshToken(id, userId, token, expiresAt, now, false);
  }

  public static RefreshToken reconstruct(
      RefreshTokenId id,
      UserId userId,
      String token,
      LocalDateTime expiresAt,
      LocalDateTime createdAt,
      boolean revoked) {
    return new RefreshToken(id, userId, token, expiresAt, createdAt, revoked);
  }

  public boolean isValid() {
    return !revoked && !isExpired();
  }

  public boolean isExpired() {
    return LocalDateTime.now().isAfter(expiresAt);
  }

  public void revoke() {
    this.revoked = true;
  }

  public boolean belongsToUser(UserId userId) {
    return this.userId.equals(userId);
  }

  // Getters
  public RefreshTokenId getId() {
    return id;
  }

  public UserId getUserId() {
    return userId;
  }

  public String getToken() {
    return token;
  }

  public LocalDateTime getExpiresAt() {
    return expiresAt;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public boolean isRevoked() {
    return revoked;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    RefreshToken that = (RefreshToken) obj;
    return Objects.equals(id, that.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }

  @Override
  public String toString() {
    return "RefreshToken{"
        + "id="
        + id
        + ", userId="
        + userId
        + ", expiresAt="
        + expiresAt
        + ", revoked="
        + revoked
        + '}';
  }
}
