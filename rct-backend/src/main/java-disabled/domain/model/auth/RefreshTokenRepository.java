package com.rct.domain.model.auth;

import com.rct.domain.model.user.UserId;
import java.util.List;
import java.util.Optional;

/** Repository interface for refresh token persistence operations. */
public interface RefreshTokenRepository {

  /**
   * Saves a refresh token.
   *
   * @param refreshToken the refresh token to save
   * @return the saved refresh token
   */
  RefreshToken save(RefreshToken refreshToken);

  /**
   * Finds a refresh token by its token value.
   *
   * @param token the token value
   * @return Optional containing the refresh token if found
   */
  Optional<RefreshToken> findByToken(String token);

  /**
   * Finds all valid refresh tokens for a user.
   *
   * @param userId the user ID
   * @return list of valid refresh tokens
   */
  List<RefreshToken> findValidTokensByUserId(UserId userId);

  /**
   * Revokes all refresh tokens for a user.
   *
   * @param userId the user ID
   */
  void revokeAllTokensForUser(UserId userId);

  /** Deletes expired refresh tokens. */
  void deleteExpiredTokens();

  /**
   * Deletes a refresh token by its ID.
   *
   * @param id the refresh token ID
   */
  void deleteById(RefreshTokenId id);
}
