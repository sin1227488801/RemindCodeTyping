package com.rct.domain.model.auth;

import java.util.Objects;
import java.util.UUID;

/** Value object representing a refresh token identifier. */
public class RefreshTokenId {

  private final UUID value;

  private RefreshTokenId(UUID value) {
    this.value = Objects.requireNonNull(value, "Refresh token ID value cannot be null");
  }

  public static RefreshTokenId of(UUID value) {
    return new RefreshTokenId(value);
  }

  public static RefreshTokenId generate() {
    return new RefreshTokenId(UUID.randomUUID());
  }

  public static RefreshTokenId fromString(String value) {
    if (value == null || value.trim().isEmpty()) {
      throw new IllegalArgumentException("Refresh token ID string cannot be null or empty");
    }

    try {
      return new RefreshTokenId(UUID.fromString(value));
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid refresh token ID format: " + value);
    }
  }

  public UUID getValue() {
    return value;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    RefreshTokenId that = (RefreshTokenId) obj;
    return Objects.equals(value, that.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(value);
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
