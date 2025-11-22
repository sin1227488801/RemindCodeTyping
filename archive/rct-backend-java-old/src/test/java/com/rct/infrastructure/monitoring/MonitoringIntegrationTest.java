package com.rct.infrastructure.monitoring;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.rct.integration.BaseIntegrationTest;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Integration tests for monitoring and metrics functionality. Verifies that metrics collection,
 * health checks, and monitoring endpoints work correctly.
 */
@AutoConfigureWebMvc
class MonitoringIntegrationTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private MeterRegistry meterRegistry;

  @Autowired private ApplicationMetrics applicationMetrics;

  @Test
  void shouldExposeHealthEndpoint() throws Exception {
    mockMvc
        .perform(get("/actuator/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
  }

  @Test
  void shouldExposeDetailedHealthInformation() throws Exception {
    mockMvc
        .perform(get("/actuator/health/database"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").exists())
        .andExpect(jsonPath("$.details").exists());
  }

  @Test
  void shouldExposeMetricsEndpoint() throws Exception {
    // First, generate some metrics
    applicationMetrics.incrementUserLogins();
    applicationMetrics.incrementApiRequests("/test", "GET");

    mockMvc
        .perform(get("/actuator/metrics"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.names").isArray());
  }

  @Test
  void shouldTrackBusinessMetrics() {
    // Test user registration metric
    double initialRegistrations = getCounterValue("rct.users.registrations");
    applicationMetrics.incrementUserRegistrations();
    double afterRegistrations = getCounterValue("rct.users.registrations");

    assertThat(afterRegistrations).isEqualTo(initialRegistrations + 1);

    // Test user login metric
    double initialLogins = getCounterValue("rct.users.logins");
    applicationMetrics.incrementUserLogins();
    double afterLogins = getCounterValue("rct.users.logins");

    assertThat(afterLogins).isEqualTo(initialLogins + 1);

    // Test study book creation metric
    double initialStudyBooks = getCounterValue("rct.studybooks.created");
    applicationMetrics.incrementStudyBookCreations();
    double afterStudyBooks = getCounterValue("rct.studybooks.created");

    assertThat(afterStudyBooks).isEqualTo(initialStudyBooks + 1);
  }

  @Test
  void shouldTrackTechnicalMetrics() {
    // Test API request metric
    String endpoint = "/api/test";
    String method = "GET";

    double initialRequests =
        getCounterValue("rct.api.requests", "endpoint", endpoint, "method", method);
    applicationMetrics.incrementApiRequests(endpoint, method);
    double afterRequests =
        getCounterValue("rct.api.requests", "endpoint", endpoint, "method", method);

    assertThat(afterRequests).isEqualTo(initialRequests + 1);

    // Test API error metric
    String errorType = "validation_error";
    double initialErrors =
        getCounterValue(
            "rct.api.errors", "endpoint", endpoint, "method", method, "error_type", errorType);
    applicationMetrics.incrementApiErrors(endpoint, method, errorType);
    double afterErrors =
        getCounterValue(
            "rct.api.errors", "endpoint", endpoint, "method", method, "error_type", errorType);

    assertThat(afterErrors).isEqualTo(initialErrors + 1);
  }

  @Test
  void shouldTrackTimingMetrics() {
    // Test API response time
    Timer.Sample sample = applicationMetrics.startApiTimer();

    // Simulate some processing time
    try {
      Thread.sleep(50);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }

    applicationMetrics.recordApiResponseTime(sample, "/api/test", "GET", 200);

    // Verify timer was recorded
    Timer timer =
        meterRegistry
            .find("rct.api.response.time")
            .tag("endpoint", "/api/test")
            .tag("method", "GET")
            .tag("status", "200")
            .timer();

    assertThat(timer).isNotNull();
    assertThat(timer.count()).isGreaterThan(0);
    assertThat(timer.mean(java.util.concurrent.TimeUnit.MILLISECONDS)).isGreaterThan(40);
  }

  @Test
  void shouldTrackSystemMetrics() {
    // Test active users metric
    long initialActiveUsers = applicationMetrics.getActiveUsers();
    applicationMetrics.incrementActiveUsers();
    long afterIncrement = applicationMetrics.getActiveUsers();

    assertThat(afterIncrement).isEqualTo(initialActiveUsers + 1);

    applicationMetrics.decrementActiveUsers();
    long afterDecrement = applicationMetrics.getActiveUsers();

    assertThat(afterDecrement).isEqualTo(initialActiveUsers);

    // Test memory usage metric
    applicationMetrics.updateMemoryUsage();
    long memoryUsage = applicationMetrics.getMemoryUsage();

    assertThat(memoryUsage).isGreaterThan(0);
  }

  @Test
  void shouldTrackCacheMetrics() {
    String cacheType = "user_data";

    double initialHits = getCounterValue("rct.cache.hits", "cache_type", cacheType);
    applicationMetrics.incrementCacheHits(cacheType);
    double afterHits = getCounterValue("rct.cache.hits", "cache_type", cacheType);

    assertThat(afterHits).isEqualTo(initialHits + 1);

    double initialMisses = getCounterValue("rct.cache.misses", "cache_type", cacheType);
    applicationMetrics.incrementCacheMisses(cacheType);
    double afterMisses = getCounterValue("rct.cache.misses", "cache_type", cacheType);

    assertThat(afterMisses).isEqualTo(initialMisses + 1);
  }

  @Test
  void shouldTrackCustomMetrics() {
    // Test custom counter
    Counter customCounter =
        applicationMetrics.createCustomCounter("test.counter", "Test counter", "type", "test");

    double initialValue = customCounter.count();
    customCounter.increment();
    double afterIncrement = customCounter.count();

    assertThat(afterIncrement).isEqualTo(initialValue + 1);

    // Test custom timer
    Duration testDuration = Duration.ofMillis(100);
    applicationMetrics.recordCustomTimer("test.timer", testDuration, "operation", "test");

    Timer customTimer =
        meterRegistry.find("rct.custom.test.timer").tag("operation", "test").timer();

    assertThat(customTimer).isNotNull();
    assertThat(customTimer.count()).isGreaterThan(0);
  }

  @Test
  void shouldTrackUserActivityMetrics() {
    String userId = "test-user-123";
    String activity = "login";

    double initialActivity =
        getCounterValue("rct.user.activity", "user_id", userId, "activity", activity);
    applicationMetrics.recordUserActivity(userId, activity);
    double afterActivity =
        getCounterValue("rct.user.activity", "user_id", userId, "activity", activity);

    assertThat(afterActivity).isEqualTo(initialActivity + 1);
  }

  @Test
  void shouldTrackLanguageUsageMetrics() {
    String language = "Java";

    double initialUsage = getCounterValue("rct.language.usage", "language", language);
    applicationMetrics.recordLanguageUsage(language);
    double afterUsage = getCounterValue("rct.language.usage", "language", language);

    assertThat(afterUsage).isEqualTo(initialUsage + 1);
  }

  @Test
  void shouldExposePrometheusMetrics() throws Exception {
    // Generate some metrics first
    applicationMetrics.incrementUserLogins();
    applicationMetrics.incrementApiRequests("/test", "GET");

    mockMvc.perform(get("/actuator/prometheus")).andExpect(status().isOk());
  }

  @Test
  void shouldProvideHealthCheckDetails() throws Exception {
    mockMvc
        .perform(get("/actuator/health/system"))
        .andExpected(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"))
        .andExpect(jsonPath("$.details.memory").exists())
        .andExpect(jsonPath("$.details.processors").exists());
  }

  @Test
  void shouldProvideApplicationInfo() throws Exception {
    mockMvc.perform(get("/actuator/info")).andExpect(status().isOk());
  }

  // Helper methods

  private double getCounterValue(String name, String... tags) {
    Counter counter = meterRegistry.find(name).tags(tags).counter();
    return counter != null ? counter.count() : 0.0;
  }
}
