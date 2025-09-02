package com.rct.infrastructure.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/**
 * Application metrics collector for monitoring key performance indicators. Provides business and
 * technical metrics for observability.
 */
@Component
public class ApplicationMetrics {

  private final MeterRegistry meterRegistry;

  // Business metrics
  private final Counter userRegistrations;
  private final Counter userLogins;
  private final Counter studyBookCreations;
  private final Counter typingSessionsStarted;
  private final Counter typingSessionsCompleted;

  // Technical metrics
  private final Counter apiRequests;
  private final Counter apiErrors;
  private final Timer apiResponseTime;
  private final Counter databaseQueries;
  private final Timer databaseQueryTime;
  private final Counter cacheHits;
  private final Counter cacheMisses;

  // System metrics
  private final AtomicLong activeUsers = new AtomicLong(0);
  private final AtomicLong activeSessions = new AtomicLong(0);
  private final AtomicLong memoryUsage = new AtomicLong(0);

  public ApplicationMetrics(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;

    // Initialize business metrics
    this.userRegistrations =
        Counter.builder("rct.users.registrations")
            .description("Total number of user registrations")
            .register(meterRegistry);

    this.userLogins =
        Counter.builder("rct.users.logins")
            .description("Total number of user logins")
            .register(meterRegistry);

    this.studyBookCreations =
        Counter.builder("rct.studybooks.created")
            .description("Total number of study books created")
            .register(meterRegistry);

    this.typingSessionsStarted =
        Counter.builder("rct.typing.sessions.started")
            .description("Total number of typing sessions started")
            .register(meterRegistry);

    this.typingSessionsCompleted =
        Counter.builder("rct.typing.sessions.completed")
            .description("Total number of typing sessions completed")
            .register(meterRegistry);

    // Initialize technical metrics
    this.apiRequests =
        Counter.builder("rct.api.requests")
            .description("Total number of API requests")
            .register(meterRegistry);

    this.apiErrors =
        Counter.builder("rct.api.errors")
            .description("Total number of API errors")
            .register(meterRegistry);

    this.apiResponseTime =
        Timer.builder("rct.api.response.time")
            .description("API response time")
            .register(meterRegistry);

    this.databaseQueries =
        Counter.builder("rct.database.queries")
            .description("Total number of database queries")
            .register(meterRegistry);

    this.databaseQueryTime =
        Timer.builder("rct.database.query.time")
            .description("Database query execution time")
            .register(meterRegistry);

    this.cacheHits =
        Counter.builder("rct.cache.hits")
            .description("Total number of cache hits")
            .register(meterRegistry);

    this.cacheMisses =
        Counter.builder("rct.cache.misses")
            .description("Total number of cache misses")
            .register(meterRegistry);

    // Initialize system metrics gauges
    Gauge.builder("rct.users.active")
        .description("Number of currently active users")
        .register(meterRegistry, this, ApplicationMetrics::getActiveUsers);

    Gauge.builder("rct.sessions.active")
        .description("Number of currently active sessions")
        .register(meterRegistry, this, ApplicationMetrics::getActiveSessions);

    Gauge.builder("rct.memory.usage")
        .description("Current memory usage in bytes")
        .register(meterRegistry, this, ApplicationMetrics::getMemoryUsage);
  }

  // Business metrics methods
  public void incrementUserRegistrations() {
    userRegistrations.increment();
  }

  public void incrementUserLogins() {
    userLogins.increment();
  }

  public void incrementStudyBookCreations() {
    studyBookCreations.increment();
  }

  public void incrementTypingSessionsStarted() {
    typingSessionsStarted.increment();
  }

  public void incrementTypingSessionsCompleted() {
    typingSessionsCompleted.increment();
  }

  // Technical metrics methods
  public void incrementApiRequests(String endpoint, String method) {
    apiRequests.increment(
        "endpoint", endpoint,
        "method", method);
  }

  public void incrementApiErrors(String endpoint, String method, String errorType) {
    apiErrors.increment(
        "endpoint", endpoint,
        "method", method,
        "error_type", errorType);
  }

  public Timer.Sample startApiTimer() {
    return Timer.start(meterRegistry);
  }

  public void recordApiResponseTime(
      Timer.Sample sample, String endpoint, String method, int statusCode) {
    sample.stop(
        Timer.builder("rct.api.response.time")
            .tag("endpoint", endpoint)
            .tag("method", method)
            .tag("status", String.valueOf(statusCode))
            .register(meterRegistry));
  }

  public void incrementDatabaseQueries(String operation, String table) {
    databaseQueries.increment(
        "operation", operation,
        "table", table);
  }

  public Timer.Sample startDatabaseTimer() {
    return Timer.start(meterRegistry);
  }

  public void recordDatabaseQueryTime(Timer.Sample sample, String operation, String table) {
    sample.stop(
        Timer.builder("rct.database.query.time")
            .tag("operation", operation)
            .tag("table", table)
            .register(meterRegistry));
  }

  public void incrementCacheHits(String cacheType) {
    cacheHits.increment("cache_type", cacheType);
  }

  public void incrementCacheMisses(String cacheType) {
    cacheMisses.increment("cache_type", cacheType);
  }

  // System metrics methods
  public void setActiveUsers(long count) {
    activeUsers.set(count);
  }

  public void incrementActiveUsers() {
    activeUsers.incrementAndGet();
  }

  public void decrementActiveUsers() {
    activeUsers.decrementAndGet();
  }

  public long getActiveUsers() {
    return activeUsers.get();
  }

  public void setActiveSessions(long count) {
    activeSessions.set(count);
  }

  public void incrementActiveSessions() {
    activeSessions.incrementAndGet();
  }

  public void decrementActiveSessions() {
    activeSessions.decrementAndGet();
  }

  public long getActiveSessions() {
    return activeSessions.get();
  }

  public void updateMemoryUsage() {
    Runtime runtime = Runtime.getRuntime();
    long usedMemory = runtime.totalMemory() - runtime.freeMemory();
    memoryUsage.set(usedMemory);
  }

  public long getMemoryUsage() {
    return memoryUsage.get();
  }

  // Custom metrics methods
  public void recordCustomMetric(String name, double value, String... tags) {
    Gauge.builder("rct.custom." + name).tags(tags).register(meterRegistry, () -> value);
  }

  public void recordCustomTimer(String name, Duration duration, String... tags) {
    Timer.builder("rct.custom." + name).tags(tags).register(meterRegistry).record(duration);
  }

  public Counter createCustomCounter(String name, String description, String... tags) {
    return Counter.builder("rct.custom." + name)
        .description(description)
        .tags(tags)
        .register(meterRegistry);
  }

  // Utility methods for common patterns
  public void recordUserActivity(String userId, String activity) {
    Counter.builder("rct.user.activity")
        .tag("user_id", userId)
        .tag("activity", activity)
        .register(meterRegistry)
        .increment();
  }

  public void recordLanguageUsage(String language) {
    Counter.builder("rct.language.usage")
        .tag("language", language)
        .register(meterRegistry)
        .increment();
  }

  public void recordAccuracyMetric(String userId, double accuracy) {
    Gauge.builder("rct.typing.accuracy")
        .tag("user_id", userId)
        .register(meterRegistry, () -> accuracy);
  }

  public void recordSessionDuration(String userId, Duration duration) {
    Timer.builder("rct.typing.session.duration")
        .tag("user_id", userId)
        .register(meterRegistry)
        .record(duration);
  }
}
