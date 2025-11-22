package com.rct.application.usecase.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.rct.application.result.AuthenticationResult;
import com.rct.domain.model.auth.RefreshToken;
import com.rct.domain.model.auth.RefreshTokenRepository;
import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.PasswordHash;
import com.rct.domain.model.user.Role;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import com.rct.domain.model.user.UserRepository;
import com.rct.infrastructure.security.JwtTokenService;
import com.rct.presentation.exception.AuthenticationException;
import com.rct.presentation.exception.ErrorCode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for RefreshTokenUseCase. */
@ExtendWith(MockitoExtension.class)
class RefreshTokenUseCaseTest {

  @Mock private RefreshTokenRepository refreshTokenRepository;

  @Mock private UserRepository userRepository;

  @Mock private JwtTokenService jwtTokenService;

  private RefreshTokenUseCase refreshTokenUseCase;

  private User testUser;
  private RefreshToken validRefreshToken;
  private String refreshTokenValue;

  @BeforeEach
  void setUp() {
    refreshTokenUseCase =
        new RefreshTokenUseCase(refreshTokenRepository, userRepository, jwtTokenService);

    testUser =
        User.create(
            UserId.generate(),
            LoginId.of("testuser"),
            PasswordHash.of("hashedpassword"),
            Role.user());

    refreshTokenValue = "valid-refresh-token";
    validRefreshToken =
        RefreshToken.create(testUser.getId(), refreshTokenValue, LocalDateTime.now().plusDays(7));
  }

  @Test
  void shouldRefreshTokenSuccessfully() {
    // Given
    when(jwtTokenService.isRefreshToken(refreshTokenValue)).thenReturn(true);
    when(refreshTokenRepository.findByToken(refreshTokenValue))
        .thenReturn(Optional.of(validRefreshToken));
    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
    when(jwtTokenService.generateAccessToken(testUser)).thenReturn("new-access-token");
    when(jwtTokenService.generateRefreshToken(testUser)).thenReturn("new-refresh-token");
    when(jwtTokenService.getRefreshTokenExpiration()).thenReturn(Duration.ofDays(7));
    when(refreshTokenRepository.save(any(RefreshToken.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    // When
    AuthenticationResult result = refreshTokenUseCase.execute(refreshTokenValue);

    // Then
    assertThat(result.getUserId()).isEqualTo(testUser.getId());
    assertThat(result.getLoginId()).isEqualTo(testUser.getLoginId().getValue());
    assertThat(result.getRole()).isEqualTo(testUser.getRole().getCode());
    assertThat(result.getAccessToken()).isEqualTo("new-access-token");
    assertThat(result.getRefreshToken()).isEqualTo("new-refresh-token");

    // Verify old token was revoked
    verify(refreshTokenRepository).save(validRefreshToken);
    assertThat(validRefreshToken.isRevoked()).isTrue();

    // Verify new token was saved
    verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
  }

  @Test
  void shouldThrowExceptionForInvalidTokenFormat() {
    // Given
    when(jwtTokenService.isRefreshToken(anyString())).thenReturn(false);

    // When & Then
    assertThatThrownBy(() -> refreshTokenUseCase.execute("invalid-token"))
        .isInstanceOf(AuthenticationException.class)
        .hasMessage("Invalid refresh token format")
        .extracting("errorCode")
        .isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN);
  }

  @Test
  void shouldThrowExceptionForTokenNotFound() {
    // Given
    when(jwtTokenService.isRefreshToken(refreshTokenValue)).thenReturn(true);
    when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.empty());

    // When & Then
    assertThatThrownBy(() -> refreshTokenUseCase.execute(refreshTokenValue))
        .isInstanceOf(AuthenticationException.class)
        .hasMessage("Refresh token not found")
        .extracting("errorCode")
        .isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN);
  }

  @Test
  void shouldThrowExceptionForExpiredToken() {
    // Given
    RefreshToken expiredToken =
        RefreshToken.create(
            testUser.getId(), refreshTokenValue, LocalDateTime.now().minusDays(1) // Expired
            );

    when(jwtTokenService.isRefreshToken(refreshTokenValue)).thenReturn(true);
    when(refreshTokenRepository.findByToken(refreshTokenValue))
        .thenReturn(Optional.of(expiredToken));

    // When & Then
    assertThatThrownBy(() -> refreshTokenUseCase.execute(refreshTokenValue))
        .isInstanceOf(AuthenticationException.class)
        .hasMessage("Refresh token has expired")
        .extracting("errorCode")
        .isEqualTo(ErrorCode.REFRESH_TOKEN_EXPIRED);

    // Verify expired token was deleted
    verify(refreshTokenRepository).deleteById(expiredToken.getId());
  }

  @Test
  void shouldThrowExceptionForRevokedToken() {
    // Given
    validRefreshToken.revoke();

    when(jwtTokenService.isRefreshToken(refreshTokenValue)).thenReturn(true);
    when(refreshTokenRepository.findByToken(refreshTokenValue))
        .thenReturn(Optional.of(validRefreshToken));

    // When & Then
    assertThatThrownBy(() -> refreshTokenUseCase.execute(refreshTokenValue))
        .isInstanceOf(AuthenticationException.class)
        .hasMessage("Refresh token has expired")
        .extracting("errorCode")
        .isEqualTo(ErrorCode.REFRESH_TOKEN_EXPIRED);

    // Verify revoked token was deleted
    verify(refreshTokenRepository).deleteById(validRefreshToken.getId());
  }

  @Test
  void shouldThrowExceptionForUserNotFound() {
    // Given
    when(jwtTokenService.isRefreshToken(refreshTokenValue)).thenReturn(true);
    when(refreshTokenRepository.findByToken(refreshTokenValue))
        .thenReturn(Optional.of(validRefreshToken));
    when(userRepository.findById(testUser.getId())).thenReturn(Optional.empty());

    // When & Then
    assertThatThrownBy(() -> refreshTokenUseCase.execute(refreshTokenValue))
        .isInstanceOf(AuthenticationException.class)
        .hasMessage("User not found")
        .extracting("errorCode")
        .isEqualTo(ErrorCode.USER_NOT_FOUND);
  }

  @Test
  void shouldRevokeTokenSuccessfully() {
    // Given
    when(refreshTokenRepository.findByToken(refreshTokenValue))
        .thenReturn(Optional.of(validRefreshToken));

    // When
    refreshTokenUseCase.revokeToken(refreshTokenValue);

    // Then
    verify(refreshTokenRepository).save(validRefreshToken);
    assertThat(validRefreshToken.isRevoked()).isTrue();
  }

  @Test
  void shouldHandleRevokeTokenWhenTokenNotFound() {
    // Given
    when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.empty());

    // When
    refreshTokenUseCase.revokeToken(refreshTokenValue);

    // Then
    verify(refreshTokenRepository, never()).save(any());
  }

  @Test
  void shouldRevokeAllTokensForUser() {
    // When
    refreshTokenUseCase.revokeAllTokensForUser(testUser.getId());

    // Then
    verify(refreshTokenRepository).revokeAllTokensForUser(testUser.getId());
  }
}
