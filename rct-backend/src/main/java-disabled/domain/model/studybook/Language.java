package com.rct.domain.model.studybook;

import java.util.Objects;

/**
 * Value object representing a programming language. Ensures type safety and prevents primitive
 * obsession.
 */
public final class Language {
  private final String value;

  public Language(String value) {
    if (value == null || value.trim().isEmpty()) {
      throw new IllegalArgumentException("Language name cannot be null or empty");
    }
    this.value = value;
    validate();
  }

  /** Creates a Language from a string value. */
  public static Language of(String value) {
    return new Language(value);
  }

  /** Validates the language value. */
  public void validate() {
    if (value.trim().isEmpty()) {
      throw new IllegalArgumentException("Language cannot be empty");
    }
    if (value.length() > 50) {
      throw new IllegalArgumentException("Language cannot exceed 50 characters");
    }
  }

  public String getValue() {
    return value;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    Language language = (Language) obj;
    return Objects.equals(value, language.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(value);
  }

  @Override
  public String toString() {
    return value;
  }
}
