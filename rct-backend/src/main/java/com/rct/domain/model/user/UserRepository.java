package com.rct.domain.model.user;

import java.util.Optional;

/**
 * Repository interface for User domain entity. Defines the contract for User data access without
 * implementation details.
 *
 * <p>This interface follows the Repository pattern from Domain-Driven Design, providing a
 * collection-like interface for accessing User aggregates.
 */
public interface UserRepository {

  /**
   * Finds a user by their login ID.
   *
   * @param loginId the login ID to search for
   * @return an Optional containing the User if found, empty otherwise
   * @throws IllegalArgumentException if loginId is null
   */
  Optional<User> findByLoginId(LoginId loginId);

  /**
   * Saves a user to the repository. This method handles both creation of new users and updates to
   * existing users.
   *
   * @param user the user to save
   * @return the saved user (may include generated ID for new users)
   * @throws IllegalArgumentException if user is null
   */
  User save(User user);

  /**
   * Checks if a user with the given login ID already exists.
   *
   * @param loginId the login ID to check
   * @return true if a user with this login ID exists, false otherwise
   * @throws IllegalArgumentException if loginId is null
   */
  boolean existsByLoginId(LoginId loginId);

  /**
   * Finds a user by their unique ID.
   *
   * @param userId the user ID to search for
   * @return an Optional containing the User if found, empty otherwise
   * @throws IllegalArgumentException if userId is null
   */
  Optional<User> findById(UserId userId);

  /**
   * Deletes a user from the repository.
   *
   * @param userId the ID of the user to delete
   * @throws IllegalArgumentException if userId is null
   */
  void deleteById(UserId userId);
}
