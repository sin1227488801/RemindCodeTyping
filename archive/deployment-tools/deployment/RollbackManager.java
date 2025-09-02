package com.rct.infrastructure.deployment;

import com.rct.infrastructure.featureflags.FeatureFlag;
import com.rct.infrastructure.featureflags.FeatureFlagService;
import com.rct.infrastructure.monitoring.FeatureFlagMonitor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Manages rollback procedures for problematic deployments Requirements: 9.3 */
@Service
public class RollbackManager {

  private static final Logger logger = LoggerFactory.getLogger(RollbackManager.class);

  private final FeatureFlagService featureFlagService;
  private final FeatureFlagMonitor featureFlagMonitor;

  // Track rollback history
  private final Map<String, List<RollbackEvent>> rollbackHistory = new ConcurrentHashMap<>();

  @Autowired
  public RollbackManager(
      FeatureFlagService featureFlagService, FeatureFlagMonitor featureFlagMonitor) {
    this.featureFlagService = featureFlagService;
    this.featureFlagMonitor = featureFlagMonitor;
  }

  /** Perform emergency rollback for a specific feature */
  public RollbackResult emergencyRollback(
      FeatureFlag flag, String reason, RollbackStrategy strategy) {
    logger.warn(
        "EMERGENCY ROLLBACK initiated for feature flag: {} - Reason: {}", flag.getKey(), reason);

    try {
      RollbackEvent event = new RollbackEvent(flag.getKey(), reason, strategy, LocalDateTime.now());

      switch (strategy) {
        case IMMEDIATE_DISABLE:
          return performImmediateDisable(flag, event);

        case GRADUAL_DECREASE:
          return performGradualDecrease(flag, event);

        case PARTIAL_ROLLBACK:
          return performPartialRollback(flag, event, 50.0); // Rollback to 50%

        case CANARY_ONLY:
          return performCanaryOnly(flag, event);

        default:
          throw new IllegalArgumentException("Unknown rollback strategy: " + strategy);
      }

    } catch (Exception e) {
      logger.error("Emergency rollback failed for feature flag: {}", flag.getKey(), e);
      return new RollbackResult(false, "Rollback failed: " + e.getMessage(), null);
    }
  }

  /** Perform automatic rollback based on monitoring metrics */
  public RollbackResult automaticRollback(FeatureFlag flag, RollbackTrigger trigger) {
    logger.warn(
        "AUTOMATIC ROLLBACK triggered for feature flag: {} - Trigger: {}", flag.getKey(), trigger);

    // Determine appropriate rollback strategy based on trigger
    RollbackStrategy strategy = determineRollbackStrategy(trigger);

    return emergencyRollback(
        flag, "Automatic rollback due to: " + trigger.getDescription(), strategy);
  }

  /** Rollback multiple related features as a group */
  public GroupRollbackResult rollbackFeatureGroup(List<FeatureFlag> flags, String reason) {
    logger.warn("GROUP ROLLBACK initiated for {} features - Reason: {}", flags.size(), reason);

    List<RollbackResult> results = new ArrayList<>();
    boolean allSuccessful = true;

    for (FeatureFlag flag : flags) {
      RollbackResult result = emergencyRollback(flag, reason, RollbackStrategy.IMMEDIATE_DISABLE);
      results.add(result);

      if (!result.isSuccessful()) {
        allSuccessful = false;
      }
    }

    return new GroupRollbackResult(allSuccessful, results);
  }

  /** Get rollback history for a feature flag */
  public List<RollbackEvent> getRollbackHistory(String flagKey) {
    return rollbackHistory.getOrDefault(flagKey, new ArrayList<>());
  }

  /** Get all rollback history */
  public Map<String, List<RollbackEvent>> getAllRollbackHistory() {
    return new ConcurrentHashMap<>(rollbackHistory);
  }

  private RollbackResult performImmediateDisable(FeatureFlag flag, RollbackEvent event) {
    featureFlagService.disableFlag(flag);
    recordRollbackEvent(event);

    logger.info("Immediate disable completed for feature flag: {}", flag.getKey());
    return new RollbackResult(true, "Feature flag disabled immediately", event);
  }

  private RollbackResult performGradualDecrease(FeatureFlag flag, RollbackEvent event) {
    // Gradually decrease rollout percentage over time
    double currentPercentage = featureFlagService.getStatus(flag).getRolloutPercentage();

    if (currentPercentage > 50) {
      featureFlagService.setRolloutPercentage(flag, 50.0);
    } else if (currentPercentage > 25) {
      featureFlagService.setRolloutPercentage(flag, 25.0);
    } else if (currentPercentage > 10) {
      featureFlagService.setRolloutPercentage(flag, 10.0);
    } else {
      featureFlagService.disableFlag(flag);
    }

    recordRollbackEvent(event);

    logger.info("Gradual decrease initiated for feature flag: {}", flag.getKey());
    return new RollbackResult(true, "Gradual rollback initiated", event);
  }

  private RollbackResult performPartialRollback(
      FeatureFlag flag, RollbackEvent event, double targetPercentage) {
    featureFlagService.setRolloutPercentage(flag, targetPercentage);
    recordRollbackEvent(event);

    logger.info(
        "Partial rollback to {}% completed for feature flag: {}", targetPercentage, flag.getKey());
    return new RollbackResult(
        true, String.format("Rolled back to %.1f%%", targetPercentage), event);
  }

  private RollbackResult performCanaryOnly(FeatureFlag flag, RollbackEvent event) {
    // Rollback to canary percentage (typically 5-10%)
    featureFlagService.setRolloutPercentage(flag, 5.0);
    recordRollbackEvent(event);

    logger.info("Canary-only rollback completed for feature flag: {}", flag.getKey());
    return new RollbackResult(true, "Rolled back to canary deployment (5%)", event);
  }

  private RollbackStrategy determineRollbackStrategy(RollbackTrigger trigger) {
    return switch (trigger.getSeverity()) {
      case CRITICAL -> RollbackStrategy.IMMEDIATE_DISABLE;
      case HIGH -> RollbackStrategy.PARTIAL_ROLLBACK;
      case MEDIUM -> RollbackStrategy.GRADUAL_DECREASE;
      case LOW -> RollbackStrategy.CANARY_ONLY;
    };
  }

  private void recordRollbackEvent(RollbackEvent event) {
    rollbackHistory.computeIfAbsent(event.getFlagKey(), k -> new ArrayList<>()).add(event);

    // Keep only last 100 events per flag to prevent memory issues
    List<RollbackEvent> events = rollbackHistory.get(event.getFlagKey());
    if (events.size() > 100) {
      events.remove(0);
    }
  }

  /** Rollback strategies */
  public enum RollbackStrategy {
    IMMEDIATE_DISABLE("Immediately disable the feature"),
    GRADUAL_DECREASE("Gradually decrease rollout percentage"),
    PARTIAL_ROLLBACK("Rollback to a specific percentage"),
    CANARY_ONLY("Rollback to canary deployment only");

    private final String description;

    RollbackStrategy(String description) {
      this.description = description;
    }

    public String getDescription() {
      return description;
    }
  }

  /** Rollback triggers */
  public static class RollbackTrigger {
    private final String name;
    private final String description;
    private final Severity severity;

    public RollbackTrigger(String name, String description, Severity severity) {
      this.name = name;
      this.description = description;
      this.severity = severity;
    }

    public String getName() {
      return name;
    }

    public String getDescription() {
      return description;
    }

    public Severity getSeverity() {
      return severity;
    }

    public enum Severity {
      LOW,
      MEDIUM,
      HIGH,
      CRITICAL
    }

    // Common triggers
    public static final RollbackTrigger HIGH_ERROR_RATE =
        new RollbackTrigger("HIGH_ERROR_RATE", "Error rate exceeded threshold", Severity.HIGH);
    public static final RollbackTrigger PERFORMANCE_DEGRADATION =
        new RollbackTrigger(
            "PERFORMANCE_DEGRADATION", "Performance metrics degraded", Severity.MEDIUM);
    public static final RollbackTrigger SECURITY_INCIDENT =
        new RollbackTrigger(
            "SECURITY_INCIDENT", "Security vulnerability detected", Severity.CRITICAL);
    public static final RollbackTrigger USER_COMPLAINTS =
        new RollbackTrigger("USER_COMPLAINTS", "High volume of user complaints", Severity.MEDIUM);
  }

  /** Rollback event record */
  public static class RollbackEvent {
    private final String flagKey;
    private final String reason;
    private final RollbackStrategy strategy;
    private final LocalDateTime timestamp;
    private final String performedBy;

    public RollbackEvent(
        String flagKey, String reason, RollbackStrategy strategy, LocalDateTime timestamp) {
      this.flagKey = flagKey;
      this.reason = reason;
      this.strategy = strategy;
      this.timestamp = timestamp;
      this.performedBy = "system"; // In real implementation, get current user
    }

    // Getters
    public String getFlagKey() {
      return flagKey;
    }

    public String getReason() {
      return reason;
    }

    public RollbackStrategy getStrategy() {
      return strategy;
    }

    public LocalDateTime getTimestamp() {
      return timestamp;
    }

    public String getPerformedBy() {
      return performedBy;
    }
  }

  /** Rollback result */
  public static class RollbackResult {
    private final boolean successful;
    private final String message;
    private final RollbackEvent event;

    public RollbackResult(boolean successful, String message, RollbackEvent event) {
      this.successful = successful;
      this.message = message;
      this.event = event;
    }

    public boolean isSuccessful() {
      return successful;
    }

    public String getMessage() {
      return message;
    }

    public RollbackEvent getEvent() {
      return event;
    }
  }

  /** Group rollback result */
  public static class GroupRollbackResult {
    private final boolean allSuccessful;
    private final List<RollbackResult> individualResults;

    public GroupRollbackResult(boolean allSuccessful, List<RollbackResult> individualResults) {
      this.allSuccessful = allSuccessful;
      this.individualResults = individualResults;
    }

    public boolean isAllSuccessful() {
      return allSuccessful;
    }

    public List<RollbackResult> getIndividualResults() {
      return individualResults;
    }

    public int getSuccessCount() {
      return (int) individualResults.stream().filter(RollbackResult::isSuccessful).count();
    }

    public int getFailureCount() {
      return individualResults.size() - getSuccessCount();
    }
  }
}
