package com.rct.performance;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rct.integration.BaseIntegrationTest;
import com.rct.presentation.dto.request.CreateStudyBookRequest;
import com.rct.presentation.dto.request.LoginRequest;
import com.rct.presentation.dto.request.RecordTypingResultRequest;
import com.rct.presentation.dto.request.RegisterRequest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * Load testing suite to validate system performance under various load conditions. These tests
 * simulate realistic user loads and measure response times and throughput.
 */
@AutoConfigureWebMvc
@Transactional
class LoadTestSuite extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  private static final int CONCURRENT_USERS = 10;
  private static final int OPERATIONS_PER_USER = 5;
  private static final long MAX_RESPONSE_TIME_MS = 2000;

  @Test
  @DisplayName("Load Test: Concurrent user registration and authentication")
  void shouldHandleConcurrentUserRegistration() throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
    List<CompletableFuture<LoadTestResult>> futures = new ArrayList<>();
    AtomicInteger successCount = new AtomicInteger(0);
    AtomicInteger errorCount = new AtomicInteger(0);
    AtomicLong totalResponseTime = new AtomicLong(0);

    // Simulate concurrent user registrations
    for (int i = 0; i < CONCURRENT_USERS; i++) {
      final int userIndex = i;
      CompletableFuture<LoadTestResult> future =
          CompletableFuture.supplyAsync(
              () -> {
                try {
                  long startTime = System.currentTimeMillis();

                  RegisterRequest registerRequest = new RegisterRequest();
                  registerRequest.setLoginId("loaduser" + userIndex);
                  registerRequest.setPassword("LoadTest123!");

                  MvcResult result =
                      mockMvc
                          .perform(
                              post("/api/auth/register")
                                  .contentType(MediaType.APPLICATION_JSON)
                                  .content(objectMapper.writeValueAsString(registerRequest)))
                          .andExpect(status().isCreated())
                          .andReturn();

                  long responseTime = System.currentTimeMillis() - startTime;
                  totalResponseTime.addAndGet(responseTime);
                  successCount.incrementAndGet();

                  String response = result.getResponse().getContentAsString();
                  String userId = objectMapper.readTree(response).get("userId").asText();
                  String token = objectMapper.readTree(response).get("token").asText();

                  return new LoadTestResult(true, responseTime, userId, token);
                } catch (Exception e) {
                  errorCount.incrementAndGet();
                  return new LoadTestResult(false, 0, null, null);
                }
              },
              executor);
      futures.add(future);
    }

    // Wait for all registrations to complete
    List<LoadTestResult> results = new ArrayList<>();
    for (CompletableFuture<LoadTestResult> future : futures) {
      results.add(future.get(30, TimeUnit.SECONDS));
    }

    executor.shutdown();

    // Validate results
    assert successCount.get() == CONCURRENT_USERS
        : "Expected " + CONCURRENT_USERS + " successful registrations, got " + successCount.get();
    assert errorCount.get() == 0 : "Expected 0 errors, got " + errorCount.get();

    long averageResponseTime = totalResponseTime.get() / CONCURRENT_USERS;
    assert averageResponseTime < MAX_RESPONSE_TIME_MS
        : "Average response time "
            + averageResponseTime
            + "ms exceeds limit "
            + MAX_RESPONSE_TIME_MS
            + "ms";

    System.out.println("Concurrent Registration Test Results:");
    System.out.println("- Successful registrations: " + successCount.get());
    System.out.println("- Average response time: " + averageResponseTime + "ms");
    System.out.println("- Total time: " + totalResponseTime.get() + "ms");

    // Test concurrent logins with the registered users
    testConcurrentLogins(results);
  }

  private void testConcurrentLogins(List<LoadTestResult> registrationResults) throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
    List<CompletableFuture<LoadTestResult>> futures = new ArrayList<>();
    AtomicInteger successCount = new AtomicInteger(0);
    AtomicLong totalResponseTime = new AtomicLong(0);

    for (int i = 0; i < registrationResults.size(); i++) {
      final int userIndex = i;
      CompletableFuture<LoadTestResult> future =
          CompletableFuture.supplyAsync(
              () -> {
                try {
                  long startTime = System.currentTimeMillis();

                  LoginRequest loginRequest = new LoginRequest();
                  loginRequest.setLoginId("loaduser" + userIndex);
                  loginRequest.setPassword("LoadTest123!");

                  mockMvc
                      .perform(
                          post("/api/auth/login")
                              .contentType(MediaType.APPLICATION_JSON)
                              .content(objectMapper.writeValueAsString(loginRequest)))
                      .andExpect(status().isOk());

                  long responseTime = System.currentTimeMillis() - startTime;
                  totalResponseTime.addAndGet(responseTime);
                  successCount.incrementAndGet();

                  return new LoadTestResult(true, responseTime, null, null);
                } catch (Exception e) {
                  return new LoadTestResult(false, 0, null, null);
                }
              },
              executor);
      futures.add(future);
    }

    // Wait for all logins to complete
    for (CompletableFuture<LoadTestResult> future : futures) {
      future.get(30, TimeUnit.SECONDS);
    }

    executor.shutdown();

    long averageResponseTime = totalResponseTime.get() / CONCURRENT_USERS;
    System.out.println("Concurrent Login Test Results:");
    System.out.println("- Successful logins: " + successCount.get());
    System.out.println("- Average response time: " + averageResponseTime + "ms");
  }

  @Test
  @DisplayName("Load Test: Concurrent study book operations")
  void shouldHandleConcurrentStudyBookOperations() throws Exception {
    // Create a test user first
    UserSession user = createTestUser("studybookloaduser", "LoadTest123!");

    ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
    List<CompletableFuture<String>> createFutures = new ArrayList<>();
    AtomicInteger successCount = new AtomicInteger(0);
    AtomicLong totalResponseTime = new AtomicLong(0);

    // Concurrent study book creation
    for (int i = 0; i < OPERATIONS_PER_USER; i++) {
      final int operationIndex = i;
      CompletableFuture<String> future =
          CompletableFuture.supplyAsync(
              () -> {
                try {
                  long startTime = System.currentTimeMillis();

                  CreateStudyBookRequest request = new CreateStudyBookRequest();
                  request.setLanguage("JavaScript");
                  request.setQuestion(
                      "function loadTest"
                          + operationIndex
                          + "() { return "
                          + operationIndex
                          + "; }");
                  request.setExplanation("Load test study book " + operationIndex);

                  MvcResult result =
                      mockMvc
                          .perform(
                              post("/api/studybooks")
                                  .header("X-User-Id", user.userId)
                                  .header("Authorization", "Bearer " + user.token)
                                  .contentType(MediaType.APPLICATION_JSON)
                                  .content(objectMapper.writeValueAsString(request)))
                          .andExpect(status().isCreated())
                          .andReturn();

                  long responseTime = System.currentTimeMillis() - startTime;
                  totalResponseTime.addAndGet(responseTime);
                  successCount.incrementAndGet();

                  String response = result.getResponse().getContentAsString();
                  return objectMapper.readTree(response).get("id").asText();
                } catch (Exception e) {
                  throw new RuntimeException(e);
                }
              },
              executor);
      createFutures.add(future);
    }

    // Wait for all creations to complete and collect IDs
    List<String> studyBookIds = new ArrayList<>();
    for (CompletableFuture<String> future : createFutures) {
      studyBookIds.add(future.get(30, TimeUnit.SECONDS));
    }

    long averageCreateTime = totalResponseTime.get() / OPERATIONS_PER_USER;
    System.out.println("Study Book Creation Results:");
    System.out.println("- Created study books: " + successCount.get());
    System.out.println("- Average creation time: " + averageCreateTime + "ms");

    // Test concurrent reading
    testConcurrentStudyBookReading(user, studyBookIds);

    // Test concurrent updates
    testConcurrentStudyBookUpdates(user, studyBookIds);

    executor.shutdown();
  }

  private void testConcurrentStudyBookReading(UserSession user, List<String> studyBookIds)
      throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
    List<CompletableFuture<Void>> futures = new ArrayList<>();
    AtomicLong totalResponseTime = new AtomicLong(0);
    AtomicInteger readCount = new AtomicInteger(0);

    // Concurrent reading operations
    for (int i = 0; i < 20; i++) { // More reads than creates to simulate realistic usage
      CompletableFuture<Void> future =
          CompletableFuture.runAsync(
              () -> {
                try {
                  long startTime = System.currentTimeMillis();

                  mockMvc
                      .perform(
                          get("/api/studybooks")
                              .header("X-User-Id", user.userId)
                              .header("Authorization", "Bearer " + user.token)
                              .param("page", "0")
                              .param("size", "10"))
                      .andExpect(status().isOk());

                  long responseTime = System.currentTimeMillis() - startTime;
                  totalResponseTime.addAndGet(responseTime);
                  readCount.incrementAndGet();
                } catch (Exception e) {
                  throw new RuntimeException(e);
                }
              },
              executor);
      futures.add(future);
    }

    // Wait for all reads to complete
    for (CompletableFuture<Void> future : futures) {
      future.get(30, TimeUnit.SECONDS);
    }

    executor.shutdown();

    long averageReadTime = totalResponseTime.get() / readCount.get();
    System.out.println("Study Book Reading Results:");
    System.out.println("- Read operations: " + readCount.get());
    System.out.println("- Average read time: " + averageReadTime + "ms");

    assert averageReadTime < MAX_RESPONSE_TIME_MS
        : "Average read time " + averageReadTime + "ms exceeds limit";
  }

  private void testConcurrentStudyBookUpdates(UserSession user, List<String> studyBookIds)
      throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
    List<CompletableFuture<Void>> futures = new ArrayList<>();
    AtomicLong totalResponseTime = new AtomicLong(0);
    AtomicInteger updateCount = new AtomicInteger(0);

    // Concurrent update operations
    for (int i = 0; i < studyBookIds.size(); i++) {
      final String studyBookId = studyBookIds.get(i);
      final int updateIndex = i;

      CompletableFuture<Void> future =
          CompletableFuture.runAsync(
              () -> {
                try {
                  long startTime = System.currentTimeMillis();

                  CreateStudyBookRequest updateRequest = new CreateStudyBookRequest();
                  updateRequest.setLanguage("JavaScript");
                  updateRequest.setQuestion(
                      "function updatedLoadTest" + updateIndex + "() { return 'updated'; }");
                  updateRequest.setExplanation("Updated load test study book " + updateIndex);

                  mockMvc
                      .perform(
                          put("/api/studybooks/{id}", studyBookId)
                              .header("X-User-Id", user.userId)
                              .header("Authorization", "Bearer " + user.token)
                              .contentType(MediaType.APPLICATION_JSON)
                              .content(objectMapper.writeValueAsString(updateRequest)))
                      .andExpect(status().isOk());

                  long responseTime = System.currentTimeMillis() - startTime;
                  totalResponseTime.addAndGet(responseTime);
                  updateCount.incrementAndGet();
                } catch (Exception e) {
                  throw new RuntimeException(e);
                }
              },
              executor);
      futures.add(future);
    }

    // Wait for all updates to complete
    for (CompletableFuture<Void> future : futures) {
      future.get(30, TimeUnit.SECONDS);
    }

    executor.shutdown();

    long averageUpdateTime = totalResponseTime.get() / updateCount.get();
    System.out.println("Study Book Update Results:");
    System.out.println("- Update operations: " + updateCount.get());
    System.out.println("- Average update time: " + averageUpdateTime + "ms");
  }

  @Test
  @DisplayName("Load Test: Concurrent typing session recording")
  void shouldHandleConcurrentTypingSessionRecording() throws Exception {
    // Create test user and study book
    UserSession user = createTestUser("typingloaduser", "LoadTest123!");
    String studyBookId = createTestStudyBook(user, "Load test typing", "console.log('load test');");

    ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
    List<CompletableFuture<Void>> futures = new ArrayList<>();
    AtomicInteger successCount = new AtomicInteger(0);
    AtomicLong totalResponseTime = new AtomicLong(0);

    // Simulate concurrent typing sessions
    for (int i = 0; i < OPERATIONS_PER_USER * 2; i++) { // More typing sessions
      final int sessionIndex = i;
      CompletableFuture<Void> future =
          CompletableFuture.runAsync(
              () -> {
                try {
                  long startTime = System.currentTimeMillis();

                  RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
                  typingRequest.setStudyBookId(UUID.fromString(studyBookId));
                  typingRequest.setTypedText("console.log('load test');");
                  typingRequest.setTargetText("console.log('load test');");
                  typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(sessionIndex + 2));
                  typingRequest.setCompletedAt(LocalDateTime.now().minusMinutes(sessionIndex + 1));
                  typingRequest.setTotalCharacters(25);
                  typingRequest.setCorrectCharacters(25);

                  mockMvc
                      .perform(
                          post("/api/typing/results")
                              .header("X-User-Id", user.userId)
                              .header("Authorization", "Bearer " + user.token)
                              .contentType(MediaType.APPLICATION_JSON)
                              .content(objectMapper.writeValueAsString(typingRequest)))
                      .andExpect(status().isCreated());

                  long responseTime = System.currentTimeMillis() - startTime;
                  totalResponseTime.addAndGet(responseTime);
                  successCount.incrementAndGet();
                } catch (Exception e) {
                  throw new RuntimeException(e);
                }
              },
              executor);
      futures.add(future);
    }

    // Wait for all typing sessions to complete
    for (CompletableFuture<Void> future : futures) {
      future.get(30, TimeUnit.SECONDS);
    }

    executor.shutdown();

    long averageResponseTime = totalResponseTime.get() / successCount.get();
    System.out.println("Typing Session Recording Results:");
    System.out.println("- Recorded sessions: " + successCount.get());
    System.out.println("- Average recording time: " + averageResponseTime + "ms");

    assert averageResponseTime < MAX_RESPONSE_TIME_MS
        : "Average recording time " + averageResponseTime + "ms exceeds limit";

    // Test statistics calculation performance with many sessions
    testStatisticsCalculationPerformance(user, successCount.get());
  }

  private void testStatisticsCalculationPerformance(UserSession user, int expectedSessions)
      throws Exception {
    long startTime = System.currentTimeMillis();

    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSessions").value(expectedSessions));

    long statisticsTime = System.currentTimeMillis() - startTime;
    System.out.println("Statistics Calculation Results:");
    System.out.println("- Sessions processed: " + expectedSessions);
    System.out.println("- Calculation time: " + statisticsTime + "ms");

    assert statisticsTime < 1000
        : "Statistics calculation time " + statisticsTime + "ms exceeds 1000ms limit";
  }

  @Test
  @DisplayName("Load Test: Memory usage and resource cleanup")
  void shouldManageMemoryEfficiently() throws Exception {
    Runtime runtime = Runtime.getRuntime();
    long initialMemory = runtime.totalMemory() - runtime.freeMemory();

    // Create multiple users and perform operations
    List<UserSession> users = new ArrayList<>();
    for (int i = 0; i < 5; i++) {
      UserSession user = createTestUser("memoryuser" + i, "LoadTest123!");
      users.add(user);

      // Create study books for each user
      for (int j = 0; j < 10; j++) {
        createTestStudyBook(user, "Memory test " + j, "function memTest" + j + "() {}");
      }

      // Record typing sessions
      for (int j = 0; j < 20; j++) {
        // This would normally create typing sessions, but we'll simulate the memory impact
        // by creating the request objects
        RecordTypingResultRequest request = new RecordTypingResultRequest();
        request.setStudyBookId(UUID.randomUUID());
        request.setTypedText("memory test");
        request.setTargetText("memory test");
        request.setStartedAt(LocalDateTime.now().minusMinutes(j + 1));
        request.setCompletedAt(LocalDateTime.now().minusMinutes(j));
        request.setTotalCharacters(11);
        request.setCorrectCharacters(11);
      }
    }

    // Force garbage collection
    System.gc();
    Thread.sleep(1000); // Allow GC to complete

    long finalMemory = runtime.totalMemory() - runtime.freeMemory();
    long memoryIncrease = finalMemory - initialMemory;

    System.out.println("Memory Usage Results:");
    System.out.println("- Initial memory: " + (initialMemory / 1024 / 1024) + " MB");
    System.out.println("- Final memory: " + (finalMemory / 1024 / 1024) + " MB");
    System.out.println("- Memory increase: " + (memoryIncrease / 1024 / 1024) + " MB");

    // Memory increase should be reasonable (adjust threshold based on requirements)
    long maxMemoryIncreaseMB = 100; // 100 MB threshold
    assert (memoryIncrease / 1024 / 1024) < maxMemoryIncreaseMB
        : "Memory increase "
            + (memoryIncrease / 1024 / 1024)
            + " MB exceeds threshold "
            + maxMemoryIncreaseMB
            + " MB";
  }

  private UserSession createTestUser(String loginId, String password) throws Exception {
    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setLoginId(loginId);
    registerRequest.setPassword(password);

    MvcResult registerResult =
        mockMvc
            .perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated())
            .andReturn();

    String registerResponse = registerResult.getResponse().getContentAsString();
    String userId = objectMapper.readTree(registerResponse).get("userId").asText();
    String token = objectMapper.readTree(registerResponse).get("token").asText();

    return new UserSession(userId, token, loginId);
  }

  private String createTestStudyBook(UserSession user, String explanation, String question)
      throws Exception {
    CreateStudyBookRequest request = new CreateStudyBookRequest();
    request.setLanguage("JavaScript");
    request.setQuestion(question);
    request.setExplanation(explanation);

    MvcResult result =
        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", user.userId)
                    .header("Authorization", "Bearer " + user.token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();

    String response = result.getResponse().getContentAsString();
    return objectMapper.readTree(response).get("id").asText();
  }

  private static class LoadTestResult {
    final boolean success;
    final long responseTime;
    final String userId;
    final String token;

    LoadTestResult(boolean success, long responseTime, String userId, String token) {
      this.success = success;
      this.responseTime = responseTime;
      this.userId = userId;
      this.token = token;
    }
  }

  private static class UserSession {
    final String userId;
    final String token;
    final String loginId;

    UserSession(String userId, String token, String loginId) {
      this.userId = userId;
      this.token = token;
      this.loginId = loginId;
    }
  }
}
