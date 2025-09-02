package com.rct.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.PasswordHash;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Integration test to verify that all security infrastructure components work together correctly.
 * This test focuses only on the security components without depending on other parts of the system.
 */
@DisplayName("Security Infrastructure Integration Test")
class SecurityInfrastructureTest {

  @Test
  @DisplayName("Should create and validate JWT token with password service")
  void shouldCreateAndValidateJwtTokenWithPasswordService() {
    // Given
    String secretKey = "testSecretKey123456789012345678901234567890123456789012345678901234567890";
    long expirationMinutes = 60;
    String issuer = "test-issuer";

    JwtTokenService jwtTokenService = new JwtTokenService(secretKey, expirationMinutes, issuer);
    PasswordService passwordService = new PasswordService();

    // Create a test user
    UserId userId = UserId.of(UUID.randomUUID());
    LoginId loginId = LoginId.of("testuser");
    String rawPassword = "TestPassword123";
    PasswordHash passwordHash = passwordService.encode(rawPassword);

    User user = User.create(userId, loginId, passwordHash, false);

    // When - Generate JWT token
    String token = jwtTokenService.generateToken(user);

    // Then - Validate token
    assertThat(token).isNotNull().isNotEmpty();

    var claims = jwtTokenService.validateToken(token);
    assertThat(claims).isPresent();
    assertThat(claims.get().getUserId()).isEqualTo(userId);
    assertThat(claims.get().getLoginId()).isEqualTo(loginId.getValue());

    // Verify password service works
    assertThat(passwordService.matches(rawPassword, passwordHash)).isTrue();
    assertThat(passwordService.matches("wrongPassword", passwordHash)).isFalse();
  }

  @Test
  @DisplayName("Should handle authentication user correctly")
  void shouldHandleAuthenticationUserCorrectly() {
    // Given
    UserId userId = UserId.of(UUID.randomUUID());
    String loginId = "testuser";

    // When
    JwtAuthenticationFilter.AuthenticatedUser authenticatedUser =
        new JwtAuthenticationFilter.AuthenticatedUser(userId, loginId);

    // Then
    assertThat(authenticatedUser.getUserId()).isEqualTo(userId);
    assertThat(authenticatedUser.getLoginId()).isEqualTo(loginId);
    assertThat(authenticatedUser.toString()).isEqualTo(loginId);
  }

  @Test
  @DisplayName("Should validate password strength correctly")
  void shouldValidatePasswordStrengthCorrectly() {
    // Given
    PasswordService passwordService = new PasswordService();

    // When & Then - Strong password should work
    assertThat(() -> passwordService.encode("StrongPass123")).doesNotThrowAnyException();

    // Weak passwords should fail
    assertThat(() -> passwordService.encode("weak"))
        .isInstanceOf(PasswordService.WeakPasswordException.class);

    assertThat(() -> passwordService.encode("password123"))
        .isInstanceOf(PasswordService.WeakPasswordException.class);
  }
}
