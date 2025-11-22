package com.rct.domain.model.user;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class LoginStatisticsTest {

  @Test
  void shouldCreateInitialLoginStatistics() {
    // When
    LoginStatistics stats = LoginStatistics.initial();

    // Then
    assertThat(stats.getLastLoginDate()).isNull();
    assertThat(stats.getConsecutiveDays()).isZero();
    assertThat(stats.getMaxConsecutiveDays()).isZero();
    assertThat(stats.getTotalDays()).isZero();
    assertThat(stats.hasLoggedInToday()).isFalse();
  }

  @Test
  void shouldCreateLoginStatisticsWithValues() {
    // Given
    LocalDate date = LocalDate.of(2024, 1, 15);

    // When
    LoginStatistics stats = LoginStatistics.of(date, 5, 10, 20);

    // Then
    assertThat(stats.getLastLoginDate()).isEqualTo(date);
    assertThat(stats.getConsecutiveDays()).isEqualTo(5);
    assertThat(stats.getMaxConsecutiveDays()).isEqualTo(10);
    assertThat(stats.getTotalDays()).isEqualTo(20);
  }

  @Test
  void shouldUpdateForFirstLogin() {
    // Given
    LoginStatistics initial = LoginStatistics.initial();
    LocalDate loginDate = LocalDate.of(2024, 1, 15);

    // When
    LoginStatistics updated = initial.updateForLogin(loginDate);

    // Then
    assertThat(updated.getLastLoginDate()).isEqualTo(loginDate);
    assertThat(updated.getConsecutiveDays()).isEqualTo(1);
    assertThat(updated.getMaxConsecutiveDays()).isEqualTo(1);
    assertThat(updated.getTotalDays()).isEqualTo(1);
  }

  @Test
  void shouldUpdateForConsecutiveLogin() {
    // Given
    LocalDate firstDate = LocalDate.of(2024, 1, 15);
    LoginStatistics stats = LoginStatistics.of(firstDate, 1, 1, 1);
    LocalDate secondDate = firstDate.plusDays(1);

    // When
    LoginStatistics updated = stats.updateForLogin(secondDate);

    // Then
    assertThat(updated.getLastLoginDate()).isEqualTo(secondDate);
    assertThat(updated.getConsecutiveDays()).isEqualTo(2);
    assertThat(updated.getMaxConsecutiveDays()).isEqualTo(2);
    assertThat(updated.getTotalDays()).isEqualTo(2);
  }

  @Test
  void shouldResetConsecutiveDaysAfterGap() {
    // Given
    LocalDate firstDate = LocalDate.of(2024, 1, 15);
    LoginStatistics stats = LoginStatistics.of(firstDate, 5, 5, 10);
    LocalDate gapDate = firstDate.plusDays(3); // 2-day gap

    // When
    LoginStatistics updated = stats.updateForLogin(gapDate);

    // Then
    assertThat(updated.getLastLoginDate()).isEqualTo(gapDate);
    assertThat(updated.getConsecutiveDays()).isEqualTo(1); // Reset to 1
    assertThat(updated.getMaxConsecutiveDays()).isEqualTo(5); // Preserved
    assertThat(updated.getTotalDays()).isEqualTo(11); // Incremented
  }

  @Test
  void shouldNotChangeForSameDayLogin() {
    // Given
    LocalDate date = LocalDate.of(2024, 1, 15);
    LoginStatistics stats = LoginStatistics.of(date, 3, 5, 10);

    // When
    LoginStatistics updated = stats.updateForLogin(date);

    // Then
    assertThat(updated).isEqualTo(stats); // No change
  }

  @Test
  void shouldUpdateMaxConsecutiveDaysWhenExceeded() {
    // Given
    LocalDate firstDate = LocalDate.of(2024, 1, 15);
    LoginStatistics stats = LoginStatistics.of(firstDate, 4, 4, 10);
    LocalDate nextDate = firstDate.plusDays(1);

    // When
    LoginStatistics updated = stats.updateForLogin(nextDate);

    // Then
    assertThat(updated.getConsecutiveDays()).isEqualTo(5);
    assertThat(updated.getMaxConsecutiveDays()).isEqualTo(5); // Updated
  }

  @Test
  void shouldThrowExceptionForNullLoginDate() {
    // Given
    LoginStatistics stats = LoginStatistics.initial();

    // When & Then
    assertThatThrownBy(() -> stats.updateForLogin(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Login date cannot be null");
  }

  @Test
  void shouldThrowExceptionForPastLoginDate() {
    // Given
    LocalDate currentDate = LocalDate.of(2024, 1, 15);
    LoginStatistics stats = LoginStatistics.of(currentDate, 1, 1, 1);
    LocalDate pastDate = currentDate.minusDays(1);

    // When & Then
    assertThatThrownBy(() -> stats.updateForLogin(pastDate))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Login date cannot be before last login date");
  }

  @Test
  void shouldThrowExceptionForNegativeValues() {
    // When & Then
    assertThatThrownBy(() -> LoginStatistics.of(LocalDate.now(), -1, 0, 0))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("consecutiveDays cannot be negative");

    assertThatThrownBy(() -> LoginStatistics.of(LocalDate.now(), 0, -1, 0))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("maxConsecutiveDays cannot be negative");

    assertThatThrownBy(() -> LoginStatistics.of(LocalDate.now(), 0, 0, -1))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("totalDays cannot be negative");
  }

  @Test
  void shouldThrowExceptionWhenMaxConsecutiveDaysLessThanConsecutiveDays() {
    // When & Then
    assertThatThrownBy(() -> LoginStatistics.of(LocalDate.now(), 5, 3, 10))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("maxConsecutiveDays cannot be less than consecutiveDays");
  }

  @Test
  void shouldImplementEqualsAndHashCodeCorrectly() {
    // Given
    LocalDate date = LocalDate.of(2024, 1, 15);
    LoginStatistics stats1 = LoginStatistics.of(date, 3, 5, 10);
    LoginStatistics stats2 = LoginStatistics.of(date, 3, 5, 10);
    LoginStatistics stats3 = LoginStatistics.of(date, 4, 5, 10);

    // Then
    assertThat(stats1).isEqualTo(stats2);
    assertThat(stats1).isNotEqualTo(stats3);
    assertThat(stats1.hashCode()).isEqualTo(stats2.hashCode());
    assertThat(stats1.hashCode()).isNotEqualTo(stats3.hashCode());
  }

  @Test
  void shouldImplementToStringCorrectly() {
    // Given
    LocalDate date = LocalDate.of(2024, 1, 15);
    LoginStatistics stats = LoginStatistics.of(date, 3, 5, 10);

    // When
    String toString = stats.toString();

    // Then
    assertThat(toString).contains("lastLoginDate=2024-01-15");
    assertThat(toString).contains("consecutiveDays=3");
    assertThat(toString).contains("maxConsecutiveDays=5");
    assertThat(toString).contains("totalDays=10");
  }
}
