package com.rct.infrastructure.featureflags;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service for managing feature flags and gradual rollout Supports percentage-based rollout and
 * user-specific overrides Requirements: 9.3
 */
@Service
public class FeatureFlagService {

  private static final Logger logger = LoggerFactory.getLogger(FeatureFlagService.class);

  private final FeatureFlagRepository featureFlagRepository;
  private final RolloutStrategy rolloutStrategy;

  // Cache for feature flag states to improve performance
  private final Map<String, Boolean> flagCache = new ConcurrentHashMap<>();
  private final Map<String, Long> cacheTimestamps = new ConcurrentHashMap<>();
  private static final long CACHE_TTL_MS = 60000; // 1 minute cache TTL

  @Autowired
  public FeatureFlagService(
      FeatureFlagRepository featureFlagRepository, RolloutStrategy rolloutStrategy) {
    this.featureFlagRepository = featureFlagRepository;
    this.rolloutStrategy = rolloutStrategy;
  }

  /** Check if a feature flag is enabled for the current context */
  public boolean isEnabled(FeatureFlag flag) {
    return isEnabled(flag, null);
  }

  /** Check if a feature flag is enabled for a specific user */
  public boolean isEnabled(FeatureFlag flag, String userId) {
    String cacheKey = flag.getKey() + (userId != null ? ":" + userId : "");

    // Check cache first
    if (isCacheValid(cacheKey)) {
      Boolean cachedValue = flagCache.get(cacheKey);
      if (cachedValue != null) {
        logger.debug("Feature flag {} returned from cache: {}", flag.getKey(), cachedValue);
        return cachedValue;
      }
    }

    boolean isEnabled = evaluateFeatureFlag(flag, userId);

    // Update cache
    flagCache.put(cacheKey, isEnabled);
    cacheTimestamps.put(cacheKey, System.currentTimeMillis());

    logger.debug("Feature flag {} evaluated to: {} for user: {}", flag.getKey(), isEnabled, userId);
    return isEnabled;
  }

  /** Enable a feature flag globally */
  public void enableFlag(FeatureFlag flag) {
    featureFlagRepository.updateFlag(flag.getKey(), true, 100.0);
    invalidateCache(flag.getKey());
    logger.info("Feature flag {} enabled globally", flag.getKey());
  }

  /** Disable a feature flag globally */
  public void disableFlag(FeatureFlag flag) {
    featureFlagRepository.updateFlag(flag.getKey(), false, 0.0);
    invalidateCache(flag.getKey());
    logger.info("Feature flag {} disabled globally", flag.getKey());
  }

  /** Set rollout percentage for gradual deployment */
  public void setRolloutPercentage(FeatureFlag flag, double percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new IllegalArgumentException("Rollout percentage must be between 0 and 100");
    }

    featureFlagRepository.updateRolloutPercentage(flag.getKey(), percentage);
    invalidateCache(flag.getKey());
    logger.info("Feature flag {} rollout percentage set to {}%", flag.getKey(), percentage);
  }

  /** Add user-specific override for a feature flag */
  public void addUserOverride(FeatureFlag flag, String userId, boolean enabled) {
    featureFlagRepository.addUserOverride(flag.getKey(), userId, enabled);
    invalidateCache(flag.getKey() + ":" + userId);
    logger.info(
        "Feature flag {} user override set for user {}: {}", flag.getKey(), userId, enabled);
  }

  /** Remove user-specific override */
  public void removeUserOverride(FeatureFlag flag, String userId) {
    featureFlagRepository.removeUserOverride(flag.getKey(), userId);
    invalidateCache(flag.getKey() + ":" + userId);
    logger.info("Feature flag {} user override removed for user {}", flag.getKey(), userId);
  }

  /** Get current rollout status for a feature flag */
  public FeatureFlagStatus getStatus(FeatureFlag flag) {
    return featureFlagRepository.getStatus(flag.getKey());
  }

  /** Get all feature flags and their current status */
  public Map<String, FeatureFlagStatus> getAllStatuses() {
    return featureFlagRepository.getAllStatuses();
  }

  /** Gradually increase rollout percentage */
  public void graduateRollout(
      FeatureFlag flag, double targetPercentage, double incrementPercentage) {
    FeatureFlagStatus currentStatus = getStatus(flag);
    double currentPercentage = currentStatus.getRolloutPercentage();

    if (currentPercentage >= targetPercentage) {
      logger.info(
          "Feature flag {} already at or above target percentage {}%",
          flag.getKey(), targetPercentage);
      return;
    }

    double newPercentage = Math.min(currentPercentage + incrementPercentage, targetPercentage);
    setRolloutPercentage(flag, newPercentage);

    logger.info(
        "Feature flag {} rollout graduated from {}% to {}%",
        flag.getKey(), currentPercentage, newPercentage);
  }

  /** Emergency rollback - immediately disable a feature flag */
  public void emergencyRollback(FeatureFlag flag, String reason) {
    disableFlag(flag);
    featureFlagRepository.logRollback(flag.getKey(), reason);
    logger.warn("EMERGENCY ROLLBACK: Feature flag {} disabled. Reason: {}", flag.getKey(), reason);
  }

  private boolean evaluateFeatureFlag(FeatureFlag flag, String userId) {
    try {
      FeatureFlagStatus status = featureFlagRepository.getStatus(flag.getKey());

      // Check if flag exists in database, if not use default
      if (status == null) {
        logger.debug(
            "Feature flag {} not found in database, using default value: {}",
            flag.getKey(),
            flag.getDefaultValue());
        return flag.getDefaultValue();
      }

      // Check if globally disabled
      if (!status.isEnabled()) {
        return false;
      }

      // Check user-specific override
      if (userId != null) {
        Boolean userOverride = featureFlagRepository.getUserOverride(flag.getKey(), userId);
        if (userOverride != null) {
          logger.debug(
              "User override found for flag {} and user {}: {}",
              flag.getKey(),
              userId,
              userOverride);
          return userOverride;
        }
      }

      // Apply rollout strategy
      return rolloutStrategy.shouldEnable(flag, userId, status.getRolloutPercentage());

    } catch (Exception e) {
      logger.error(
          "Error evaluating feature flag {}, falling back to default value", flag.getKey(), e);
      return flag.getDefaultValue();
    }
  }

  private boolean isCacheValid(String cacheKey) {
    Long timestamp = cacheTimestamps.get(cacheKey);
    return timestamp != null && (System.currentTimeMillis() - timestamp) < CACHE_TTL_MS;
  }

  private void invalidateCache(String flagKey) {
    // Remove all cache entries for this flag (including user-specific ones)
    flagCache.entrySet().removeIf(entry -> entry.getKey().startsWith(flagKey));
    cacheTimestamps.entrySet().removeIf(entry -> entry.getKey().startsWith(flagKey));
  }

  /** Clear all cached feature flag values */
  public void clearCache() {
    flagCache.clear();
    cacheTimestamps.clear();
    logger.info("Feature flag cache cleared");
  }

  /** Initialize default feature flags in the database */
  public void initializeDefaultFlags() {
    for (FeatureFlag flag : FeatureFlag.values()) {
      if (featureFlagRepository.getStatus(flag.getKey()) == null) {
        featureFlagRepository.createFlag(
            flag.getKey(), flag.getDescription(), flag.getDefaultValue(), 0.0);
        logger.info(
            "Initialized default feature flag: {} = {}", flag.getKey(), flag.getDefaultValue());
      }
    }
  }
}
