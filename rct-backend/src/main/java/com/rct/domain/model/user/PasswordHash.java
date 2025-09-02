package com.rct.domain.model.user;

import java.util.Objects;

/**
 * Value object representing a hashed password. Encapsulates password hash validation and ensures
 * type safety.
 */
public final class PasswordHash {
  private final String value;

  private PasswordHash(String value) {
    this.value = validate(value);
  }

  public static PasswordHash of(String hashedPassword) {
    return new PasswordHash(hashedPassword);
  }

  private String validate(String value) {
    Objects.requireNonNull(value, "Password hash cannot be null");

    String trimmed = value.trim();
    if (trimmed.isEmpty()) {
      throw new IllegalArgumentException("Password hash cannot be empty");
    }

    // Basic validation for BCrypt hash format (starts with $2a$, $2b$, $2x$, or $2y$)
    if (!trimmed.matches("^\\$2[abxy]\\$\\d{2}\\$.{53}$")) {
      throw new IllegalArgumentException("Invalid password hash format");
    }

    return trimmed;
  }

  public String getValue() {
    return value;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    PasswordHash that = (PasswordHash) obj;
    return Objects.equals(value, that.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(value);
  }

  @Override
  public String toString() {
    return "[PROTECTED]"; // Never expose the actual hash
  }
}
