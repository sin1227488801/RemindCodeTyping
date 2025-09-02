package com.rct.domain.model.user;

import java.util.Objects;
import java.util.UUID;

/**
 * Value object representing a unique user identifier. Ensures type safety and prevents primitive
 * obsession.
 */
public final class UserId {
  private final UUID value;

  private UserId(UUID value) {
    this.value = Objects.requireNonNull(value, "UserId cannot be null");
  }

  public static UserId of(UUID value) {
    return new UserId(value);
  }

  public static UserId generate() {
    return new UserId(UUID.randomUUID());
  }

  public static UserId fromString(String value) {
    Objects.requireNonNull(value, "UserId string cannot be null");
    try {
      return new UserId(UUID.fromString(value));
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid UserId format: " + value, e);
    }
  }

  public UUID getValue() {
    return value;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    UserId userId = (UserId) obj;
    return Objects.equals(value, userId.value);
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
