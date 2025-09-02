package com.rct.infrastructure.featureflags;

import java.util.Map;

/** Repository interface for feature flag persistence Requirements: 9.3 */
public interface FeatureFlagRepository {

  /** Get the current status of a feature flag */
  FeatureFlagStatus getStatus(String flagKey);

  /** Get all feature flags and their statuses */
  Map<String, FeatureFlagStatus> getAllStatuses();

  /** Create a new feature flag */
  void createFlag(String flagKey, String description, boolean enabled, double rolloutPercentage);

  /** Update feature flag enabled state and rollout percentage */
  void updateFlag(String flagKey, boolean enabled, double rolloutPercentage);

  /** Update only the rollout percentage */
  void updateRolloutPercentage(String flagKey, double rolloutPercentage);

  /** Add user-specific override */
  void addUserOverride(String flagKey, String userId, boolean enabled);

  /** Remove user-specific override */
  void removeUserOverride(String flagKey, String userId);

  /** Get user-specific override if it exists */
  Boolean getUserOverride(String flagKey, String userId);

  /** Log rollback event */
  void logRollback(String flagKey, String reason);

  /** Delete a feature flag (use with caution) */
  void deleteFlag(String flagKey);
}
