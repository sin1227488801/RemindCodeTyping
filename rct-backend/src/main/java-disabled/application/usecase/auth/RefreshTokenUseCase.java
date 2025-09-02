package com.rct.application.usecase.auth;

import com.rct.application.result.AuthenticationResult;
import com.rct.domain.model.auth.RefreshToken;
import com.rct.domain.model.auth.RefreshTokenRepository;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserRepository;
import com.rct.infrastructure.security.JwtTokenService;
import com.rct.presentation.exception.AuthenticationException;
import com.rct.presentation.exception.ErrorCode;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Use case for refreshing JWT access tokens using refresh tokens. */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenUseCase {

  private final RefreshTokenRepository refreshTokenRepository;
  private final UserRepository userRepository;
  private final JwtTokenService jwtTokenService;

  /**
   * Refreshes an access token using a valid refresh token.
   *
   * @param refreshTokenValue the refresh token value
   * @return new authentication result with fresh tokens
   * @throws AuthenticationException if refresh token is invalid
   */
  @Transactional
  public AuthenticationResult execute(String refreshTokenValue) {
    log.debug("Processing token refresh request");

    // Validate the refresh token format first
    if (!jwtTokenService.isRefreshToken(refreshTokenValue)) {
      log.warn("Invalid token type provided for refresh");
      throw new AuthenticationException(
          ErrorCode.INVALID_REFRESH_TOKEN, "Invalid refresh token format");
    }

    // Find the refresh token in database
    RefreshToken refreshToken =
        refreshTokenRepository
            .findByToken(refreshTokenValue)
            .orElseThrow(
                () -> {
                  log.warn("Refresh token not found in database");
                  return new AuthenticationException(
                      ErrorCode.INVALID_REFRESH_TOKEN, "Refresh token not found");
                });

    // Validate token is still valid
    if (!refreshToken.isValid()) {
      log.warn("Refresh token is expired or revoked for user: {}", refreshToken.getUserId());

      // Clean up invalid token
      refreshTokenRepository.deleteById(refreshToken.getId());

      throw new AuthenticationException(
          ErrorCode.REFRESH_TOKEN_EXPIRED, "Refresh token has expired");
    }

    // Get the user
    User user =
        userRepository
            .findById(refreshToken.getUserId())
            .orElseThrow(
                () -> {
                  log.error("User not found for valid refresh token: {}", refreshToken.getUserId());
                  return new AuthenticationException(ErrorCode.USER_NOT_FOUND, "User not found");
                });

    // Generate new tokens
    String newAccessToken = jwtTokenService.generateAccessToken(user);
    String newRefreshToken = jwtTokenService.generateRefreshToken(user);

    // Revoke the old refresh token
    refreshToken.revoke();
    refreshTokenRepository.save(refreshToken);

    // Save the new refresh token
    LocalDateTime refreshExpiration =
        LocalDateTime.now().plus(jwtTokenService.getRefreshTokenExpiration());
    RefreshToken newRefreshTokenEntity =
        RefreshToken.create(user.getId(), newRefreshToken, refreshExpiration);
    refreshTokenRepository.save(newRefreshTokenEntity);

    log.debug("Token refresh successful for user: {}", user.getLoginId().getValue());

    return AuthenticationResult.success(
        user.getId(),
        user.getLoginId().getValue(),
        user.getRole().getCode(),
        newAccessToken,
        newRefreshToken);
  }

  /**
   * Revokes a refresh token (logout).
   *
   * @param refreshTokenValue the refresh token to revoke
   */
  @Transactional
  public void revokeToken(String refreshTokenValue) {
    log.debug("Revoking refresh token");

    refreshTokenRepository
        .findByToken(refreshTokenValue)
        .ifPresent(
            refreshToken -> {
              refreshToken.revoke();
              refreshTokenRepository.save(refreshToken);
              log.debug("Refresh token revoked for user: {}", refreshToken.getUserId());
            });
  }

  /**
   * Revokes all refresh tokens for a user (logout from all devices).
   *
   * @param userId the user ID
   */
  @Transactional
  public void revokeAllTokensForUser(com.rct.domain.model.user.UserId userId) {
    log.debug("Revoking all refresh tokens for user: {}", userId);

    refreshTokenRepository.revokeAllTokensForUser(userId);

    log.debug("All refresh tokens revoked for user: {}", userId);
  }
}
