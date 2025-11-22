package com.rct.domain.model.user;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class UserTest {

  private static final String VALID_BCRYPT_HASH =
      "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

  @Test
  void shouldCreateNewUser() {
    // Given
    UserId userId = UserId.generate();
    LoginId loginId = LoginId.of("testuser");
    PasswordHash passwordHash = PasswordHash.of(VALID_BCRYPT_HASH);

    // When
    User user = User.create(userId, loginId, passwordHash);

    // Then
    assertThat(user.getId()).isEqualTo(userId);
    assertThat(user.getLoginId()).isEqualTo(loginId);
    assertThat(user.getPasswordHash()).isEqualTo(passwordHash);
    assertThat(user.getLoginStatistics()).isEqualTo(LoginStatistics.initial());
    assertThat(user.getCreatedAt()).isNotNull();
    assertThat(user.getUpdatedAt()).isNotNull();
    assertThat(user.getCurrentLoginStreak()).isZero();
    assertThat(user.getMaxLoginStreak()).isZero();
    assertThat(user.getTotalLoginDays()).isZero();
    assertThat(user.hasLoggedInToday()).isFalse();
  }

  @Test
  void shouldReconstructUserFromPersistence() {
    // Given
    UserId userId = UserId.generate();
    LoginId loginId = LoginId.of("testuser");
    PasswordHash passwordHash = PasswordHash.of(VALID_BCRYPT_HASH);
    LoginStatistics loginStats = LoginStatistics.of(LocalDate.now(), 5, 10, 20);
    LocalDateTime createdAt = LocalDateTime.now().minusDays(30);
    LocalDateTime updatedAt = LocalDateTime.now().minusDays(1);

    // When
    User user = User.reconstruct(userId, loginId, passwordHash, loginStats, createdAt, updatedAt);

    // Then
    assertThat(user.getId()).isEqualTo(userId);
    assertThat(user.getLoginId()).isEqualTo(loginId);
    assertThat(user.getPasswordHash()).isEqualTo(passwordHash);
    assertThat(user.getLoginStatistics()).isEqualTo(loginStats);
    assertThat(user.getCreatedAt()).isEqualTo(createdAt);
    assertThat(user.getUpdatedAt()).isEqualTo(updatedAt);
  }

  @Test
  void shouldRecordFirstLogin() {
    // Given
    User user = createTestUser();
    LocalDate loginDate = LocalDate.of(2024, 1, 15);
    LocalDateTime beforeUpdate = user.getUpdatedAt();

    // When
    user.recordLogin(loginDate);

    // Then
    assertThat(user.getCurrentLoginStreak()).isEqualTo(1);
    assertThat(user.getMaxLoginStreak()).isEqualTo(1);
    assertThat(user.getTotalLoginDays()).isEqualTo(1);
    assertThat(user.getLoginStatistics().getLastLoginDate()).isEqualTo(loginDate);
    assertThat(user.getUpdatedAt()).isAfter(beforeUpdate);
  }

  @Test
  void shouldRecordConsecutiveLogins() {
    // Given
    User user = createTestUser();
    LocalDate firstLogin = LocalDate.of(2024, 1, 15);
    LocalDate secondLogin = firstLogin.plusDays(1);
    LocalDate thirdLogin = secondLogin.plusDays(1);

    // When
    user.recordLogin(firstLogin);
    user.recordLogin(secondLogin);
    user.recordLogin(thirdLogin);

    // Then
    assertThat(user.getCurrentLoginStreak()).isEqualTo(3);
    assertThat(user.getMaxLoginStreak()).isEqualTo(3);
    assertThat(user.getTotalLoginDays()).isEqualTo(3);
  }

  @Test
  void shouldResetStreakAfterGap() {
    // Given
    User user = createTestUser();
    LocalDate firstLogin = LocalDate.of(2024, 1, 15);
    LocalDate secondLogin = firstLogin.plusDays(1);
    LocalDate thirdLogin = secondLogin.plusDays(2); // Gap of 1 day

    // When
    user.recordLogin(firstLogin);
    user.recordLogin(secondLogin);
    user.recordLogin(thirdLogin);

    // Then
    assertThat(user.getCurrentLoginStreak()).isEqualTo(1); // Reset
    assertThat(user.getMaxLoginStreak()).isEqualTo(2); // Preserved
    assertThat(user.getTotalLoginDays()).isEqualTo(3); // Still incremented
  }

  @Test
  void shouldCheckLoginIdMatch() {
    // Given
    LoginId loginId = LoginId.of("testuser");
    User user = createTestUserWithLoginId(loginId);
    LoginId sameLoginId = LoginId.of("testuser");
    LoginId differentLoginId = LoginId.of("otheruser");

    // When & Then
    assertThat(user.hasLoginId(sameLoginId)).isTrue();
    assertThat(user.hasLoginId(differentLoginId)).isFalse();
  }

  @Test
  void shouldThrowExceptionForNullParameters() {
    // Given
    UserId userId = UserId.generate();
    LoginId loginId = LoginId.of("testuser");
    PasswordHash passwordHash = PasswordHash.of(VALID_BCRYPT_HASH);

    // When & Then
    assertThatThrownBy(() -> User.create(null, loginId, passwordHash))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("User ID cannot be null");

    assertThatThrownBy(() -> User.create(userId, null, passwordHash))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Login ID cannot be null");

    assertThatThrownBy(() -> User.create(userId, loginId, null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Password hash cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullLoginDate() {
    // Given
    User user = createTestUser();

    // When & Then
    assertThatThrownBy(() -> user.recordLogin(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Login date cannot be null");
  }

  @Test
  void shouldImplementEqualsBasedOnId() {
    // Given
    UserId userId = UserId.generate();
    User user1 = createTestUserWithId(userId);
    User user2 = createTestUserWithId(userId);
    User user3 = createTestUserWithId(UserId.generate());

    // Then
    assertThat(user1).isEqualTo(user2);
    assertThat(user1).isNotEqualTo(user3);
    assertThat(user1.hashCode()).isEqualTo(user2.hashCode());
    assertThat(user1.hashCode()).isNotEqualTo(user3.hashCode());
  }

  @Test
  void shouldImplementToStringWithoutSensitiveData() {
    // Given
    User user = createTestUser();

    // When
    String toString = user.toString();

    // Then
    assertThat(toString).contains("User{");
    assertThat(toString).contains("id=");
    assertThat(toString).contains("loginId=");
    assertThat(toString).contains("loginStatistics=");
    assertThat(toString).doesNotContain(VALID_BCRYPT_HASH); // Should not expose password hash
  }

  private User createTestUser() {
    return User.create(
        UserId.generate(), LoginId.of("testuser"), PasswordHash.of(VALID_BCRYPT_HASH));
  }

  private User createTestUserWithId(UserId userId) {
    return User.create(userId, LoginId.of("testuser"), PasswordHash.of(VALID_BCRYPT_HASH));
  }

  private User createTestUserWithLoginId(LoginId loginId) {
    return User.create(UserId.generate(), loginId, PasswordHash.of(VALID_BCRYPT_HASH));
  }
}
