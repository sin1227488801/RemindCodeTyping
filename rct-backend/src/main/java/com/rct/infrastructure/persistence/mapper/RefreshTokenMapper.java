package com.rct.infrastructure.persistence.mapper;

import com.rct.domain.model.auth.RefreshToken;
import com.rct.domain.model.auth.RefreshTokenId;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.persistence.entity.RefreshTokenEntity;
import org.springframework.stereotype.Component;

/** Mapper between RefreshToken domain model and RefreshTokenEntity. */
@Component
public class RefreshTokenMapper {

  /** Maps domain model to entity. */
  public RefreshTokenEntity toEntity(RefreshToken refreshToken) {
    return new RefreshTokenEntity(
        refreshToken.getId().getValue(),
        refreshToken.getUserId().getValue(),
        refreshToken.getToken(),
        refreshToken.getExpiresAt(),
        refreshToken.getCreatedAt(),
        refreshToken.isRevoked());
  }

  /** Maps entity to domain model. */
  public RefreshToken toDomain(RefreshTokenEntity entity) {
    return RefreshToken.reconstruct(
        RefreshTokenId.of(entity.getId()),
        UserId.of(entity.getUserId()),
        entity.getToken(),
        entity.getExpiresAt(),
        entity.getCreatedAt(),
        entity.isRevoked());
  }
}
