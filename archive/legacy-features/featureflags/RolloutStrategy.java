package com.rct.infrastructure.featureflags;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.stereotype.Component;

/**
 * Strategy for determining feature flag rollout based on percentage and user context Uses
 * consistent hashing to ensure same user always gets same result Requirements: 9.3
 */
@Component
public class RolloutStrategy {

  /**
   * Determine if a feature should be enabled based on rollout percentage Uses consistent hashing to
   * ensure deterministic results per user
   */
  public boolean shouldEnable(FeatureFlag flag, String userId, double rolloutPercentage) {
    if (rolloutPercentage <= 0) {
      return false;
    }

    if (rolloutPercentage >= 100) {
      return true;
    }

    // Use consistent hashing for deterministic rollout
    String hashInput = flag.getKey() + ":" + (userId != null ? userId : "anonymous");
    double userPercentile = getUserPercentile(hashInput);

    return userPercentile <= rolloutPercentage;
  }

  /**
   * Calculate a consistent percentile (0-100) for a given input Same input will always produce the
   * same percentile
   */
  private double getUserPercentile(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));

      // Use first 4 bytes to create an integer
      int hashInt = 0;
      for (int i = 0; i < 4; i++) {
        hashInt = (hashInt << 8) | (hash[i] & 0xFF);
      }

      // Convert to positive value and get percentile
      long positiveHash = Integer.toUnsignedLong(hashInt);
      return (positiveHash % 10000) / 100.0; // 0-99.99

    } catch (NoSuchAlgorithmException e) {
      // Fallback to simple hash if SHA-256 is not available
      return Math.abs(input.hashCode() % 10000) / 100.0;
    }
  }

  /** Get the percentile for a specific user and flag (for debugging) */
  public double getUserPercentileForFlag(FeatureFlag flag, String userId) {
    String hashInput = flag.getKey() + ":" + (userId != null ? userId : "anonymous");
    return getUserPercentile(hashInput);
  }

  /**
   * Calculate what percentage of users would be enabled at a given rollout percentage This is
   * useful for estimating impact before rollout
   */
  public RolloutImpact calculateImpact(FeatureFlag flag, double rolloutPercentage, int sampleSize) {
    int enabledCount = 0;

    for (int i = 0; i < sampleSize; i++) {
      String sampleUserId = "sample_user_" + i;
      if (shouldEnable(flag, sampleUserId, rolloutPercentage)) {
        enabledCount++;
      }
    }

    double actualPercentage = (enabledCount * 100.0) / sampleSize;
    return new RolloutImpact(rolloutPercentage, actualPercentage, enabledCount, sampleSize);
  }

  /** Represents the impact analysis of a rollout */
  public static class RolloutImpact {
    private final double targetPercentage;
    private final double actualPercentage;
    private final int enabledUsers;
    private final int totalUsers;

    public RolloutImpact(
        double targetPercentage, double actualPercentage, int enabledUsers, int totalUsers) {
      this.targetPercentage = targetPercentage;
      this.actualPercentage = actualPercentage;
      this.enabledUsers = enabledUsers;
      this.totalUsers = totalUsers;
    }

    public double getTargetPercentage() {
      return targetPercentage;
    }

    public double getActualPercentage() {
      return actualPercentage;
    }

    public int getEnabledUsers() {
      return enabledUsers;
    }

    public int getTotalUsers() {
      return totalUsers;
    }

    public double getVariance() {
      return Math.abs(actualPercentage - targetPercentage);
    }

    @Override
    public String toString() {
      return String.format(
          "RolloutImpact{target=%.1f%%, actual=%.1f%%, enabled=%d/%d, variance=%.1f%%}",
          targetPercentage, actualPercentage, enabledUsers, totalUsers, getVariance());
    }
  }
}
