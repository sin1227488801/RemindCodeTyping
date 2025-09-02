package com.rct.domain.model.user;

import java.util.Objects;

/** Value object representing a user's login identifier. Enforces validation rules for login IDs. */
public final class LoginId {
  private static final int MIN_LENGTH = 3;
  private static final int MAX_LENGTH = 50;
  private static final String VALID_PATTERN = "^[a-zA-Z0-9_-]+$";

  private final String value;

  private LoginId(String value) {
    this.value = validate(value);
  }

  public static LoginId of(String value) {
    return new LoginId(value);
  }

  private String validate(String value) {
    Objects.requireNonNull(value, "LoginId cannot be null");

    String trimmed = value.trim();
    if (trimmed.isEmpty()) {
      throw new IllegalArgumentException("LoginId cannot be empty");
    }

    if (trimmed.length() < MIN_LENGTH) {
      throw new IllegalArgumentException(
          "LoginId must be at least " + MIN_LENGTH + " characters long");
    }

    if (trimmed.length() > MAX_LENGTH) {
      throw new IllegalArgumentException("LoginId cannot exceed " + MAX_LENGTH + " characters");
    }

    if (!trimmed.matches(VALID_PATTERN)) {
      throw new IllegalArgumentException(
          "LoginId can only contain letters, numbers, underscores, and hyphens");
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
    LoginId loginId = (LoginId) obj;
    return Objects.equals(value, loginId.value);
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
