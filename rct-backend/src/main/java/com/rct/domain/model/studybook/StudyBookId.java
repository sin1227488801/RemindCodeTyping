package com.rct.domain.model.studybook;

import java.util.Objects;
import java.util.UUID;

/**
 * Value object representing a unique identifier for a StudyBook. Provides type safety and prevents
 * primitive obsession.
 */
public final class StudyBookId implements Comparable<StudyBookId> {
  private final UUID value;

  public StudyBookId(UUID value) {
    this.value = Objects.requireNonNull(value, "StudyBook ID cannot be null");
  }

  /** Generates a new unique StudyBookId. */
  public static StudyBookId generate() {
    return new StudyBookId(UUID.randomUUID());
  }

  /** Creates a StudyBookId from a string representation. */
  public static StudyBookId fromString(String uuidString) {
    if (uuidString == null || uuidString.trim().isEmpty()) {
      throw new IllegalArgumentException("UUID string cannot be null");
    }
    try {
      return new StudyBookId(UUID.fromString(uuidString));
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid UUID string: " + uuidString, e);
    }
  }

  /** Returns the UUID value. */
  public UUID getValue() {
    return value;
  }

  /** Returns the string representation of the UUID. */
  public String asString() {
    return value.toString();
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    StudyBookId that = (StudyBookId) obj;
    return Objects.equals(value, that.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(value);
  }

  @Override
  public String toString() {
    return String.format("StudyBookId{value=%s}", value);
  }

  @Override
  public int compareTo(StudyBookId other) {
    return this.value.compareTo(other.value);
  }
}
