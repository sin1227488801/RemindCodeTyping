package com.rct.infrastructure.persistence.repository;

import static org.assertj.core.api.Assertions.*;

import com.rct.domain.model.user.*;
import com.rct.infrastructure.persistence.BaseRepositoryIntegrationTest;
import com.rct.infrastructure.persistence.mapper.UserMapper;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

/**
 * Integration tests for JpaUserRepositoryImpl using TestContainers with PostgreSQL. These tests
 * verify the repository implementation against a real database.
 */
@Import({JpaUserRepositoryImpl.class, UserMapper.class})
@DisplayName("JpaUserRepositoryImpl Integration Tests")
class JpaUserRepositoryImplIntegrationTest extends BaseRepositoryIntegrationTest {

  @Autowired private TestEntityManager entityManager;

  @Autowired private JpaUserEntityRepository jpaUserEntityRepository;

  @Autowired private JpaUserRepositoryImpl userRepository;

  private User testUser;
  private LoginId testLoginId;
  private PasswordHash testPasswordHash;

  @BeforeEach
  void setUpTestData() {
    testLoginId = new LoginId("testuser");
    testPasswordHash = new PasswordHash("hashedpassword123");
    testUser = User.create(new UserId(UUID.randomUUID()), testLoginId, testPasswordHash);
  }

  @Test
  @DisplayName("Should save new user and generate ID")
  void shouldSaveNewUserAndGenerateId() {
    // Given
    User newUser = User.create(new UserId(null), testLoginId, testPasswordHash);

    // When
    User savedUser = userRepository.save(newUser);

    // Then
    assertThat(savedUser).isNotNull();
    assertThat(savedUser.getId().getValue()).isNotNull();
    assertThat(savedUser.getLoginId()).isEqualTo(testLoginId);
    assertThat(savedUser.getPasswordHash()).isEqualTo(testPasswordHash);
    assertThat(savedUser.getCreatedAt()).isNotNull();
    assertThat(savedUser.getUpdatedAt()).isNotNull();

    // Verify in database
    entityManager.flush();
    entityManager.clear();

    Optional<User> foundUser = userRepository.findById(savedUser.getId());
    assertThat(foundUser).isPresent();
    assertThat(foundUser.get().getLoginId()).isEqualTo(testLoginId);
  }

  @Test
  @DisplayName("Should find user by login ID")
  void shouldFindUserByLoginId() {
    // Given
    User savedUser = userRepository.save(testUser);
    entityManager.flush();
    entityManager.clear();

    // When
    Optional<User> foundUser = userRepository.findByLoginId(testLoginId);

    // Then
    assertThat(foundUser).isPresent();
    assertThat(foundUser.get().getId()).isEqualTo(savedUser.getId());
    assertThat(foundUser.get().getLoginId()).isEqualTo(testLoginId);
    assertThat(foundUser.get().getPasswordHash()).isEqualTo(testPasswordHash);
  }

  @Test
  @DisplayName("Should return empty when user not found by login ID")
  void shouldReturnEmptyWhenUserNotFoundByLoginId() {
    // Given
    LoginId nonExistentLoginId = new LoginId("nonexistent");

    // When
    Optional<User> foundUser = userRepository.findByLoginId(nonExistentLoginId);

    // Then
    assertThat(foundUser).isEmpty();
  }

  @Test
  @DisplayName("Should check if user exists by login ID")
  void shouldCheckIfUserExistsByLoginId() {
    // Given
    userRepository.save(testUser);
    entityManager.flush();

    // When & Then
    assertThat(userRepository.existsByLoginId(testLoginId)).isTrue();
    assertThat(userRepository.existsByLoginId(new LoginId("nonexistent"))).isFalse();
  }

  @Test
  @DisplayName("Should update existing user")
  void shouldUpdateExistingUser() {
    // Given
    User savedUser = userRepository.save(testUser);
    entityManager.flush();
    entityManager.clear();

    // Record a login to update statistics
    savedUser.recordLogin(LocalDate.now());

    // When
    User updatedUser = userRepository.save(savedUser);

    // Then
    assertThat(updatedUser.getId()).isEqualTo(savedUser.getId());
    assertThat(updatedUser.getTotalLoginDays()).isEqualTo(1);
    assertThat(updatedUser.getCurrentLoginStreak()).isEqualTo(1);

    // Verify in database
    entityManager.flush();
    entityManager.clear();

    Optional<User> foundUser = userRepository.findById(savedUser.getId());
    assertThat(foundUser).isPresent();
    assertThat(foundUser.get().getTotalLoginDays()).isEqualTo(1);
  }

  @Test
  @DisplayName("Should find user by ID")
  void shouldFindUserById() {
    // Given
    User savedUser = userRepository.save(testUser);
    entityManager.flush();
    entityManager.clear();

    // When
    Optional<User> foundUser = userRepository.findById(savedUser.getId());

    // Then
    assertThat(foundUser).isPresent();
    assertThat(foundUser.get().getId()).isEqualTo(savedUser.getId());
    assertThat(foundUser.get().getLoginId()).isEqualTo(testLoginId);
  }

  @Test
  @DisplayName("Should delete user by ID")
  void shouldDeleteUserById() {
    // Given
    User savedUser = userRepository.save(testUser);
    entityManager.flush();

    assertThat(userRepository.findById(savedUser.getId())).isPresent();

    // When
    userRepository.deleteById(savedUser.getId());
    entityManager.flush();

    // Then
    assertThat(userRepository.findById(savedUser.getId())).isEmpty();
  }

  @Test
  @DisplayName("Should throw exception when saving null user")
  void shouldThrowExceptionWhenSavingNullUser() {
    // When & Then
    assertThatThrownBy(() -> userRepository.save(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("User cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when finding by null login ID")
  void shouldThrowExceptionWhenFindingByNullLoginId() {
    // When & Then
    assertThatThrownBy(() -> userRepository.findByLoginId(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("LoginId cannot be null");
  }

  @Test
  @DisplayName("Should handle login statistics correctly")
  void shouldHandleLoginStatisticsCorrectly() {
    // Given
    User savedUser = userRepository.save(testUser);
    entityManager.flush();
    entityManager.clear();

    // Record consecutive logins
    LocalDate today = LocalDate.now();
    savedUser.recordLogin(today.minusDays(2));
    savedUser.recordLogin(today.minusDays(1));
    savedUser.recordLogin(today);

    // When
    User updatedUser = userRepository.save(savedUser);

    // Then
    assertThat(updatedUser.getTotalLoginDays()).isEqualTo(3);
    assertThat(updatedUser.getCurrentLoginStreak()).isEqualTo(3);
    assertThat(updatedUser.getMaxLoginStreak()).isEqualTo(3);

    // Verify persistence
    entityManager.flush();
    entityManager.clear();

    Optional<User> foundUser = userRepository.findById(savedUser.getId());
    assertThat(foundUser).isPresent();
    assertThat(foundUser.get().getTotalLoginDays()).isEqualTo(3);
    assertThat(foundUser.get().getCurrentLoginStreak()).isEqualTo(3);
  }
}
