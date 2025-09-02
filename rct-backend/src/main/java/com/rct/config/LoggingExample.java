package com.rct.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Example class demonstrating proper logging usage with environment-specific configuration This
 * class shows how different log levels work across different environments
 */
@Component
public class LoggingExample {

  private static final Logger logger = LoggerFactory.getLogger(LoggingExample.class);

  /**
   * Demonstrates different log levels In production: Only WARN and ERROR will be logged In
   * development: DEBUG, INFO, WARN, and ERROR will be logged In test: DEBUG, INFO, WARN, and ERROR
   * will be logged
   */
  public void demonstrateLogging() {
    logger.debug("DEBUG: This message will only appear in dev and test environments");
    logger.info("INFO: This message will appear in dev, test, and staging environments");
    logger.warn("WARN: This message will appear in all environments");
    logger.error("ERROR: This message will appear in all environments");
  }

  /** Demonstrates proper error logging with exception details */
  public void demonstrateErrorLogging() {
    try {
      // Simulate an operation that might fail
      throw new RuntimeException("Simulated error for logging demonstration");
    } catch (Exception e) {
      logger.error("An error occurred during operation: {}", e.getMessage(), e);
    }
  }

  /** Demonstrates logging with parameters (safer than string concatenation) */
  public void demonstrateParameterizedLogging(String userId, String operation) {
    logger.info("User {} performed operation: {}", userId, operation);
    logger.debug("Debug info for user {} operation {}: additional details", userId, operation);
  }

  /**
   * Demonstrates what NOT to log (sensitive information) These will be filtered out by our logback
   * configuration
   */
  public void demonstrateSensitiveInfoFiltering(String username) {
    // These will be filtered out by our configuration
    logger.info("User password: secret123"); // Will be filtered
    logger.info("Generated token: abc123"); // Will be filtered
    logger.info("Hash value: $2a$10$hash"); // Will be filtered
    logger.info("API key: sk-1234567890"); // Will be filtered
    logger.info("Secret config: mysecret"); // Will be filtered

    // This is safe to log
    logger.info("User {} logged in successfully", username);
  }

  /** Demonstrates conditional logging for performance */
  public void demonstrateConditionalLogging() {
    // For expensive operations, check if logging is enabled first
    if (logger.isDebugEnabled()) {
      String expensiveDebugInfo = generateExpensiveDebugInfo();
      logger.debug("Expensive debug info: {}", expensiveDebugInfo);
    }

    // For simple messages, direct logging is fine
    logger.info("Simple info message");
  }

  private String generateExpensiveDebugInfo() {
    // Simulate expensive operation
    return "Expensive debug information that takes time to generate";
  }
}
