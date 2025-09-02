package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for ConfigurationSecurityScanner. */
@ExtendWith(MockitoExtension.class)
class ConfigurationSecurityScannerTest {

  @Mock private EnvironmentConfig environmentConfig;

  @Mock private SecretManager secretManager;

  private ConfigurationSecurityScanner scanner;

  @BeforeEach
  void setUp() {
    scanner = new ConfigurationSecurityScanner(environmentConfig, secretManager);
  }

  @Test
  void shouldDetectSecurityIssuesInConfiguration() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environmentConfig.isDebugEnabled()).thenReturn(true); // Debug enabled in production
    when(secretManager.isSensitiveKey("JWT_SECRET")).thenReturn(true);

    // When
    ConfigurationSecurityScanner.SecurityScanResult result = scanner.scanConfiguration();

    // Then
    assertThat(result.hasIssues()).isTrue();
    assertThat(result.getIssueCount()).isGreaterThan(0);

    // Should detect debug mode enabled in production
    boolean hasDebugIssue =
        result.getIssues().stream()
            .anyMatch(issue -> issue.getDescription().contains("Debug mode is enabled"));
    assertThat(hasDebugIssue).isTrue();
  }

  @Test
  void shouldNotReportIssuesForSecureConfiguration() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environmentConfig.isDebugEnabled()).thenReturn(false); // Debug properly disabled
    when(secretManager.isSensitiveKey("JWT_SECRET")).thenReturn(true);

    // When
    ConfigurationSecurityScanner.SecurityScanResult result = scanner.scanConfiguration();

    // Then - Should have minimal or no critical issues for a properly configured system
    assertThat(result.getCriticalIssueCount()).isEqualTo(0);
  }

  @Test
  void shouldProvideSecurityRecommendations() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(true);
    when(environmentConfig.isDebugEnabled()).thenReturn(false);

    // When
    ConfigurationSecurityScanner.SecurityScanResult result = scanner.scanConfiguration();

    // Then
    assertThat(result.getRecommendations()).isNotEmpty();
    assertThat(result.getRecommendations()).containsKey("HTTPS");
    assertThat(result.getRecommendations()).containsKey("Monitoring");
  }

  @Test
  void shouldSkipScanInNonProductionEnvironment() {
    // Given
    when(environmentConfig.isProduction()).thenReturn(false);
    when(environmentConfig.getName()).thenReturn("dev");

    // When
    ConfigurationSecurityScanner.SecurityScanResult result = scanner.scanConfiguration();

    // Then - Should still work but with different validation rules
    assertThat(result).isNotNull();
  }

  @Test
  void shouldCreateSecurityIssueCorrectly() {
    // Given
    ConfigurationSecurityScanner.SecuritySeverity severity =
        ConfigurationSecurityScanner.SecuritySeverity.HIGH;
    String description = "Test security issue";
    String key = "TEST_KEY";
    String recommendation = "Fix this issue";

    // When
    ConfigurationSecurityScanner.SecurityIssue issue =
        new ConfigurationSecurityScanner.SecurityIssue(severity, description, key, recommendation);

    // Then
    assertThat(issue.getSeverity()).isEqualTo(severity);
    assertThat(issue.getDescription()).isEqualTo(description);
    assertThat(issue.getConfigurationKey()).isEqualTo(key);
    assertThat(issue.getRecommendation()).isEqualTo(recommendation);
    assertThat(issue.toString()).contains("High");
    assertThat(issue.toString()).contains(description);
  }

  @Test
  void shouldCountIssuesBySeverity() {
    // Given
    ConfigurationSecurityScanner.SecurityScanResult result =
        new ConfigurationSecurityScanner.SecurityScanResult(
            java.util.List.of(
                new ConfigurationSecurityScanner.SecurityIssue(
                    ConfigurationSecurityScanner.SecuritySeverity.CRITICAL,
                    "Critical issue",
                    "KEY1",
                    "Fix it"),
                new ConfigurationSecurityScanner.SecurityIssue(
                    ConfigurationSecurityScanner.SecuritySeverity.HIGH,
                    "High issue",
                    "KEY2",
                    "Fix it"),
                new ConfigurationSecurityScanner.SecurityIssue(
                    ConfigurationSecurityScanner.SecuritySeverity.HIGH,
                    "Another high issue",
                    "KEY3",
                    "Fix it")),
            java.util.Map.of("Test", "Recommendation"));

    // When & Then
    assertThat(result.getCriticalIssueCount()).isEqualTo(1);
    assertThat(result.getHighIssueCount()).isEqualTo(2);
    assertThat(result.getIssueCount()).isEqualTo(3);
    assertThat(result.hasIssues()).isTrue();
  }
}
