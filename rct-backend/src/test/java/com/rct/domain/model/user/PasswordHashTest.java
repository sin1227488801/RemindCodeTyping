package com.rct.domain.model.user;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PasswordHashTest {

  private static final String VALID_BCRYPT_HASH =
      "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

  @Test
  void shouldCreateValidPasswordHash() {
    // When
    PasswordHash passwordHash = PasswordHash.of(VALID_BCRYPT_HASH);

    // Then
    assertThat(passwordHash.getValue()).isEqualTo(VALID_BCRYPT_HASH);
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        "$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123",
        "$2x$08$1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR",
        "$2y$15$zyxwvutsrqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA987"
      })
  void shouldAcceptValidBCryptHashes(String validHash) {
    // When & Then
    assertThatCode(() -> PasswordHash.of(validHash)).doesNotThrowAnyException();
  }

  @Test
  void shouldThrowExceptionForNullPasswordHash() {
    // When & Then
    assertThatThrownBy(() -> PasswordHash.of(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Password hash cannot be null");
  }

  @Test
  void shouldThrowExceptionForEmptyPasswordHash() {
    // When & Then
    assertThatThrownBy(() -> PasswordHash.of(""))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Password hash cannot be empty");
  }

  @Test
  void shouldThrowExceptionForWhitespaceOnlyPasswordHash() {
    // When & Then
    assertThatThrownBy(() -> PasswordHash.of("   "))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Password hash cannot be empty");
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "plaintext",
        "$1$invalid$hash",
        "$2a$invalid$hash",
        "$2a$10$tooshort",
        "$2a$10$toolonghashabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "$3a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
      })
  void shouldThrowExceptionForInvalidPasswordHashFormat(String invalidHash) {
    // When & Then
    assertThatThrownBy(() -> PasswordHash.of(invalidHash))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Invalid password hash format");
  }

  @Test
  void shouldTrimWhitespace() {
    // Given
    String hashWithSpaces = "  " + VALID_BCRYPT_HASH + "  ";

    // When
    PasswordHash passwordHash = PasswordHash.of(hashWithSpaces);

    // Then
    assertThat(passwordHash.getValue()).isEqualTo(VALID_BCRYPT_HASH);
  }

  @Test
  void shouldImplementEqualsAndHashCodeCorrectly() {
    // Given
    PasswordHash passwordHash1 = PasswordHash.of(VALID_BCRYPT_HASH);
    PasswordHash passwordHash2 = PasswordHash.of(VALID_BCRYPT_HASH);
    PasswordHash passwordHash3 =
        PasswordHash.of("$2a$10$differenthashvalueabcdefghijklmnopqrstuvwxyzABCDEFGHIJKL");

    // Then
    assertThat(passwordHash1).isEqualTo(passwordHash2);
    assertThat(passwordHash1).isNotEqualTo(passwordHash3);
    assertThat(passwordHash1.hashCode()).isEqualTo(passwordHash2.hashCode());
    assertThat(passwordHash1.hashCode()).isNotEqualTo(passwordHash3.hashCode());
  }

  @Test
  void shouldNotExposeHashInToString() {
    // Given
    PasswordHash passwordHash = PasswordHash.of(VALID_BCRYPT_HASH);

    // When & Then
    assertThat(passwordHash.toString()).isEqualTo("[PROTECTED]");
    assertThat(passwordHash.toString()).doesNotContain(VALID_BCRYPT_HASH);
  }
}
