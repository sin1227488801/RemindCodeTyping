package com.rct.infrastructure.persistence.repository;

import com.rct.infrastructure.persistence.entity.RefreshTokenEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** JPA repository for refresh token entity operations. */
@Repository
public interface JpaRefreshTokenEntityRepository extends JpaRepository<RefreshTokenEntity, UUID> {

  /** Finds a refresh token by its token value. */
  Optional<RefreshTokenEntity> findByToken(String token);

  /** Finds all valid (non-revoked and non-expired) refresh tokens for a user. */
  @Query(
      "SELECT rt FROM RefreshTokenEntity rt WHERE rt.userId = :userId "
          + "AND rt.revoked = false AND rt.expiresAt > :now")
  List<RefreshTokenEntity> findValidTokensByUserId(
      @Param("userId") UUID userId, @Param("now") LocalDateTime now);

  /** Revokes all refresh tokens for a user. */
  @Modifying
  @Query("UPDATE RefreshTokenEntity rt SET rt.revoked = true WHERE rt.userId = :userId")
  void revokeAllTokensForUser(@Param("userId") UUID userId);

  /** Deletes all expired refresh tokens. */
  @Modifying
  @Query("DELETE FROM RefreshTokenEntity rt WHERE rt.expiresAt < :now")
  void deleteExpiredTokens(@Param("now") LocalDateTime now);

  /** Deletes all revoked refresh tokens older than specified date. */
  @Modifying
  @Query("DELETE FROM RefreshTokenEntity rt WHERE rt.revoked = true AND rt.createdAt < :before")
  void deleteRevokedTokensOlderThan(@Param("before") LocalDateTime before);
}
