package com.rct.infrastructure.persistence.repository;

import com.rct.infrastructure.persistence.entity.UserEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * JPA repository interface for UserEntity. This provides the basic CRUD operations and custom
 * queries for user persistence.
 */
@Repository
public interface JpaUserEntityRepository extends JpaRepository<UserEntity, UUID> {

  /**
   * Finds a user entity by login ID.
   *
   * @param loginId the login ID to search for
   * @return Optional containing the UserEntity if found, empty otherwise
   */
  Optional<UserEntity> findByLoginId(String loginId);

  /**
   * Checks if a user entity exists with the given login ID.
   *
   * @param loginId the login ID to check
   * @return true if a user with this login ID exists, false otherwise
   */
  boolean existsByLoginId(String loginId);
}
