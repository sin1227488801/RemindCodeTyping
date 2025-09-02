package com.rct.infrastructure.monitoring;

import io.micrometer.core.instrument.binder.jvm.ClassLoaderMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmGcMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmMemoryMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmThreadMetrics;
import io.micrometer.core.instrument.binder.system.ProcessorMetrics;
import io.micrometer.core.instrument.binder.system.UptimeMetrics;
// import org.springframework.boot.actuator.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Configuration for application monitoring and metrics collection. Sets up comprehensive monitoring
 * for performance, health, and business metrics.
 */
@Configuration
@EnableScheduling
public class MonitoringConfig {

  private final ApplicationMetrics applicationMetrics;

  public MonitoringConfig(ApplicationMetrics applicationMetrics) {
    this.applicationMetrics = applicationMetrics;
  }

  /** Customize meter registry with common tags and settings */
  @Bean
  public Object metricsCommonTags() {
    return registry -> {
      registry
          .config()
          .commonTags(
              "application",
              "remind-code-typing",
              "version",
              getClass().getPackage().getImplementationVersion() != null
                  ? getClass().getPackage().getImplementationVersion()
                  : "development",
              "environment",
              System.getProperty("spring.profiles.active", "default"));
    };
  }

  /** Register JVM metrics for comprehensive system monitoring */
  @Bean
  public JvmMemoryMetrics jvmMemoryMetrics() {
    return new JvmMemoryMetrics();
  }

  @Bean
  public JvmGcMetrics jvmGcMetrics() {
    return new JvmGcMetrics();
  }

  @Bean
  public JvmThreadMetrics jvmThreadMetrics() {
    return new JvmThreadMetrics();
  }

  @Bean
  public ClassLoaderMetrics classLoaderMetrics() {
    return new ClassLoaderMetrics();
  }

  @Bean
  public ProcessorMetrics processorMetrics() {
    return new ProcessorMetrics();
  }

  @Bean
  public UptimeMetrics uptimeMetrics() {
    return new UptimeMetrics();
  }

  /** Scheduled task to update system metrics */
  @Scheduled(fixedRate = 30000) // Every 30 seconds
  public void updateSystemMetrics() {
    applicationMetrics.updateMemoryUsage();

    // Update other system metrics as needed
    // This could include database connection pool metrics,
    // active user counts, etc.
  }

  /** Scheduled task to perform health checks and update metrics */
  @Scheduled(fixedRate = 60000) // Every minute
  public void performHealthChecks() {
    // Perform periodic health checks and update metrics
    // This could include checking external service availability,
    // database performance, etc.

    // Example: Update active user count
    // In a real implementation, this would query the database or cache
    // applicationMetrics.setActiveUsers(userService.getActiveUserCount());
  }

  /** Scheduled task for cleanup and maintenance */
  @Scheduled(cron = "0 0 * * * *") // Every hour
  public void performMaintenance() {
    // Perform periodic maintenance tasks
    // This could include cache cleanup, log rotation, etc.

    System.gc(); // Suggest garbage collection (use sparingly)
  }
}
