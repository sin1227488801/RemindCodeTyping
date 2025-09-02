package com.rct.domain.model.studybook;

import static org.assertj.core.api.Assertions.*;

import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("StudyBookId Value Object Tests")
class StudyBookIdTest {

  @Nested
  @DisplayName("Creation Tests")
  class CreationTests {

    @Test
    @DisplayName("Should create StudyBookId with valid UUID")
    void shouldCreateStudyBookIdWithValidUuid() {
      // Given
      UUID uuid = UUID.randomUUID();

      // When
      StudyBookId studyBookId = new StudyBookId(uuid);

      // Then
      assertThat(studyBookId.getValue()).isEqualTo(uuid);
    }

    @Test
    @DisplayName("Should throw exception when creating with null UUID")
    void shouldThrowExceptionWhenCreatingWithNullUuid() {
      // When & Then
      assertThatThrownBy(() -> new StudyBookId(null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("StudyBook ID cannot be null");
    }
  }

  @Nested
  @DisplayName("Factory Method Tests")
  class FactoryMethodTests {

    @Test
    @DisplayName("Should generate new StudyBookId")
    void shouldGenerateNewStudyBookId() {
      // When
      StudyBookId studyBookId = StudyBookId.generate();

      // Then
      assertThat(studyBookId).isNotNull();
      assertThat(studyBookId.getValue()).isNotNull();
    }

    @Test
    @DisplayName("Should generate unique StudyBookIds")
    void shouldGenerateUniqueStudyBookIds() {
      // When
      StudyBookId studyBookId1 = StudyBookId.generate();
      StudyBookId studyBookId2 = StudyBookId.generate();

      // Then
      assertThat(studyBookId1).isNotEqualTo(studyBookId2);
      assertThat(studyBookId1.getValue()).isNotEqualTo(studyBookId2.getValue());
    }

    @Test
    @DisplayName("Should create StudyBookId from string")
    void shouldCreateStudyBookIdFromString() {
      // Given
      UUID uuid = UUID.randomUUID();
      String uuidString = uuid.toString();

      // When
      StudyBookId studyBookId = StudyBookId.fromString(uuidString);

      // Then
      assertThat(studyBookId.getValue()).isEqualTo(uuid);
    }

    @Test
    @DisplayName("Should throw exception when creating from invalid string")
    void shouldThrowExceptionWhenCreatingFromInvalidString() {
      // Given
      String invalidUuid = "not-a-valid-uuid";

      // When & Then
      assertThatThrownBy(() -> StudyBookId.fromString(invalidUuid))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Invalid UUID string: " + invalidUuid);
    }

    @Test
    @DisplayName("Should throw exception when creating from null string")
    void shouldThrowExceptionWhenCreatingFromNullString() {
      // When & Then
      assertThatThrownBy(() -> StudyBookId.fromString(null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("UUID string cannot be null");
    }

    @Test
    @DisplayName("Should throw exception when creating from empty string")
    void shouldThrowExceptionWhenCreatingFromEmptyString() {
      // When & Then
      assertThatThrownBy(() -> StudyBookId.fromString(""))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("UUID string cannot be null");
    }
  }

  @Nested
  @DisplayName("Equality and Hash Code Tests")
  class EqualityTests {

    @Test
    @DisplayName("Should be equal when UUIDs are equal")
    void shouldBeEqualWhenUuidsAreEqual() {
      // Given
      UUID uuid = UUID.randomUUID();
      StudyBookId studyBookId1 = new StudyBookId(uuid);
      StudyBookId studyBookId2 = new StudyBookId(uuid);

      // When & Then
      assertThat(studyBookId1).isEqualTo(studyBookId2);
      assertThat(studyBookId1.hashCode()).isEqualTo(studyBookId2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal when UUIDs are different")
    void shouldNotBeEqualWhenUuidsAreDifferent() {
      // Given
      StudyBookId studyBookId1 = new StudyBookId(UUID.randomUUID());
      StudyBookId studyBookId2 = new StudyBookId(UUID.randomUUID());

      // When & Then
      assertThat(studyBookId1).isNotEqualTo(studyBookId2);
    }

    @Test
    @DisplayName("Should not be equal to null or different class")
    void shouldNotBeEqualToNullOrDifferentClass() {
      // Given
      StudyBookId studyBookId = new StudyBookId(UUID.randomUUID());

      // When & Then
      assertThat(studyBookId).isNotEqualTo(null);
      assertThat(studyBookId).isNotEqualTo(UUID.randomUUID());
    }

    @Test
    @DisplayName("Should be equal to itself")
    void shouldBeEqualToItself() {
      // Given
      StudyBookId studyBookId = new StudyBookId(UUID.randomUUID());

      // When & Then
      assertThat(studyBookId).isEqualTo(studyBookId);
    }
  }

  @Nested
  @DisplayName("String Representation Tests")
  class StringRepresentationTests {

    @Test
    @DisplayName("Should provide meaningful string representation")
    void shouldProvideMeaningfulStringRepresentation() {
      // Given
      UUID uuid = UUID.randomUUID();
      StudyBookId studyBookId = new StudyBookId(uuid);

      // When
      String toString = studyBookId.toString();

      // Then
      assertThat(toString).contains("StudyBookId");
      assertThat(toString).contains(uuid.toString());
    }

    @Test
    @DisplayName("Should return UUID string representation")
    void shouldReturnUuidStringRepresentation() {
      // Given
      UUID uuid = UUID.randomUUID();
      StudyBookId studyBookId = new StudyBookId(uuid);

      // When
      String asString = studyBookId.asString();

      // Then
      assertThat(asString).isEqualTo(uuid.toString());
    }
  }

  @Nested
  @DisplayName("Comparison Tests")
  class ComparisonTests {

    @Test
    @DisplayName("Should implement Comparable interface correctly")
    void shouldImplementComparableInterfaceCorrectly() {
      // Given
      UUID uuid1 = UUID.fromString("00000000-0000-0000-0000-000000000001");
      UUID uuid2 = UUID.fromString("00000000-0000-0000-0000-000000000002");
      StudyBookId studyBookId1 = new StudyBookId(uuid1);
      StudyBookId studyBookId2 = new StudyBookId(uuid2);

      // When
      int comparison = studyBookId1.compareTo(studyBookId2);

      // Then
      assertThat(comparison).isLessThan(0);
    }

    @Test
    @DisplayName("Should return zero when comparing equal StudyBookIds")
    void shouldReturnZeroWhenComparingEqualStudyBookIds() {
      // Given
      UUID uuid = UUID.randomUUID();
      StudyBookId studyBookId1 = new StudyBookId(uuid);
      StudyBookId studyBookId2 = new StudyBookId(uuid);

      // When
      int comparison = studyBookId1.compareTo(studyBookId2);

      // Then
      assertThat(comparison).isEqualTo(0);
    }

    @Test
    @DisplayName("Should throw exception when comparing with null")
    void shouldThrowExceptionWhenComparingWithNull() {
      // Given
      StudyBookId studyBookId = new StudyBookId(UUID.randomUUID());

      // When & Then
      assertThatThrownBy(() -> studyBookId.compareTo(null))
          .isInstanceOf(NullPointerException.class);
    }
  }

  @Nested
  @DisplayName("Business Logic Tests")
  class BusinessLogicTests {

    @Test
    @DisplayName("Should maintain immutability")
    void shouldMaintainImmutability() {
      // Given
      UUID originalUuid = UUID.randomUUID();
      StudyBookId studyBookId = new StudyBookId(originalUuid);

      // When
      UUID retrievedUuid = studyBookId.getValue();

      // Then
      assertThat(retrievedUuid).isEqualTo(originalUuid);
      // Verify that the UUID reference is the same (no defensive copying needed for UUID)
      assertThat(retrievedUuid).isSameAs(originalUuid);
    }

    @Test
    @DisplayName("Should be usable as map key")
    void shouldBeUsableAsMapKey() {
      // Given
      StudyBookId studyBookId1 = StudyBookId.generate();
      StudyBookId studyBookId2 = StudyBookId.generate();
      java.util.Map<StudyBookId, String> map = new java.util.HashMap<>();

      // When
      map.put(studyBookId1, "value1");
      map.put(studyBookId2, "value2");

      // Then
      assertThat(map.get(studyBookId1)).isEqualTo("value1");
      assertThat(map.get(studyBookId2)).isEqualTo("value2");
      assertThat(map).hasSize(2);
    }

    @Test
    @DisplayName("Should be usable in sets")
    void shouldBeUsableInSets() {
      // Given
      StudyBookId studyBookId1 = StudyBookId.generate();
      StudyBookId studyBookId2 = StudyBookId.generate();
      StudyBookId studyBookId1Duplicate = new StudyBookId(studyBookId1.getValue());
      java.util.Set<StudyBookId> set = new java.util.HashSet<>();

      // When
      set.add(studyBookId1);
      set.add(studyBookId2);
      set.add(studyBookId1Duplicate);

      // Then
      assertThat(set).hasSize(2);
      assertThat(set).contains(studyBookId1);
      assertThat(set).contains(studyBookId2);
      assertThat(set).contains(studyBookId1Duplicate);
    }
  }
}
