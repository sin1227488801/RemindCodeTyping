package com.rct.domain.model.typingsession;

import static org.assertj.core.api.Assertions.*;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class TypingSessionIdTest {

  @Test
  void shouldCreateTypingSessionIdWithValidUUID() {
    // Given
    UUID uuid = UUID.randomUUID();

    // When
    TypingSessionId typingSessionId = TypingSessionId.of(uuid);

    // Then
    assertThat(typingSessionId.getValue()).isEqualTo(uuid);
  }

  @Test
  void shouldGenerateUniqueTypingSessionIds() {
    // When
    TypingSessionId id1 = TypingSessionId.generate();
    TypingSessionId id2 = TypingSessionId.generate();

    // Then
    assertThat(id1).isNotEqualTo(id2);
    assertThat(id1.getValue()).isNotEqualTo(id2.getValue());
  }

  @Test
  void shouldCreateTypingSessionIdFromValidString() {
    // Given
    String uuidString = "123e4567-e89b-12d3-a456-426614174000";

    // When
    TypingSessionId typingSessionId = TypingSessionId.fromString(uuidString);

    // Then
    assertThat(typingSessionId.getValue().toString()).isEqualTo(uuidString);
  }

  @Test
  void shouldThrowExceptionWhenCreatingWithNullUUID() {
    // When & Then
    assertThatThrownBy(() -> TypingSessionId.of(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("TypingSessionId cannot be null");
  }

  @Test
  void shouldThrowExceptionWhenCreatingFromNullString() {
    // When & Then
    assertThatThrownBy(() -> TypingSessionId.fromString(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("TypingSessionId string cannot be null");
  }

  @Test
  void shouldThrowExceptionWhenCreatingFromInvalidString() {
    // Given
    String invalidUuidString = "invalid-uuid";

    // When & Then
    assertThatThrownBy(() -> TypingSessionId.fromString(invalidUuidString))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Invalid TypingSessionId format: " + invalidUuidString);
  }

  @Test
  void shouldBeEqualWhenSameUUID() {
    // Given
    UUID uuid = UUID.randomUUID();
    TypingSessionId id1 = TypingSessionId.of(uuid);
    TypingSessionId id2 = TypingSessionId.of(uuid);

    // When & Then
    assertThat(id1).isEqualTo(id2);
    assertThat(id1.hashCode()).isEqualTo(id2.hashCode());
  }

  @Test
  void shouldNotBeEqualWhenDifferentUUID() {
    // Given
    TypingSessionId id1 = TypingSessionId.generate();
    TypingSessionId id2 = TypingSessionId.generate();

    // When & Then
    assertThat(id1).isNotEqualTo(id2);
  }

  @Test
  void shouldNotBeEqualToNull() {
    // Given
    TypingSessionId id = TypingSessionId.generate();

    // When & Then
    assertThat(id).isNotEqualTo(null);
  }

  @Test
  void shouldNotBeEqualToDifferentType() {
    // Given
    TypingSessionId id = TypingSessionId.generate();
    String notAnId = "not-an-id";

    // When & Then
    assertThat(id).isNotEqualTo(notAnId);
  }

  @Test
  void shouldReturnUUIDStringInToString() {
    // Given
    UUID uuid = UUID.randomUUID();
    TypingSessionId id = TypingSessionId.of(uuid);

    // When
    String result = id.toString();

    // Then
    assertThat(result).isEqualTo(uuid.toString());
  }
}
