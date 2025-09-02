package com.rct.infrastructure.logging;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.ConsoleAppender;
import ch.qos.logback.core.rolling.RollingFileAppender;
import ch.qos.logback.core.rolling.TimeBasedRollingPolicy;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

/** Configuration for structured logging with proper formatting and rotation. */
@Configuration
public class LoggingConfiguration {

  @EventListener(ApplicationReadyEvent.class)
  public void configureLogging() {
    LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();

    // Configure console appender with structured format
    configureConsoleAppender(context);

    // Configure file appender with rotation
    configureFileAppender(context);

    // Set root logger level
    Logger rootLogger = context.getLogger(Logger.ROOT_LOGGER_NAME);
    rootLogger.setLevel(ch.qos.logback.classic.Level.INFO);

    // Set application-specific logger levels
    context.getLogger("com.rct").setLevel(ch.qos.logback.classic.Level.DEBUG);
    context.getLogger("org.springframework.security").setLevel(ch.qos.logback.classic.Level.WARN);
    context.getLogger("org.hibernate").setLevel(ch.qos.logback.classic.Level.WARN);
  }

  private void configureConsoleAppender(LoggerContext context) {
    ConsoleAppender<ILoggingEvent> consoleAppender = new ConsoleAppender<>();
    consoleAppender.setContext(context);
    consoleAppender.setName("CONSOLE");

    PatternLayoutEncoder encoder = new PatternLayoutEncoder();
    encoder.setContext(context);
    encoder.setPattern("%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%logger{36}] - %msg%n");
    encoder.start();

    consoleAppender.setEncoder(encoder);
    consoleAppender.start();

    Logger rootLogger = context.getLogger(Logger.ROOT_LOGGER_NAME);
    rootLogger.addAppender(consoleAppender);
  }

  private void configureFileAppender(LoggerContext context) {
    RollingFileAppender<ILoggingEvent> fileAppender = new RollingFileAppender<>();
    fileAppender.setContext(context);
    fileAppender.setName("FILE");
    fileAppender.setFile("logs/rct-application.log");

    TimeBasedRollingPolicy<ILoggingEvent> rollingPolicy = new TimeBasedRollingPolicy<>();
    rollingPolicy.setContext(context);
    rollingPolicy.setParent(fileAppender);
    rollingPolicy.setFileNamePattern("logs/rct-application.%d{yyyy-MM-dd}.%i.log.gz");
    rollingPolicy.setMaxHistory(30); // Keep 30 days of logs
    rollingPolicy.start();

    PatternLayoutEncoder encoder = new PatternLayoutEncoder();
    encoder.setContext(context);
    encoder.setPattern(
        "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%logger{36}] [%X{traceId:-}] - %msg%n");
    encoder.start();

    fileAppender.setRollingPolicy(rollingPolicy);
    fileAppender.setEncoder(encoder);
    fileAppender.start();

    Logger rootLogger = context.getLogger(Logger.ROOT_LOGGER_NAME);
    rootLogger.addAppender(fileAppender);
  }
}
