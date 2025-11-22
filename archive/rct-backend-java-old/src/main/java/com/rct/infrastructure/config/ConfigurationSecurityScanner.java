package com.rct.infrastructure.config;

import java.util.*;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Scans configuration for potential security issues and provides recommendations. This component
 * performs security analysis of the application configuration and logs warnings for potential
 * security concerns.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConfigurationSecurityScanner {

  private final EnvironmentConfig environmentConfig;
  private final SecretManager secretManager;

  // Patterns for detecting potentially insecure configuration
  private static final Pattern URL_WITH_CREDENTIALS = Pattern.compile(".*://[^/]*:[^/]*@.*");
  private static final Pattern LOCALHOST_PATTERN =
      Pattern.compile(".*(localhost|127\\.0\\.0\\.1).*");
  private static final Pattern WEAK_SECRET_PATTERN =
      Pattern.compile("(?i).*(test|demo|example|default|changeme|admin|password|secret|key).*");

  /** Performs security scan when application is ready. */
  @EventListener(ApplicationReadyEvent.class)
  public void performSecurityScan() {
    if (!environmentConfig.isProduction()) {
      log.debug(
          "Skipping security scan in non-production environment: {}", environmentConfig.getName());
      return;
    }

    log.info("Performing configuration security scan for production environment");

    SecurityScanResult scanResult = scanConfiguration();

    if (scanResult.hasIssues()) {
      log.warn("Configuration security scan found {} issues", scanResult.getIssueCount());
      scanResult
          .getIssues()
          .forEach(
              issue ->
                  log.warn("Security Issue: {} - {}", issue.getSeverity(), issue.getDescription()));
    } else {
      log.info("Configuration security scan completed - no issues found");
    }

    // Log security recommendations
    logSecurityRecommendations(scanResult);
  }

  /** Scans the current configuration for security issues. */
  public SecurityScanResult scanConfiguration() {
    List<SecurityIssue> issues = new ArrayList<>();
    Map<String, String> recommendations = new HashMap<>();

    // Scan environment variables
    scanEnvironmentVariables(issues, recommendations);

    // Scan for production-specific issues
    if (environmentConfig.isProduction()) {
      scanProductionConfiguration(issues, recommendations);
    }

    return new SecurityScanResult(issues, recommendations);
  }

  /** Scans environment variables for security issues. */
  private void scanEnvironmentVariables(
      List<SecurityIssue> issues, Map<String, String> recommendations) {
    Map<String, String> envVars = System.getenv();

    for (Map.Entry<String, String> entry : envVars.entrySet()) {
      String key = entry.getKey();
      String value = entry.getValue();

      if (!isApplicationVariable(key)) {
        continue;
      }

      // Check for URLs with embedded credentials
      if (URL_WITH_CREDENTIALS.matcher(value).matches()) {
        issues.add(
            new SecurityIssue(
                SecuritySeverity.HIGH,
                "Environment variable contains URL with embedded credentials",
                key,
                "Use separate credential configuration instead of embedding in URLs"));
      }

      // Check for localhost references in production
      if (environmentConfig.isProduction() && LOCALHOST_PATTERN.matcher(value).matches()) {
        issues.add(
            new SecurityIssue(
                SecuritySeverity.MEDIUM,
                "Production configuration contains localhost reference",
                key,
                "Replace localhost references with production hostnames"));
      }

      // Check for weak secrets
      if (secretManager.isSensitiveKey(key) && WEAK_SECRET_PATTERN.matcher(value).matches()) {
        issues.add(
            new SecurityIssue(
                SecuritySeverity.HIGH,
                "Sensitive configuration appears to contain weak or default value",
                key,
                "Use strong, randomly generated secrets in production"));
      }

      // Check for empty sensitive values
      if (secretManager.isSensitiveKey(key) && (value == null || value.trim().isEmpty())) {
        issues.add(
            new SecurityIssue(
                SecuritySeverity.CRITICAL,
                "Required sensitive configuration is empty",
                key,
                "Provide a secure value for this configuration"));
      }
    }
  }

  /** Scans production-specific configuration issues. */
  private void scanProductionConfiguration(
      List<SecurityIssue> issues, Map<String, String> recommendations) {
    // Check if debug mode is enabled
    if (environmentConfig.isDebugEnabled()) {
      issues.add(
          new SecurityIssue(
              SecuritySeverity.HIGH,
              "Debug mode is enabled in production",
              "APP_DEBUG_ENABLED",
              "Disable debug mode in production environments"));
    }

    // Add production security recommendations
    recommendations.put("HTTPS", "Ensure HTTPS is enabled for all production endpoints");
    recommendations.put("Monitoring", "Enable security monitoring and alerting");
    recommendations.put("Backup", "Implement secure backup procedures for configuration");
    recommendations.put("Rotation", "Implement regular secret rotation procedures");
  }

  /** Logs security recommendations based on scan results. */
  private void logSecurityRecommendations(SecurityScanResult scanResult) {
    if (!scanResult.getRecommendations().isEmpty()) {
      log.info("Security recommendations:");
      scanResult
          .getRecommendations()
          .forEach((category, recommendation) -> log.info("  {}: {}", category, recommendation));
    }
  }

  /** Checks if an environment variable is application-related. */
  private boolean isApplicationVariable(String key) {
    return key.startsWith("APP_")
        || key.startsWith("JWT_")
        || key.startsWith("SPRING_")
        || key.startsWith("CORS_")
        || key.startsWith("SECURITY_")
        || key.startsWith("DATABASE_");
  }

  /** Represents the result of a security scan. */
  public static class SecurityScanResult {
    private final List<SecurityIssue> issues;
    private final Map<String, String> recommendations;

    public SecurityScanResult(List<SecurityIssue> issues, Map<String, String> recommendations) {
      this.issues = new ArrayList<>(issues);
      this.recommendations = new HashMap<>(recommendations);
    }

    public List<SecurityIssue> getIssues() {
      return new ArrayList<>(issues);
    }

    public Map<String, String> getRecommendations() {
      return new HashMap<>(recommendations);
    }

    public boolean hasIssues() {
      return !issues.isEmpty();
    }

    public int getIssueCount() {
      return issues.size();
    }

    public long getCriticalIssueCount() {
      return issues.stream()
          .filter(issue -> issue.getSeverity() == SecuritySeverity.CRITICAL)
          .count();
    }

    public long getHighIssueCount() {
      return issues.stream().filter(issue -> issue.getSeverity() == SecuritySeverity.HIGH).count();
    }
  }

  /** Represents a security issue found during configuration scan. */
  public static class SecurityIssue {
    private final SecuritySeverity severity;
    private final String description;
    private final String configurationKey;
    private final String recommendation;

    public SecurityIssue(
        SecuritySeverity severity,
        String description,
        String configurationKey,
        String recommendation) {
      this.severity = severity;
      this.description = description;
      this.configurationKey = configurationKey;
      this.recommendation = recommendation;
    }

    public SecuritySeverity getSeverity() {
      return severity;
    }

    public String getDescription() {
      return description;
    }

    public String getConfigurationKey() {
      return configurationKey;
    }

    public String getRecommendation() {
      return recommendation;
    }

    @Override
    public String toString() {
      return String.format(
          "[%s] %s (Key: %s) - %s", severity, description, configurationKey, recommendation);
    }
  }

  /** Security issue severity levels. */
  public enum SecuritySeverity {
    CRITICAL("Critical"),
    HIGH("High"),
    MEDIUM("Medium"),
    LOW("Low");

    private final String displayName;

    SecuritySeverity(String displayName) {
      this.displayName = displayName;
    }

    @Override
    public String toString() {
      return displayName;
    }
  }
}
