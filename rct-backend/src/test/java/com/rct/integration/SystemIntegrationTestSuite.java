package com.rct.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rct.presentation.dto.request.CreateStudyBookRequest;
import com.rct.presentation.dto.request.RecordTypingResultRequest;
import com.rct.presentation.dto.request.RegisterRequest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * Comprehensive system integration tests that validate all components working together. These tests
 * simulate real-world scenarios and validate system behavior under various conditions.
 */
@AutoConfigureWebMvc
@Transactional
class SystemIntegrationTestSuite extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @DisplayName("System Test: Complete application workflow with multiple users")
  void shouldHandleMultipleUsersWorkflow() throws Exception {
    // Create multiple users
    List<UserSession> users = new ArrayList<>();
    for (int i = 1; i <= 3; i++) {
      UserSession user = createUserSession("systemuser" + i, "SecurePass123!");
      users.add(user);
    }

    // Each user creates study books
    for (int i = 0; i < users.size(); i++) {
      UserSession user = users.get(i);
      for (int j = 1; j <= 2; j++) {
        CreateStudyBookRequest request = new CreateStudyBookRequest();
        request.setLanguage("JavaScript");
        request.setQuestion("function user" + (i + 1) + "Question" + j + "() { return 'test'; }");
        request.setExplanation("User " + (i + 1) + " question " + j);

        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", user.userId)
                    .header("Authorization", "Bearer " + user.token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
      }
    }

    // Each user practices typing with their own and system study books
    for (UserSession user : users) {
      // Get user's study books
      MvcResult studyBooksResult =
          mockMvc
              .perform(
                  get("/api/studybooks")
                      .header("X-User-Id", user.userId)
                      .header("Authorization", "Bearer " + user.token)
                      .param("page", "0")
                      .param("size", "10"))
              .andExpect(status().isOk())
              .andExpected(jsonPath("$.content").isArray())
              .andReturn();

      String studyBooksResponse = studyBooksResult.getResponse().getContentAsString();
      var studyBooks = objectMapper.readTree(studyBooksResponse).get("content");

      // Practice with first study book
      if (studyBooks.size() > 0) {
        String studyBookId = studyBooks.get(0).get("id").asText();
        String targetText = studyBooks.get(0).get("question").asText();

        RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
        typingRequest.setStudyBookId(UUID.fromString(studyBookId));
        typingRequest.setTypedText(targetText);
        typingRequest.setTargetText(targetText);
        typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(2));
        typingRequest.setCompletedAt(LocalDateTime.now());
        typingRequest.setTotalCharacters(targetText.length());
        typingRequest.setCorrectCharacters(targetText.length());

        mockMvc
            .perform(
                post("/api/typing/results")
                    .header("X-User-Id", user.userId)
                    .header("Authorization", "Bearer " + user.token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(typingRequest)))
            .andExpect(status().isCreated());
      }
    }

    // Verify each user's statistics
    for (UserSession user : users) {
      mockMvc
          .perform(
              get("/api/typing/statistics")
                  .header("X-User-Id", user.userId)
                  .header("Authorization", "Bearer " + user.token))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalSessions").value(1))
          .andExpect(jsonPath("$.averageAccuracy").value(100.0));
    }

    // Verify data isolation - users should only see their own study books
    for (UserSession user : users) {
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", user.userId)
                  .header("Authorization", "Bearer " + user.token))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalElements").value(2)); // Only their own study books
    }
  }

  @Test
  @DisplayName("System Test: Concurrent user operations")
  void shouldHandleConcurrentOperations() throws Exception {
    // Create base user
    UserSession user = createUserSession("concurrentuser", "SecurePass123!");

    // Create initial study book
    CreateStudyBookRequest initialRequest = new CreateStudyBookRequest();
    initialRequest.setLanguage("JavaScript");
    initialRequest.setQuestion("console.log('concurrent test');");
    initialRequest.setExplanation("Concurrent test study book");

    MvcResult createResult =
        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", user.userId)
                    .header("Authorization", "Bearer " + user.token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(initialRequest)))
            .andExpect(status().isCreated())
            .andReturn();

    String studyBookId =
        objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

    // Simulate concurrent typing sessions
    ExecutorService executor = Executors.newFixedThreadPool(5);
    List<CompletableFuture<Void>> futures = new ArrayList<>();

    for (int i = 0; i < 5; i++) {
      final int sessionIndex = i;
      CompletableFuture<Void> future =
          CompletableFuture.runAsync(
              () -> {
                try {
                  RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
                  typingRequest.setStudyBookId(UUID.fromString(studyBookId));
                  typingRequest.setTypedText("console.log('concurrent test');");
                  typingRequest.setTargetText("console.log('concurrent test');");
                  typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(sessionIndex + 1));
                  typingRequest.setCompletedAt(LocalDateTime.now().minusMinutes(sessionIndex));
                  typingRequest.setTotalCharacters(29);
                  typingRequest.setCorrectCharacters(29);

                  mockMvc
                      .perform(
                          post("/api/typing/results")
                              .header("X-User-Id", user.userId)
                              .header("Authorization", "Bearer " + user.token)
                              .contentType(MediaType.APPLICATION_JSON)
                              .content(objectMapper.writeValueAsString(typingRequest)))
                      .andExpect(status().isCreated());
                } catch (Exception e) {
                  throw new RuntimeException(e);
                }
              },
              executor);
      futures.add(future);
    }

    // Wait for all concurrent operations to complete
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    executor.shutdown();

    // Verify all sessions were recorded
    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSessions").value(5))
        .andExpect(jsonPath("$.averageAccuracy").value(100.0));
  }

  @Test
  @DisplayName("System Test: Data consistency and integrity")
  void shouldMaintainDataConsistency() throws Exception {
    UserSession user = createUserSession("consistencyuser", "SecurePass123!");

    // Create study book
    CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
    createRequest.setLanguage("Python");
    createRequest.setQuestion("print('consistency test')");
    createRequest.setExplanation("Data consistency test");

    MvcResult createResult =
        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", user.userId)
                    .header("Authorization", "Bearer " + user.token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createRequest)))
            .andExpect(status().isCreated())
            .andReturn();

    String studyBookId =
        objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

    // Record multiple typing sessions with different accuracies
    double[] accuracies = {100.0, 95.0, 90.0, 85.0, 80.0};
    String targetText = "print('consistency test')";
    int totalChars = targetText.length();

    for (int i = 0; i < accuracies.length; i++) {
      int correctChars = (int) (totalChars * accuracies[i] / 100.0);
      String typedText =
          targetText.substring(0, correctChars) + "x".repeat(totalChars - correctChars);

      RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
      typingRequest.setStudyBookId(UUID.fromString(studyBookId));
      typingRequest.setTypedText(typedText);
      typingRequest.setTargetText(targetText);
      typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(i + 5));
      typingRequest.setCompletedAt(LocalDateTime.now().minusMinutes(i + 4));
      typingRequest.setTotalCharacters(totalChars);
      typingRequest.setCorrectCharacters(correctChars);

      mockMvc
          .perform(
              post("/api/typing/results")
                  .header("X-User-Id", user.userId)
                  .header("Authorization", "Bearer " + user.token)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(typingRequest)))
          .andExpect(status().isCreated());
    }

    // Verify statistics calculation accuracy
    double expectedAverage = (100.0 + 95.0 + 90.0 + 85.0 + 80.0) / 5.0; // 90.0

    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSessions").value(5))
        .andExpect(jsonPath("$.averageAccuracy").value(expectedAverage))
        .andExpect(jsonPath("$.bestAccuracy").value(100.0))
        .andExpect(jsonPath("$.recentSessions").isArray())
        .andExpect(jsonPath("$.recentSessions.length()").value(5));

    // Delete study book and verify typing sessions are handled appropriately
    mockMvc
        .perform(
            delete("/api/studybooks/{id}", studyBookId)
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isNoContent());

    // Verify study book is deleted
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(0));

    // Statistics should still be available (historical data preserved)
    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSessions").value(5));
  }

  @Test
  @DisplayName("System Test: Security and authorization boundaries")
  void shouldEnforceSecurityBoundaries() throws Exception {
    // Create two users
    UserSession user1 = createUserSession("securityuser1", "SecurePass123!");
    UserSession user2 = createUserSession("securityuser2", "SecurePass123!");

    // User1 creates a study book
    CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
    createRequest.setLanguage("Java");
    createRequest.setQuestion("System.out.println('security test');");
    createRequest.setExplanation("Security boundary test");

    MvcResult createResult =
        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", user1.userId)
                    .header("Authorization", "Bearer " + user1.token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createRequest)))
            .andExpect(status().isCreated())
            .andReturn();

    String studyBookId =
        objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

    // User2 should not be able to access User1's study book directly
    mockMvc
        .perform(
            delete("/api/studybooks/{id}", studyBookId)
                .header("X-User-Id", user2.userId)
                .header("Authorization", "Bearer " + user2.token))
        .andExpect(status().isNotFound()); // Should not find it due to user isolation

    // User2 should not see User1's study books in their list
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", user2.userId)
                .header("Authorization", "Bearer " + user2.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(0));

    // User2 should not be able to record typing results for User1's study book
    RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
    typingRequest.setStudyBookId(UUID.fromString(studyBookId));
    typingRequest.setTypedText("System.out.println('security test');");
    typingRequest.setTargetText("System.out.println('security test');");
    typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(2));
    typingRequest.setCompletedAt(LocalDateTime.now());
    typingRequest.setTotalCharacters(35);
    typingRequest.setCorrectCharacters(35);

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", user2.userId)
                .header("Authorization", "Bearer " + user2.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(typingRequest)))
        .andExpect(status().isNotFound()); // Study book not found for this user

    // Invalid token should be rejected
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", user1.userId)
                .header("Authorization", "Bearer invalid-token"))
        .andExpect(status().isUnauthorized());

    // Missing user ID should be rejected
    mockMvc
        .perform(get("/api/studybooks").header("Authorization", "Bearer " + user1.token))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("System Test: Error recovery and resilience")
  void shouldHandleErrorsGracefully() throws Exception {
    UserSession user = createUserSession("erroruser", "SecurePass123!");

    // Test invalid input handling
    CreateStudyBookRequest invalidRequest = new CreateStudyBookRequest();
    invalidRequest.setLanguage(""); // Invalid
    invalidRequest.setQuestion(""); // Invalid
    invalidRequest.setExplanation("Valid explanation");

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"));

    // Test SQL injection attempts
    CreateStudyBookRequest sqlInjectionRequest = new CreateStudyBookRequest();
    sqlInjectionRequest.setLanguage("JavaScript");
    sqlInjectionRequest.setQuestion("'; DROP TABLE study_books; --");
    sqlInjectionRequest.setExplanation("SQL injection attempt");

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sqlInjectionRequest)))
        .andExpect(status().isCreated()); // Should be sanitized and created safely

    // Verify system is still functional after injection attempt
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1));

    // Test XSS prevention
    CreateStudyBookRequest xssRequest = new CreateStudyBookRequest();
    xssRequest.setLanguage("JavaScript");
    xssRequest.setQuestion("<script>alert('xss')</script>console.log('test');");
    xssRequest.setExplanation("<img src=x onerror=alert('xss')>Explanation");

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(xssRequest)))
        .andExpect(status().isCreated());

    // Verify XSS content is sanitized
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[1].question").value("console.log('test');"))
        .andExpect(jsonPath("$.content[1].explanation").value("Explanation"));
  }

  @Test
  @DisplayName("System Test: Performance under load")
  void shouldPerformUnderLoad() throws Exception {
    UserSession user = createUserSession("performanceuser", "SecurePass123!");

    // Create multiple study books rapidly
    List<String> studyBookIds = new ArrayList<>();
    long startTime = System.currentTimeMillis();

    for (int i = 1; i <= 20; i++) {
      CreateStudyBookRequest request = new CreateStudyBookRequest();
      request.setLanguage("JavaScript");
      request.setQuestion("function test" + i + "() { return " + i + "; }");
      request.setExplanation("Performance test function " + i);

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

      String studyBookId =
          objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
      studyBookIds.add(studyBookId);
    }

    long creationTime = System.currentTimeMillis() - startTime;
    System.out.println("Created 20 study books in " + creationTime + "ms");

    // Verify all study books were created
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token)
                .param("size", "25"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(20));

    // Record typing sessions for all study books
    startTime = System.currentTimeMillis();
    for (String studyBookId : studyBookIds) {
      RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
      typingRequest.setStudyBookId(UUID.fromString(studyBookId));
      typingRequest.setTypedText("test function");
      typingRequest.setTargetText("test function");
      typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(2));
      typingRequest.setCompletedAt(LocalDateTime.now());
      typingRequest.setTotalCharacters(13);
      typingRequest.setCorrectCharacters(13);

      mockMvc
          .perform(
              post("/api/typing/results")
                  .header("X-User-Id", user.userId)
                  .header("Authorization", "Bearer " + user.token)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(typingRequest)))
          .andExpect(status().isCreated());
    }

    long typingTime = System.currentTimeMillis() - startTime;
    System.out.println("Recorded 20 typing sessions in " + typingTime + "ms");

    // Verify statistics calculation performance
    startTime = System.currentTimeMillis();
    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSessions").value(20))
        .andExpect(jsonPath("$.averageAccuracy").value(100.0));

    long statisticsTime = System.currentTimeMillis() - startTime;
    System.out.println("Calculated statistics for 20 sessions in " + statisticsTime + "ms");

    // Performance assertions (adjust thresholds based on requirements)
    assert creationTime < 5000 : "Study book creation took too long: " + creationTime + "ms";
    assert typingTime < 5000 : "Typing session recording took too long: " + typingTime + "ms";
    assert statisticsTime < 1000 : "Statistics calculation took too long: " + statisticsTime + "ms";
  }

  private UserSession createUserSession(String loginId, String password) throws Exception {
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
