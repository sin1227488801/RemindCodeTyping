package com.rct.domain.model.user;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class LoginIdTest {

  @Test
  void shouldCreateValidLoginId() {
    // Given
    String validLoginId = "testuser123";

    // When
    LoginId loginId = LoginId.of(validLoginId);

    // Then
    assertThat(loginId.getValue()).isEqualTo(validLoginId);
  }

  @ParameterizedTest
  @ValueSource(strings = {"abc", "test_user", "user-123", "USER123", "test123_user-name"})
  void shouldAcceptValidLoginIds(String validLoginId) {
    // When & Then
    assertThatCode(() -> LoginId.of(validLoginId)).doesNotThrowAnyException();
  }

  @Test
  void shouldTrimWhitespace() {
    // Given
    String loginIdWithSpaces = "  testuser  ";

    // When
    LoginId loginId = LoginId.of(loginIdWithSpaces);

    // Then
    assertThat(loginId.getValue()).isEqualTo("testuser");
  }

  @Test
  void shouldThrowExceptionForNullLoginId() {
    // When & Then
    assertThatThrownBy(() -> LoginId.of(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("LoginId cannot be null");
  }

  @Test
  void shouldThrowExceptionForEmptyLoginId() {
    // When & Then
    assertThatThrownBy(() -> LoginId.of(""))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("LoginId cannot be empty");
  }

  @Test
  void shouldThrowExceptionForWhitespaceOnlyLoginId() {
    // When & Then
    assertThatThrownBy(() -> LoginId.of("   "))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("LoginId cannot be empty");
  }

  @Test
  void shouldThrowExceptionForTooShortLoginId() {
    // Given
    String shortLoginId = "ab";

    // When & Then
    assertThatThrownBy(() -> LoginId.of(shortLoginId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("LoginId must be at least 3 characters long");
  }

  @Test
  void shouldThrowExceptionForTooLongLoginId() {
    // Given
    String longLoginId = "a".repeat(51);

    // When & Then
    assertThatThrownBy(() -> LoginId.of(longLoginId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("LoginId cannot exceed 50 characters");
  }

  @ParameterizedTest
  @ValueSource(
      strings = {"test user", "test@user", "test.user", "test#user", "test$user", "test%user"})
  void shouldThrowExceptionForInvalidCharacters(String invalidLoginId) {
    // When & Then
    assertThatThrownBy(() -> LoginId.of(invalidLoginId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("LoginId can only contain letters, numbers, underscores, and hyphens");
  }

  @Test
  void shouldImplementEqualsAndHashCodeCorrectly() {
    // Given
    LoginId loginId1 = LoginId.of("testuser");
    LoginId loginId2 = LoginId.of("testuser");
    LoginId loginId3 = LoginId.of("otheruser");

    // Then
    assertThat(loginId1).isEqualTo(loginId2);
    assertThat(loginId1).isNotEqualTo(loginId3);
    assertThat(loginId1.hashCode()).isEqualTo(loginId2.hashCode());
    assertThat(loginId1.hashCode()).isNotEqualTo(loginId3.hashCode());
  }

  @Test
  void shouldImplementToStringCorrectly() {
    // Given
    String loginIdValue = "testuser";
    LoginId loginId = LoginId.of(loginIdValue);

    // When & Then
    assertThat(loginId.toString()).isEqualTo(loginIdValue);
  }
}
