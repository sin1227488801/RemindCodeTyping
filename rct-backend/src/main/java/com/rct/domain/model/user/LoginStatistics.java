package com.rct.domain.model.user;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Value object representing user login statistics. Encapsulates login tracking logic and business
 * rules.
 */
public final class LoginStatistics {
  private final LocalDate lastLoginDate;
  private final int consecutiveDays;
  private final int maxConsecutiveDays;
  private final int totalDays;

  private LoginStatistics(
      LocalDate lastLoginDate, int consecutiveDays, int maxConsecutiveDays, int totalDays) {
    this.lastLoginDate = lastLoginDate;
    this.consecutiveDays = validateNonNegative(consecutiveDays, "consecutiveDays");
    this.maxConsecutiveDays = validateNonNegative(maxConsecutiveDays, "maxConsecutiveDays");
    this.totalDays = validateNonNegative(totalDays, "totalDays");

    // Business rule: maxConsecutiveDays should be at least as large as consecutiveDays
    if (this.maxConsecutiveDays < this.consecutiveDays) {
      throw new IllegalArgumentException("maxConsecutiveDays cannot be less than consecutiveDays");
    }
  }

  public static LoginStatistics initial() {
    return new LoginStatistics(null, 0, 0, 0);
  }

  public static LoginStatistics of(
      LocalDate lastLoginDate, int consecutiveDays, int maxConsecutiveDays, int totalDays) {
    return new LoginStatistics(lastLoginDate, consecutiveDays, maxConsecutiveDays, totalDays);
  }

  /**
   * Updates login statistics for a new login date. Implements business logic for consecutive day
   * calculation.
   */
  public LoginStatistics updateForLogin(LocalDate loginDate) {
    Objects.requireNonNull(loginDate, "Login date cannot be null");

    if (lastLoginDate == null) {
      // First login
      return new LoginStatistics(loginDate, 1, 1, 1);
    }

    if (loginDate.equals(lastLoginDate)) {
      // Same day login - no change
      return this;
    }

    if (loginDate.isBefore(lastLoginDate)) {
      throw new IllegalArgumentException("Login date cannot be before last login date");
    }

    int newConsecutiveDays;
    int newTotalDays = totalDays + 1;

    if (loginDate.equals(lastLoginDate.plusDays(1))) {
      // Consecutive day
      newConsecutiveDays = consecutiveDays + 1;
    } else {
      // Gap in login days - reset consecutive count
      newConsecutiveDays = 1;
    }

    int newMaxConsecutiveDays = Math.max(maxConsecutiveDays, newConsecutiveDays);

    return new LoginStatistics(loginDate, newConsecutiveDays, newMaxConsecutiveDays, newTotalDays);
  }

  private int validateNonNegative(int value, String fieldName) {
    if (value < 0) {
      throw new IllegalArgumentException(fieldName + " cannot be negative");
    }
    return value;
  }

  public LocalDate getLastLoginDate() {
    return lastLoginDate;
  }

  public int getConsecutiveDays() {
    return consecutiveDays;
  }

  public int getMaxConsecutiveDays() {
    return maxConsecutiveDays;
  }

  public int getTotalDays() {
    return totalDays;
  }

  public boolean hasLoggedInToday() {
    return lastLoginDate != null && lastLoginDate.equals(LocalDate.now());
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    LoginStatistics that = (LoginStatistics) obj;
    return consecutiveDays == that.consecutiveDays
        && maxConsecutiveDays == that.maxConsecutiveDays
        && totalDays == that.totalDays
        && Objects.equals(lastLoginDate, that.lastLoginDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(lastLoginDate, consecutiveDays, maxConsecutiveDays, totalDays);
  }

  @Override
  public String toString() {
    return "LoginStatistics{"
        + "lastLoginDate="
        + lastLoginDate
        + ", consecutiveDays="
        + consecutiveDays
        + ", maxConsecutiveDays="
        + maxConsecutiveDays
        + ", totalDays="
        + totalDays
        + '}';
  }
}
