package com.rct.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.rct.domain.model.user.User;
import com.rct.entity.StudyBook;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for TestDataBuilder utility class. Demonstrates proper unit testing practices with the
 * builder pattern.
 */
class TestDataBuilderTest {

  @Test
  void shouldBuildUserWithDefaults() {
    // When
    User user = TestDataBuilder.user().build();

    // Then
    assertThat(user.getLoginId()).isEqualTo("testuser");
    assertThat(user.getPassword()).isEqualTo("password123");
    assertThat(user.getConsecutiveLoginDays()).isEqualTo(1);
    assertThat(user.getMaxConsecutiveLoginDays()).isEqualTo(5);
    assertThat(user.getTotalLoginDays()).isEqualTo(10);
  }

  @Test
  void shouldBuildUserWithCustomValues() {
    // Given
    LocalDate customDate = LocalDate.of(2024, 1, 15);

    // When
    User user =
        TestDataBuilder.user()
            .withId(100L)
            .withLoginId("customuser")
            .withPassword("custompass")
            .withLastLoginDate(customDate)
            .withConsecutiveLoginDays(7)
            .withMaxConsecutiveLoginDays(15)
            .withTotalLoginDays(30)
            .build();

    // Then
    assertThat(user.getId()).isEqualTo(100L);
    assertThat(user.getLoginId()).isEqualTo("customuser");
    assertThat(user.getPassword()).isEqualTo("custompass");
    assertThat(user.getLastLoginDate()).isEqualTo(customDate);
    assertThat(user.getConsecutiveLoginDays()).isEqualTo(7);
    assertThat(user.getMaxConsecutiveLoginDays()).isEqualTo(15);
    assertThat(user.getTotalLoginDays()).isEqualTo(30);
  }

  @Test
  void shouldBuildStudyBookWithDefaults() {
    // When
    StudyBook studyBook = TestDataBuilder.studyBook().build();

    // Then
    assertThat(studyBook.getUserId()).isEqualTo(1L);
    assertThat(studyBook.getLanguage()).isEqualTo("Java");
    assertThat(studyBook.getQuestion()).isEqualTo("System.out.println(\"Hello World\");");
    assertThat(studyBook.getExplanation()).isEqualTo("Basic Java print statement");
    assertThat(studyBook.getIsSystemProblem()).isFalse();
  }

  @Test
  void shouldBuildStudyBookAsSystemProblem() {
    // When
    StudyBook studyBook = TestDataBuilder.studyBook().asSystemProblem().build();

    // Then
    assertThat(studyBook.getIsSystemProblem()).isTrue();
  }

  @Test
  void shouldBuildStudyBookAsUserProblem() {
    // When
    StudyBook studyBook = TestDataBuilder.studyBook().asUserProblem().build();

    // Then
    assertThat(studyBook.getIsSystemProblem()).isFalse();
  }

  @Test
  void shouldBuildStudyBookWithCustomValues() {
    // When
    StudyBook studyBook =
        TestDataBuilder.studyBook()
            .withId(200L)
            .withUserId(50L)
            .withLanguage("JavaScript")
            .withQuestion("console.log('Hello');")
            .withExplanation("JavaScript console output")
            .asSystemProblem()
            .build();

    // Then
    assertThat(studyBook.getId()).isEqualTo(200L);
    assertThat(studyBook.getUserId()).isEqualTo(50L);
    assertThat(studyBook.getLanguage()).isEqualTo("JavaScript");
    assertThat(studyBook.getQuestion()).isEqualTo("console.log('Hello');");
    assertThat(studyBook.getExplanation()).isEqualTo("JavaScript console output");
    assertThat(studyBook.getIsSystemProblem()).isTrue();
  }
}
