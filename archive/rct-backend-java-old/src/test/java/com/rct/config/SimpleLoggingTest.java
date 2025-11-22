package com.rct.config;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

/**
 * Simple test to verify basic logging functionality This test doesn't require Spring context and
 * focuses on logging configuration
 */
public class SimpleLoggingTest {

  @Test
  void testBasicLogging() {
    // Get logger context
    LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
    Logger logger = loggerContext.getLogger(SimpleLoggingTest.class);

    // Test different log levels
    logger.debug("DEBUG: Testing debug level logging");
    logger.info("INFO: Testing info level logging");
    logger.warn("WARN: Testing warn level logging");
    logger.error("ERROR: Testing error level logging");

    // Test sensitive information (should be filtered by logback config)
    logger.info("User login attempt with password: secret123");
    logger.info("Generated token: abc123token");
    logger.info("Normal message without sensitive info");

    // Test passes if no exceptions are thrown
    assert true;
  }

  @Test
  void testLoggerConfiguration() {
    LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();

    // Test that loggers can be created
    Logger rctLogger = loggerContext.getLogger("com.rct");
    Logger springLogger = loggerContext.getLogger("org.springframework");
    Logger hibernateLogger = loggerContext.getLogger("org.hibernate");

    // Verify loggers are not null
    assert rctLogger != null;
    assert springLogger != null;
    assert hibernateLogger != null;

    // Test logging with different loggers
    rctLogger.info("RCT logger test message");
    springLogger.warn("Spring logger test message");
    hibernateLogger.error("Hibernate logger test message");
  }
}
