package com.rct.infrastructure.persistence.repository;

import com.rct.domain.model.user.*;
import com.rct.infrastructure.persistence.entity.UserEntity;
import com.rct.infrastructure.persistence.mapper.UserMapper;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * JPA implementation of the UserRepository domain interface. This class bridges the domain layer
 * with the persistence infrastructure while maintaining clean architecture boundaries.
 */
@Repository
@Transactional
public class JpaUserRepositoryImpl implements UserRepository {

  private final JpaUserEntityRepository jpaRepository;
  private final UserMapper userMapper;

  public JpaUserRepositoryImpl(JpaUserEntityRepository jpaRepository, UserMapper userMapper) {
    this.jpaRepository = jpaRepository;
    this.userMapper = userMapper;
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<User> findByLoginId(LoginId loginId) {
    if (loginId == null) {
      throw new IllegalArgumentException("LoginId cannot be null");
    }

    return jpaRepository.findByLoginId(loginId.getValue()).map(userMapper::toDomain);
  }

  @Override
  public User save(User user) {
    if (user == null) {
      throw new IllegalArgumentException("User cannot be null");
    }

    UserEntity entity;
    if (user.getId().getValue() == null) {
      // New user - create new entity
      entity = userMapper.toNewEntity(user);
      entity = jpaRepository.save(entity);

      // Create a new User with the generated ID
      UserId newUserId = new UserId(entity.getId());
      return User.reconstruct(
          newUserId,
          user.getLoginId(),
          user.getPasswordHash(),
          user.getLoginStatistics(),
          entity.getCreatedAt(),
          entity.getUpdatedAt());
    } else {
      // Existing user - update existing entity
      Optional<UserEntity> existingEntity = jpaRepository.findById(user.getId().getValue());
      if (existingEntity.isPresent()) {
        entity = existingEntity.get();
        userMapper.updateEntity(entity, user);
        entity = jpaRepository.save(entity);
      } else {
        // Entity doesn't exist, create new one with the provided ID
        entity = userMapper.toEntity(user);
        entity = jpaRepository.save(entity);
      }
    }

    return userMapper.toDomain(entity);
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByLoginId(LoginId loginId) {
    if (loginId == null) {
      throw new IllegalArgumentException("LoginId cannot be null");
    }

    return jpaRepository.existsByLoginId(loginId.getValue());
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<User> findById(UserId userId) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }

    return jpaRepository.findById(userId.getValue()).map(userMapper::toDomain);
  }

  @Override
  public void deleteById(UserId userId) {
    if (userId == null) {
      throw new IllegalArgumentException("UserId cannot be null");
    }

    jpaRepository.deleteById(userId.getValue());
  }
}
