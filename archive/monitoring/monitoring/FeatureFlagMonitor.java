package com.rct.infrastructure.monitoring;

import com.rct.infrastructure.featureflags.FeatureFlagService;
import com.rct.infrastructure.featureflags.FeatureFlagStatus;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Monitoring and alerting for feature flag rollouts Requirements: 9.3 */
@Component
public class FeatureFlagMonitor implements HealthIndicator {

  private static final Logger logger = LoggerFactory.getLogger(FeatureFlagMonitor.class);

  private final FeatureFlagService featureFlagService;
  private final AlertingService alertingService;

  // Track rollout metrics
  private final Map<String, RolloutMetrics> rolloutMetrics = new ConcurrentHashMap<>();

  @Autowired
  public FeatureFlagMonitor(
      FeatureFlagService featureFlagService, AlertingService alertingService) {
    this.featureFlagService = featureFlagService;
    this.alertingService = alertingService;
  }

  /** Monitor feature flag rollouts every minute */
  @Scheduled(fixedRate = 60000) // Every minute
  public void monitorRollouts() {
    try {
      Map<String, FeatureFlagStatus> allStatuses = featureFlagService.getAllStatuses();

      for (Map.Entry<String, FeatureFlagStatus> entry : allStatuses.entrySet()) {
        String flagKey = entry.getKey();
        FeatureFlagStatus status = entry.getValue();

        updateMetrics(flagKey, status);
        checkForAnomalies(flagKey, status);
      }

    } catch (Exception e) {
      logger.error("Error during feature flag monitoring", e);
      alertingService.sendAlert(
          AlertLevel.ERROR,
          "Feature Flag Monitoring Failed",
          "Failed to monitor feature flags: " + e.getMessage());
    }
  }

  /** Check for rollout anomalies and send alerts */
  private void checkForAnomalies(String flagKey, FeatureFlagStatus status) {
    RolloutMetrics metrics = rolloutMetrics.get(flagKey);
    if (metrics == null) {
      return;
    }

    // Check for rapid rollout changes
    if (metrics.hasRapidChanges()) {
      alertingService.sendAlert(
          AlertLevel.WARNING,
          "Rapid Feature Flag Changes Detected",
          String.format(
              "Feature flag %s has changed %d times in the last hour",
              flagKey, metrics.getChangeCount()));
    }

    // Check for stuck rollouts
    if (metrics.isStuckRollout()) {
      alertingService.sendAlert(
          AlertLevel.INFO,
          "Stuck Feature Flag Rollout",
          String.format(
              "Feature flag %s has been at %.1f%% for over 24 hours",
              flagKey, status.getRolloutPercentage()));
    }

    // Check for high user override count
    if (status.getUserOverrideCount() > 100) {
      alertingService.sendAlert(
          AlertLevel.WARNING,
          "High User Override Count",
          String.format(
              "Feature flag %s has %d user overrides", flagKey, status.getUserOverrideCount()));
    }
  }

  /** Update metrics for a feature flag */
  private void updateMetrics(String flagKey, FeatureFlagStatus status) {
    RolloutMetrics metrics = rolloutMetrics.computeIfAbsent(flagKey, k -> new RolloutMetrics());
    metrics.update(status);
  }

  /** Get rollout metrics for a specific flag */
  public RolloutMetrics getMetrics(String flagKey) {
    return rolloutMetrics.get(flagKey);
  }

  /** Get all rollout metrics */
  public Map<String, RolloutMetrics> getAllMetrics() {
    return new ConcurrentHashMap<>(rolloutMetrics);
  }

  @Override
  public Health health() {
    try {
      Map<String, FeatureFlagStatus> allStatuses = featureFlagService.getAllStatuses();

      int totalFlags = allStatuses.size();
      int enabledFlags =
          (int) allStatuses.values().stream().filter(FeatureFlagStatus::isEnabled).count();
      int partialRollouts =
          (int)
              allStatuses.values().stream()
                  .filter(
                      status ->
                          status.getRolloutPercentage() > 0 && status.getRolloutPercentage() < 100)
                  .count();

      return Health.up()
          .withDetail("totalFlags", totalFlags)
          .withDetail("enabledFlags", enabledFlags)
          .withDetail("partialRollouts", partialRollouts)
          .withDetail("lastCheck", LocalDateTime.now())
          .build();

    } catch (Exception e) {
      return Health.down()
          .withDetail("error", e.getMessage())
          .withDetail("lastCheck", LocalDateTime.now())
          .build();
    }
  }

  /** Metrics tracking for individual feature flags */
  public static class RolloutMetrics {
    private double currentPercentage;
    private LocalDateTime lastUpdate;
    private LocalDateTime firstSeen;
    private int changeCount;
    private LocalDateTime lastChangeTime;

    public RolloutMetrics() {
      this.firstSeen = LocalDateTime.now();
      this.lastUpdate = LocalDateTime.now();
      this.changeCount = 0;
    }

    public void update(FeatureFlagStatus status) {
      LocalDateTime now = LocalDateTime.now();

      if (currentPercentage != status.getRolloutPercentage()) {
        // Percentage changed
        currentPercentage = status.getRolloutPercentage();
        changeCount++;
        lastChangeTime = now;
      }

      lastUpdate = now;
    }

    public boolean hasRapidChanges() {
      if (lastChangeTime == null) {
        return false;
      }

      // Check if there have been more than 5 changes in the last hour
      LocalDateTime oneHourAgo = LocalDateTime.now().minus(1, ChronoUnit.HOURS);
      return changeCount > 5 && lastChangeTime.isAfter(oneHourAgo);
    }

    public boolean isStuckRollout() {
      if (lastChangeTime == null) {
        return false;
      }

      // Check if rollout has been stuck for more than 24 hours
      LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minus(24, ChronoUnit.HOURS);
      return currentPercentage > 0
          && currentPercentage < 100
          && lastChangeTime.isBefore(twentyFourHoursAgo);
    }

    // Getters
    public double getCurrentPercentage() {
      return currentPercentage;
    }

    public LocalDateTime getLastUpdate() {
      return lastUpdate;
    }

    public LocalDateTime getFirstSeen() {
      return firstSeen;
    }

    public int getChangeCount() {
      return changeCount;
    }

    public LocalDateTime getLastChangeTime() {
      return lastChangeTime;
    }
  }

  public enum AlertLevel {
    INFO,
    WARNING,
    ERROR,
    CRITICAL
  }

  /** Simple alerting service interface */
  public interface AlertingService {
    void sendAlert(AlertLevel level, String title, String message);
  }

  /** Default implementation of alerting service */
  @Component
  public static class DefaultAlertingService implements AlertingService {
    private static final Logger alertLogger = LoggerFactory.getLogger("FEATURE_FLAG_ALERTS");

    @Override
    public void sendAlert(AlertLevel level, String title, String message) {
      String alertMessage = String.format("[%s] %s: %s", level, title, message);

      switch (level) {
        case INFO -> alertLogger.info(alertMessage);
        case WARNING -> alertLogger.warn(alertMessage);
        case ERROR, CRITICAL -> alertLogger.error(alertMessage);
      }

      // In a real implementation, this would also send to external alerting systems
      // like Slack, PagerDuty, email, etc.
    }
  }
}
