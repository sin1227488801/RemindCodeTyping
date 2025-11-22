package com.rct.infrastructure.persistence.mapper;

import com.rct.domain.model.user.*;
import com.rct.infrastructure.persistence.entity.UserEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper class for converting between User domain entity and UserEntity JPA entity. This maintains
 * the separation between domain and infrastructure layers.
 */
@Component
public class UserMapper {

  /**
   * Converts a domain User to a JPA UserEntity.
   *
   * @param user the domain user
   * @return the corresponding JPA entity
   */
  public UserEntity toEntity(User user) {
    if (user == null) {
      return null;
    }

    UserEntity entity = new UserEntity(user.getId().getValue());
    entity.setLoginId(user.getLoginId().getValue());
    entity.setPasswordHash(user.getPasswordHash().getValue());
    entity.setRole(user.getRole().getCode());
    entity.setLastLoginDate(user.getLoginStatistics().getLastLoginDate());
    entity.setConsecutiveLoginDays(user.getLoginStatistics().getConsecutiveDays());
    entity.setMaxConsecutiveLoginDays(user.getLoginStatistics().getMaxConsecutiveDays());
    entity.setTotalLoginDays(user.getLoginStatistics().getTotalDays());
    entity.setCreatedAt(user.getCreatedAt());
    entity.setUpdatedAt(user.getUpdatedAt());

    return entity;
  }

  /**
   * Converts a JPA UserEntity to a domain User.
   *
   * @param entity the JPA entity
   * @return the corresponding domain user
   */
  public User toDomain(UserEntity entity) {
    if (entity == null) {
      return null;
    }

    UserId userId = UserId.of(entity.getId());
    LoginId loginId = LoginId.of(entity.getLoginId());
    PasswordHash passwordHash = PasswordHash.of(entity.getPasswordHash());
    Role role = Role.fromString(entity.getRole());

    LoginStatistics loginStatistics = LoginStatistics.of(
            entity.getLastLoginDate(),
            entity.getConsecutiveLoginDays(),
            entity.getMaxConsecutiveLoginDays(),
            entity.getTotalLoginDays());

    return User.reconstruct(
        userId,
        loginId,
        passwordHash,
        role,
        loginStatistics,
        entity.getCreatedAt(),
        entity.getUpdatedAt());
  }

  /**
   * Creates a new UserEntity for a new domain User (without ID).
   *
   * @param user the domain user
   * @return the corresponding JPA entity without ID set
   */
  public UserEntity toNewEntity(User user) {
    if (user == null) {
      return null;
    }

    return new UserEntity(
        user.getLoginId().getValue(),
        user.getPasswordHash().getValue(),
        user.getRole().getCode(),
        user.getLoginStatistics().getLastLoginDate(),
        user.getLoginStatistics().getConsecutiveDays(),
        user.getLoginStatistics().getMaxConsecutiveDays(),
        user.getLoginStatistics().getTotalDays());
  }

  /**
   * Updates an existing UserEntity with data from a domain User.
   *
   * @param entity the existing JPA entity
   * @param user the domain user with updated data
   */
  public void updateEntity(UserEntity entity, User user) {
    if (entity == null || user == null) {
      return;
    }

    entity.setLoginId(user.getLoginId().getValue());
    entity.setPasswordHash(user.getPasswordHash().getValue());
    entity.setRole(user.getRole().getCode());
    entity.setLastLoginDate(user.getLoginStatistics().getLastLoginDate());
    entity.setConsecutiveLoginDays(user.getLoginStatistics().getConsecutiveDays());
    entity.setMaxConsecutiveLoginDays(user.getLoginStatistics().getMaxConsecutiveDays());
    entity.setTotalLoginDays(user.getLoginStatistics().getTotalDays());
    entity.setUpdatedAt(user.getUpdatedAt());
  }
}
