package com.rct.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.rct.domain.model.user.PasswordHash;
import com.rct.infrastructure.security.PasswordService.WeakPasswordException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("Password Service Tests")
class PasswordServiceTest {

  private PasswordService passwordService;

  @BeforeEach
  void setUp() {
    passwordService = new PasswordService();
  }

  @Test
  @DisplayName("Should encode valid password successfully")
  void shouldEncodeValidPasswordSuccessfully() {
    // Given
    String rawPassword = "ValidPass123";

    // When
    PasswordHash encoded = passwordService.encode(rawPassword);

    // Then
    assertThat(encoded).isNotNull();
    assertThat(encoded.getValue()).isNotNull().isNotEmpty();
    assertThat(encoded.getValue()).startsWith("$2"); // BCrypt format
    assertThat(encoded.getValue()).isNotEqualTo(rawPassword); // Should be hashed
  }

  @Test
  @DisplayName("Should match correct password with hash")
  void shouldMatchCorrectPasswordWithHash() {
    // Given
    String rawPassword = "ValidPass123";
    PasswordHash hash = passwordService.encode(rawPassword);

    // When
    boolean matches = passwordService.matches(rawPassword, hash);

    // Then
    assertThat(matches).isTrue();
  }

  @Test
  @DisplayName("Should not match incorrect password with hash")
  void shouldNotMatchIncorrectPasswordWithHash() {
    // Given
    String rawPassword = "ValidPass123";
    String wrongPassword = "WrongPass123";
    PasswordHash hash = passwordService.encode(rawPassword);

    // When
    boolean matches = passwordService.matches(wrongPassword, hash);

    // Then
    assertThat(matches).isFalse();
  }

  @Test
  @DisplayName("Should return false for null raw password")
  void shouldReturnFalseForNullRawPassword() {
    // Given
    PasswordHash hash = passwordService.encode("ValidPass123");

    // When
    boolean matches = passwordService.matches(null, hash);

    // Then
    assertThat(matches).isFalse();
  }

  @Test
  @DisplayName("Should return false for null password hash")
  void shouldReturnFalseForNullPasswordHash() {
    // When
    boolean matches = passwordService.matches("ValidPass123", null);

    // Then
    assertThat(matches).isFalse();
  }

  @Test
  @DisplayName("Should return false for password hash with null value")
  void shouldReturnFalseForPasswordHashWithNullValue() {
    // Given
    PasswordHash nullHash = new PasswordHash(null);

    // When
    boolean matches = passwordService.matches("ValidPass123", nullHash);

    // Then
    assertThat(matches).isFalse();
  }

  @ParameterizedTest
  @ValueSource(strings = {"", "1234567", "short"})
  @DisplayName("Should reject passwords that are too short")
  void shouldRejectPasswordsThatAreTooShort(String shortPassword) {
    // When & Then
    assertThatThrownBy(() -> passwordService.encode(shortPassword))
        .isInstanceOf(WeakPasswordException.class)
        .hasMessageContaining("Password must be at least 8 characters long");
  }

  @Test
  @DisplayName("Should reject null password")
  void shouldRejectNullPassword() {
    // When & Then
    assertThatThrownBy(() -> passwordService.encode(null))
        .isInstanceOf(WeakPasswordException.class)
        .hasMessageContaining("Password must be at least 8 characters long");
  }

  @ParameterizedTest
  @ValueSource(strings = {"alllowercase123", "ALLUPPERCASE123", "NoDigitsHere"})
  @DisplayName("Should reject passwords without required character types")
  void shouldRejectPasswordsWithoutRequiredCharacterTypes(String weakPassword) {
    // When & Then
    assertThatThrownBy(() -> passwordService.encode(weakPassword))
        .isInstanceOf(WeakPasswordException.class)
        .hasMessageContaining("Password must contain at least one uppercase letter");
  }

  @ParameterizedTest
  @ValueSource(strings = {"password", "12345678", "password123", "admin123", "qwerty123"})
  @DisplayName("Should reject common weak passwords")
  void shouldRejectCommonWeakPasswords(String commonPassword) {
    // When & Then
    assertThatThrownBy(() -> passwordService.encode(commonPassword))
        .isInstanceOf(WeakPasswordException.class)
        .hasMessageContaining("Password is too common and easily guessable");
  }

  @Test
  @DisplayName("Should accept strong password with all required elements")
  void shouldAcceptStrongPasswordWithAllRequiredElements() {
    // Given
    String strongPassword = "StrongPass123";

    // When & Then - Should not throw exception
    PasswordHash hash = passwordService.encode(strongPassword);
    assertThat(hash).isNotNull();
    assertThat(hash.getValue()).isNotNull();
  }

  @Test
  @DisplayName("Should generate different hashes for same password")
  void shouldGenerateDifferentHashesForSamePassword() {
    // Given
    String password = "ValidPass123";

    // When
    PasswordHash hash1 = passwordService.encode(password);
    PasswordHash hash2 = passwordService.encode(password);

    // Then
    assertThat(hash1.getValue()).isNotEqualTo(hash2.getValue());
    // But both should match the original password
    assertThat(passwordService.matches(password, hash1)).isTrue();
    assertThat(passwordService.matches(password, hash2)).isTrue();
  }

  @Test
  @DisplayName("Should detect hash that needs rehashing")
  void shouldDetectHashThatNeedsRehashing() {
    // Given - Simulate old hash with lower work factor
    String oldHash = "$2a$10$abcdefghijklmnopqrstuvwxyz"; // Work factor 10 (lower than 12)
    PasswordHash oldPasswordHash = new PasswordHash(oldHash);

    // When
    boolean needsRehashing = passwordService.needsRehashing(oldPasswordHash);

    // Then
    assertThat(needsRehashing).isTrue();
  }

  @Test
  @DisplayName("Should detect current hash that doesn't need rehashing")
  void shouldDetectCurrentHashThatDoesntNeedRehashing() {
    // Given
    String password = "ValidPass123";
    PasswordHash currentHash = passwordService.encode(password);

    // When
    boolean needsRehashing = passwordService.needsRehashing(currentHash);

    // Then
    assertThat(needsRehashing).isFalse();
  }

  @Test
  @DisplayName("Should detect invalid hash format as needing rehashing")
  void shouldDetectInvalidHashFormatAsNeedingRehashing() {
    // Given
    PasswordHash invalidHash = new PasswordHash("invalid-hash-format");

    // When
    boolean needsRehashing = passwordService.needsRehashing(invalidHash);

    // Then
    assertThat(needsRehashing).isTrue();
  }

  @Test
  @DisplayName("Should detect null hash as needing rehashing")
  void shouldDetectNullHashAsNeedingRehashing() {
    // Given
    PasswordHash nullHash = new PasswordHash(null);

    // When
    boolean needsRehashing = passwordService.needsRehashing(nullHash);

    // Then
    assertThat(needsRehashing).isTrue();
  }

  @Test
  @DisplayName("Should handle malformed BCrypt hash gracefully")
  void shouldHandleMalformedBCryptHashGracefully() {
    // Given
    PasswordHash malformedHash = new PasswordHash("$2a$invalid$format");

    // When
    boolean needsRehashing = passwordService.needsRehashing(malformedHash);

    // Then
    assertThat(needsRehashing).isTrue();
  }

  @Test
  @DisplayName("Should accept password with special characters")
  void shouldAcceptPasswordWithSpecialCharacters() {
    // Given
    String passwordWithSpecialChars = "Valid@Pass123!";

    // When & Then - Should not throw exception
    PasswordHash hash = passwordService.encode(passwordWithSpecialChars);
    assertThat(hash).isNotNull();
    assertThat(passwordService.matches(passwordWithSpecialChars, hash)).isTrue();
  }
}
