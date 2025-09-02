package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Security tests for configuration management to ensure no sensitive data is hardcoded and proper
 * security practices are followed.
 */
@SpringBootTest
@ActiveProfiles("test")
class ConfigurationManagementSecurityTest {

  private static final Pattern HARDCODED_SECRET_PATTERN =
      Pattern.compile("(?i)(password|secret|key)\\s*[=:]\\s*['\"]?[^\\s'\"]{8,}['\"]?");

  private static final Pattern SENSITIVE_VALUE_PATTERN =
      Pattern.compile("(?i)(admin|password|secret|changeme|default|test123|qwerty)");

  @Test
  void shouldNotContainHardcodedSecretsInSourceCode() throws IOException {
    // Check main source files
    checkDirectoryForHardcodedSecrets("src/main/java");
    checkDirectoryForHardcodedSecrets("src/main/resources");
  }

  @Test
  void shouldNotContainSensitiveValuesInConfigurationFiles() throws IOException {
    Path applicationYml = Paths.get("src/main/resources/application.yml");
    if (Files.exists(applicationYml)) {
      List<String> lines = Files.readAllLines(applicationYml);

      for (int i = 0; i < lines.size(); i++) {
        String line = lines.get(i);

        // Skip comments and empty lines
        if (line.trim().startsWith("#") || line.trim().isEmpty()) {
          continue;
        }

        // Check for hardcoded sensitive values (excluding environment variable defaults)
        if (line.contains("secret:") || line.contains("password:")) {
          // Allow environment variable references like ${JWT_SECRET:}
          if (!line.matches(".*\\$\\{[^}]+\\}.*") && SENSITIVE_VALUE_PATTERN.matcher(line).find()) {
            throw new AssertionError(
                String.format(
                    "Potential hardcoded sensitive value found in %s at line %d: %s",
                    applicationYml, i + 1, line.trim()));
          }
        }
      }
    }
  }

  @Test
  void shouldUseEnvironmentVariablesForSensitiveConfiguration() throws IOException {
    Path applicationYml = Paths.get("src/main/resources/application.yml");
    if (Files.exists(applicationYml)) {
      String content = Files.readString(applicationYml);

      // JWT secret should use environment variable
      assertThat(content)
          .as("JWT secret should use environment variable")
          .contains("${JWT_SECRET:");

      // Database password should use environment variable
      assertThat(content)
          .as("Database password should use environment variable")
          .contains("${SPRING_DATASOURCE_PASSWORD:");
    }
  }

  @Test
  void shouldNotExposeSecretsInDefaultValues() throws IOException {
    Path applicationYml = Paths.get("src/main/resources/application.yml");
    if (Files.exists(applicationYml)) {
      String content = Files.readString(applicationYml);

      // Check that JWT_SECRET doesn't have a hardcoded default
      assertThat(content)
          .as("JWT_SECRET should not have hardcoded default value")
          .doesNotContain("${JWT_SECRET:mySecretKey")
          .doesNotContain("${JWT_SECRET:changeme")
          .doesNotContain("${JWT_SECRET:admin")
          .doesNotContain("${JWT_SECRET:password");
    }
  }

  @Test
  void shouldHaveSecureExampleFiles() throws IOException {
    // Check .env.example files
    checkExampleFile(".env.example");
    checkExampleFile(".env.production.example");
  }

  @Test
  void shouldNotCommitActualEnvironmentFiles() {
    // Verify that actual .env files are not present (should be gitignored)
    Path envFile = Paths.get(".env");
    Path envProdFile = Paths.get(".env.production");

    assertThat(Files.exists(envFile))
        .as(".env file should not be committed to version control")
        .isFalse();

    assertThat(Files.exists(envProdFile))
        .as(".env.production file should not be committed to version control")
        .isFalse();
  }

  @Test
  void shouldHaveConfigurationSecurityDocumentation() {
    Path securityDoc = Paths.get("CONFIGURATION_SECURITY.md");

    assertThat(Files.exists(securityDoc))
        .as("Configuration security documentation should exist")
        .isTrue();
  }

  @Test
  void shouldValidateSecretManagerConfiguration() {
    // This test ensures SecretManager is properly configured
    SecretManager secretManager = new SecretManager(null, null);

    // Test sensitive key detection
    assertThat(secretManager.isSensitiveKey("JWT_SECRET")).isTrue();
    assertThat(secretManager.isSensitiveKey("PASSWORD")).isTrue();
    assertThat(secretManager.isSensitiveKey("API_KEY")).isTrue();
    assertThat(secretManager.isSensitiveKey("SERVER_PORT")).isFalse();
    assertThat(secretManager.isSensitiveKey("APP_NAME")).isFalse();
  }

  @Test
  void shouldMaskSensitiveValuesInLogs() {
    SecretManager secretManager = new SecretManager(null, null);

    // Test value masking
    String maskedSecret = secretManager.maskValueForLogging("JWT_SECRET", "verylongsecretvalue");
    assertThat(maskedSecret)
        .as("Secret should be masked")
        .doesNotContain("verylongsecretvalue")
        .contains("*");

    String nonSensitive = secretManager.maskValueForLogging("SERVER_PORT", "8080");
    assertThat(nonSensitive).as("Non-sensitive value should not be masked").isEqualTo("8080");
  }

  private void checkDirectoryForHardcodedSecrets(String directory) throws IOException {
    Path dir = Paths.get(directory);
    if (!Files.exists(dir)) {
      return;
    }

    Files.walk(dir)
        .filter(Files::isRegularFile)
        .filter(
            path ->
                path.toString().endsWith(".java")
                    || path.toString().endsWith(".yml")
                    || path.toString().endsWith(".yaml")
                    || path.toString().endsWith(".properties"))
        .forEach(this::checkFileForHardcodedSecrets);
  }

  private void checkFileForHardcodedSecrets(Path file) {
    try {
      List<String> lines = Files.readAllLines(file);

      for (int i = 0; i < lines.size(); i++) {
        String line = lines.get(i);

        // Skip comments and test files with obvious test data
        if (line.trim().startsWith("//")
            || line.trim().startsWith("#")
            || line.trim().startsWith("*")
            || file.toString().contains("test")
                && (line.contains("testuser") || line.contains("password123"))) {
          continue;
        }

        // Check for potential hardcoded secrets
        if (HARDCODED_SECRET_PATTERN.matcher(line).find()
            && !line.contains("${")
            && // Allow environment variables
            !line.contains("@Value")
            && // Allow Spring @Value annotations
            !line.contains("Pattern.compile")
            && // Allow regex patterns
            !line.contains("assertThat")
            && // Allow test assertions
            !line.contains("\"password\"")
            && // Allow string literals in validation
            !line.contains("\"secret\"")
            && !line.contains("\"key\"")) {

          throw new AssertionError(
              String.format(
                  "Potential hardcoded secret found in %s at line %d: %s",
                  file, i + 1, line.trim()));
        }
      }
    } catch (IOException e) {
      throw new RuntimeException("Failed to read file: " + file, e);
    }
  }

  private void checkExampleFile(String filename) throws IOException {
    Path exampleFile = Paths.get(filename);
    if (Files.exists(exampleFile)) {
      String content = Files.readString(exampleFile);

      // Example files should contain placeholder values, not real secrets
      assertThat(content)
          .as("Example file should contain placeholder instructions")
          .contains("CHANGE_THIS")
          .contains("your-")
          .doesNotContain("admin123")
          .doesNotContain("password123");
    }
  }
}
