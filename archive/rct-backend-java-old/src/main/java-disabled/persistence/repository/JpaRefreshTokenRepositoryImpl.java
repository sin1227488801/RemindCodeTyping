package com.rct.infrastructure.persistence.repository;

import com.rct.domain.model.auth.RefreshToken;
import com.rct.domain.model.auth.RefreshTokenId;
import com.rct.domain.model.auth.RefreshTokenRepository;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.persistence.mapper.RefreshTokenMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA implementation of RefreshTokenRepository. */
@Repository
@RequiredArgsConstructor
@Slf4j
public class JpaRefreshTokenRepositoryImpl implements RefreshTokenRepository {

  private final JpaRefreshTokenEntityRepository jpaRepository;
  private final RefreshTokenMapper mapper;

  @Override
  @Transactional
  public RefreshToken save(RefreshToken refreshToken) {
    log.debug("Saving refresh token for user: {}", refreshToken.getUserId());

    var entity = mapper.toEntity(refreshToken);
    var savedEntity = jpaRepository.save(entity);

    log.debug("Refresh token saved with ID: {}", savedEntity.getId());
    return mapper.toDomain(savedEntity);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<RefreshToken> findByToken(String token) {
    log.debug("Finding refresh token by token value");

    return jpaRepository.findByToken(token).map(mapper::toDomain);
  }

  @Override
  @Transactional(readOnly = true)
  public List<RefreshToken> findValidTokensByUserId(UserId userId) {
    log.debug("Finding valid refresh tokens for user: {}", userId);

    LocalDateTime now = LocalDateTime.now();
    return jpaRepository.findValidTokensByUserId(userId.getValue(), now).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  @Transactional
  public void revokeAllTokensForUser(UserId userId) {
    log.debug("Revoking all refresh tokens for user: {}", userId);

    jpaRepository.revokeAllTokensForUser(userId.getValue());

    log.debug("All refresh tokens revoked for user: {}", userId);
  }

  @Override
  @Transactional
  public void deleteExpiredTokens() {
    log.debug("Deleting expired refresh tokens");

    LocalDateTime now = LocalDateTime.now();
    jpaRepository.deleteExpiredTokens(now);

    log.debug("Expired refresh tokens deleted");
  }

  @Override
  @Transactional
  public void deleteById(RefreshTokenId id) {
    log.debug("Deleting refresh token: {}", id);

    jpaRepository.deleteById(id.getValue());

    log.debug("Refresh token deleted: {}", id);
  }

  /**
   * Cleanup method to delete old revoked tokens. Should be called periodically to maintain database
   * hygiene.
   */
  @Transactional
  public void deleteOldRevokedTokens(LocalDateTime before) {
    log.debug("Deleting revoked refresh tokens older than: {}", before);

    jpaRepository.deleteRevokedTokensOlderThan(before);

    log.debug("Old revoked refresh tokens deleted");
  }
}
