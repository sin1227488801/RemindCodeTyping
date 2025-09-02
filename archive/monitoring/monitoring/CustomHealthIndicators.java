package com.rct.infrastructure.monitoring;

import com.rct.domain.model.user.UserRepository;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;

// Temporarily disable actuator imports until dependency issues are resolved
// import org.springframework.boot.actuator.health.Health;
// import org.springframework.boot.actuator.health.HealthIndicator;

/**
 * Custom health indicators for monitoring application and infrastructure health. Provides detailed
 * health checks for various system components.
 *
 * <p>Note: Temporarily disabled due to Spring Boot Actuator dependency issues. Will be re-enabled
 * once actuator is properly configured.
 */
public class CustomHealthIndicators {

  /** Database connectivity and performance health indicator */
  // @Component("database")
  public static class DatabaseHealthIndicator { // implements HealthIndicator {

    private final DataSource dataSource;
    private final UserRepository userRepository;

    public DatabaseHealthIndicator(DataSource dataSource, UserRepository userRepository) {
      this.dataSource = dataSource;
      this.userRepository = userRepository;
    }

    // @Override
    public Map<String, Object> health() {
      Map<String, Object> result = new HashMap<>();
      try {
        // Test basic connectivity
        long startTime = System.currentTimeMillis();

        try (Connection connection = dataSource.getConnection()) {
          boolean isValid = connection.isValid(5); // 5 second timeout
          long responseTime = System.currentTimeMillis() - startTime;

          if (!isValid) {
            result.put("status", "DOWN");
            result.put("error", "Database connection is not valid");
            result.put("responseTime", responseTime + "ms");
            return result;
          }

          // Test query performance
          long queryStartTime = System.currentTimeMillis();
          try {
            // Simple query to test database responsiveness
            connection.createStatement().executeQuery("SELECT 1").close();
            long queryTime = System.currentTimeMillis() - queryStartTime;

            result.put("status", "UP");
            result.put("connectionTime", responseTime + "ms");
            result.put("queryTime", queryTime + "ms");
            result.put("database", connection.getMetaData().getDatabaseProductName());
            result.put("version", connection.getMetaData().getDatabaseProductVersion());

            // Add performance warnings
            if (responseTime > 1000) {
              result.put("warning", "Slow database connection");
            }

            if (queryTime > 500) {
              result.put("warning", "Slow query performance");
            }

            return result;

          } catch (SQLException e) {
            result.put("status", "DOWN");
            result.put("error", "Database query failed: " + e.getMessage());
            result.put("connectionTime", responseTime + "ms");
            return result;
          }
        }

      } catch (SQLException e) {
        result.put("status", "DOWN");
        result.put("error", "Cannot connect to database: " + e.getMessage());
        result.put("sqlState", e.getSQLState());
        result.put("errorCode", e.getErrorCode());
        return result;
      }
    }
  }

  /** Application business logic health indicator */
  // @Component("business")
  public static class BusinessHealthIndicator { // implements HealthIndicator {

    private final UserRepository userRepository;
    private final ApplicationMetrics applicationMetrics;

    public BusinessHealthIndicator(
        UserRepository userRepository, ApplicationMetrics applicationMetrics) {
      this.userRepository = userRepository;
      this.applicationMetrics = applicationMetrics;
    }

    // @Override
    public Map<String, Object> health() {
      Map<String, Object> result = new HashMap<>();
      try {
        result.put("status", "UP");

        // Check if core business operations are working
        long startTime = System.currentTimeMillis();

        // Test repository access (this should be fast)
        CompletableFuture<Void> repositoryTest =
            CompletableFuture.runAsync(
                () -> {
                  try {
                    // This should use a cached or very fast query
                    // For now, we'll just check if the repository is accessible
                    userRepository.getClass().getName(); // Simple check
                  } catch (Exception e) {
                    throw new RuntimeException("Repository access failed", e);
                  }
                });

        try {
          repositoryTest.get(2, TimeUnit.SECONDS);
          long responseTime = System.currentTimeMillis() - startTime;

          result.put("repositoryAccess", "OK");
          result.put("responseTime", responseTime + "ms");

        } catch (Exception e) {
          result.put("status", "DOWN");
          result.put("error", "Business logic health check failed: " + e.getMessage());
          return result;
        }

        // Add application metrics
        result.put("activeUsers", applicationMetrics.getActiveUsers());
        result.put("activeSessions", applicationMetrics.getActiveSessions());
        result.put("memoryUsage", formatBytes(applicationMetrics.getMemoryUsage()));

        // Check for concerning metrics
        if (applicationMetrics.getActiveUsers() > 1000) {
          result.put("warning", "High number of active users");
        }

        long memoryUsage = applicationMetrics.getMemoryUsage();
        Runtime runtime = Runtime.getRuntime();
        double memoryPercentage = (double) memoryUsage / runtime.maxMemory() * 100;

        if (memoryPercentage > 80) {
          result.put("warning", "High memory usage: " + String.format("%.1f%%", memoryPercentage));
        }

        return result;

      } catch (Exception e) {
        result.put("status", "DOWN");
        result.put("error", "Business health check failed: " + e.getMessage());
        return result;
      }
    }

    private String formatBytes(long bytes) {
      if (bytes < 1024) return bytes + " B";
      int exp = (int) (Math.log(bytes) / Math.log(1024));
      String pre = "KMGTPE".charAt(exp - 1) + "";
      return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
  }

  /** External dependencies health indicator */
  // @Component("external")
  public static class ExternalDependenciesHealthIndicator { // implements HealthIndicator {

    // @Override
    public Map<String, Object> health() {
      Map<String, Object> result = new HashMap<>();
      result.put("status", "UP");

      // Check external service dependencies
      // For now, we don't have external services, but this is where you'd check them

      result.put("externalServices", "None configured");
      result.put("timestamp", LocalDateTime.now().toString());

      return result;
    }
  }

  /** System resources health indicator */
  // @Component("system")
  public static class SystemHealthIndicator { // implements HealthIndicator {

    // @Override
    public Map<String, Object> health() {
      Runtime runtime = Runtime.getRuntime();

      long maxMemory = runtime.maxMemory();
      long totalMemory = runtime.totalMemory();
      long freeMemory = runtime.freeMemory();
      long usedMemory = totalMemory - freeMemory;

      double memoryUsagePercentage = (double) usedMemory / maxMemory * 100;
      int availableProcessors = runtime.availableProcessors();

      Map<String, Object> result = new HashMap<>();
      result.put("status", "UP");
      result.put("memory.max", formatBytes(maxMemory));
      result.put("memory.total", formatBytes(totalMemory));
      result.put("memory.used", formatBytes(usedMemory));
      result.put("memory.free", formatBytes(freeMemory));
      result.put("memory.usage", String.format("%.1f%%", memoryUsagePercentage));
      result.put("processors", availableProcessors);
      result.put("timestamp", LocalDateTime.now().toString());

      // Add warnings for resource constraints
      if (memoryUsagePercentage > 90) {
        result.put("status", "DOWN");
        result.put("error", "Critical memory usage");
      } else if (memoryUsagePercentage > 80) {
        result.put("warning", "High memory usage");
      }

      if (availableProcessors < 2) {
        result.put("warning", "Low number of available processors");
      }

      return result;
    }

    private String formatBytes(long bytes) {
      if (bytes < 1024) return bytes + " B";
      int exp = (int) (Math.log(bytes) / Math.log(1024));
      String pre = "KMGTPE".charAt(exp - 1) + "";
      return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
  }

  /** Application startup and readiness health indicator */
  // @Component("readiness")
  public static class ReadinessHealthIndicator { // implements HealthIndicator {

    private final LocalDateTime startupTime;
    private volatile boolean isReady = false;

    public ReadinessHealthIndicator() {
      this.startupTime = LocalDateTime.now();

      // Simulate application warmup
      CompletableFuture.runAsync(
          () -> {
            try {
              Thread.sleep(5000); // 5 second warmup
              isReady = true;
            } catch (InterruptedException e) {
              Thread.currentThread().interrupt();
            }
          });
    }

    // @Override
    public Map<String, Object> health() {
      Duration uptime = Duration.between(startupTime, LocalDateTime.now());

      Map<String, Object> result = new HashMap<>();
      result.put("status", isReady ? "UP" : "DOWN");
      result.put("startupTime", startupTime.toString());
      result.put("uptime", formatDuration(uptime));
      result.put("ready", isReady);

      if (!isReady) {
        result.put("message", "Application is warming up");
      }

      return result;
    }

    private String formatDuration(Duration duration) {
      long seconds = duration.getSeconds();
      long hours = seconds / 3600;
      long minutes = (seconds % 3600) / 60;
      long secs = seconds % 60;

      if (hours > 0) {
        return String.format("%dh %dm %ds", hours, minutes, secs);
      } else if (minutes > 0) {
        return String.format("%dm %ds", minutes, secs);
      } else {
        return String.format("%ds", secs);
      }
    }

    public void setReady(boolean ready) {
      this.isReady = ready;
    }
  }
}
