package com.rct.domain.model.typingsession;

import java.util.Objects;
import java.util.UUID;

/**
 * Value object representing a unique typing session identifier. Ensures type safety and prevents
 * primitive obsession.
 */
public final class TypingSessionId {
  private final UUID value;

  private TypingSessionId(UUID value) {
    this.value = Objects.requireNonNull(value, "TypingSessionId cannot be null");
  }

  public static TypingSessionId of(UUID value) {
    return new TypingSessionId(value);
  }

  public static TypingSessionId generate() {
    return new TypingSessionId(UUID.randomUUID());
  }

  public static TypingSessionId fromString(String value) {
    Objects.requireNonNull(value, "TypingSessionId string cannot be null");
    try {
      return new TypingSessionId(UUID.fromString(value));
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid TypingSessionId format: " + value, e);
    }
  }

  public UUID getValue() {
    return value;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    TypingSessionId that = (TypingSessionId) obj;
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
