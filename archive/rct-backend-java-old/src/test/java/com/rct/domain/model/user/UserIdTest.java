package com.rct.domain.model.user;

import static org.assertj.core.api.Assertions.*;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class UserIdTest {

  @Test
  void shouldCreateUserIdFromUUID() {
    // Given
    UUID uuid = UUID.randomUUID();

    // When
    UserId userId = UserId.of(uuid);

    // Then
    assertThat(userId.getValue()).isEqualTo(uuid);
  }

  @Test
  void shouldGenerateRandomUserId() {
    // When
    UserId userId1 = UserId.generate();
    UserId userId2 = UserId.generate();

    // Then
    assertThat(userId1).isNotEqualTo(userId2);
    assertThat(userId1.getValue()).isNotNull();
    assertThat(userId2.getValue()).isNotNull();
  }

  @Test
  void shouldCreateUserIdFromString() {
    // Given
    String uuidString = "123e4567-e89b-12d3-a456-426614174000";

    // When
    UserId userId = UserId.fromString(uuidString);

    // Then
    assertThat(userId.getValue().toString()).isEqualTo(uuidString);
  }

  @Test
  void shouldThrowExceptionForNullUUID() {
    // When & Then
    assertThatThrownBy(() -> UserId.of(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("UserId cannot be null");
  }

  @Test
  void shouldThrowExceptionForNullString() {
    // When & Then
    assertThatThrownBy(() -> UserId.fromString(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("UserId string cannot be null");
  }

  @Test
  void shouldThrowExceptionForInvalidUUIDString() {
    // Given
    String invalidUuid = "invalid-uuid";

    // When & Then
    assertThatThrownBy(() -> UserId.fromString(invalidUuid))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Invalid UserId format: " + invalidUuid);
  }

  @Test
  void shouldImplementEqualsAndHashCodeCorrectly() {
    // Given
    UUID uuid = UUID.randomUUID();
    UserId userId1 = UserId.of(uuid);
    UserId userId2 = UserId.of(uuid);
    UserId userId3 = UserId.of(UUID.randomUUID());

    // Then
    assertThat(userId1).isEqualTo(userId2);
    assertThat(userId1).isNotEqualTo(userId3);
    assertThat(userId1.hashCode()).isEqualTo(userId2.hashCode());
    assertThat(userId1.hashCode()).isNotEqualTo(userId3.hashCode());
  }

  @Test
  void shouldImplementToStringCorrectly() {
    // Given
    UUID uuid = UUID.randomUUID();
    UserId userId = UserId.of(uuid);

    // When & Then
    assertThat(userId.toString()).isEqualTo(uuid.toString());
  }
}
