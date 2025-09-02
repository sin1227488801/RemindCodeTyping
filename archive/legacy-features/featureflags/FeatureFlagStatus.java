package com.rct.infrastructure.featureflags;

import java.time.LocalDateTime;

/** Represents the current status of a feature flag Requirements: 9.3 */
public class FeatureFlagStatus {

  private final String key;
  private final String description;
  private final boolean enabled;
  private final double rolloutPercentage;
  private final LocalDateTime lastModified;
  private final String lastModifiedBy;
  private final int userOverrideCount;

  public FeatureFlagStatus(
      String key,
      String description,
      boolean enabled,
      double rolloutPercentage,
      LocalDateTime lastModified,
      String lastModifiedBy,
      int userOverrideCount) {
    this.key = key;
    this.description = description;
    this.enabled = enabled;
    this.rolloutPercentage = rolloutPercentage;
    this.lastModified = lastModified;
    this.lastModifiedBy = lastModifiedBy;
    this.userOverrideCount = userOverrideCount;
  }

  public String getKey() {
    return key;
  }

  public String getDescription() {
    return description;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public double getRolloutPercentage() {
    return rolloutPercentage;
  }

  public LocalDateTime getLastModified() {
    return lastModified;
  }

  public String getLastModifiedBy() {
    return lastModifiedBy;
  }

  public int getUserOverrideCount() {
    return userOverrideCount;
  }

  /** Get the effective rollout status */
  public RolloutStatus getRolloutStatus() {
    if (!enabled) {
      return RolloutStatus.DISABLED;
    }

    if (rolloutPercentage == 0.0) {
      return RolloutStatus.DISABLED;
    } else if (rolloutPercentage == 100.0) {
      return RolloutStatus.FULLY_ENABLED;
    } else {
      return RolloutStatus.PARTIAL_ROLLOUT;
    }
  }

  public enum RolloutStatus {
    DISABLED("Disabled"),
    PARTIAL_ROLLOUT("Partial Rollout"),
    FULLY_ENABLED("Fully Enabled");

    private final String displayName;

    RolloutStatus(String displayName) {
      this.displayName = displayName;
    }

    public String getDisplayName() {
      return displayName;
    }
  }

  @Override
  public String toString() {
    return String.format(
        "FeatureFlagStatus{key='%s', enabled=%s, rolloutPercentage=%.1f%%, status=%s}",
        key, enabled, rolloutPercentage, getRolloutStatus().getDisplayName());
  }
}
