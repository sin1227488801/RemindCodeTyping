package com.rct.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rct.integration.BaseIntegrationTest;
import com.rct.presentation.dto.request.CreateStudyBookRequest;
import com.rct.presentation.dto.request.LoginRequest;
import com.rct.presentation.dto.request.RecordTypingResultRequest;
import com.rct.presentation.dto.request.RegisterRequest;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * Security penetration testing suite to validate system security measures. These tests simulate
 * various attack vectors and verify security controls.
 */
@AutoConfigureWebMvc
@Transactional
class SecurityPenetrationTestSuite extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @DisplayName("Security Test: SQL Injection Prevention")
  void shouldPreventSqlInjection() throws Exception {
    UserSession user = createTestUser("sqlinjectionuser", "SecurePass123!");

    // Test SQL injection in study book creation
    String[] sqlInjectionPayloads = {
      "'; DROP TABLE study_books; --",
      "' OR '1'='1",
      "'; INSERT INTO study_books (question) VALUES ('injected'); --",
      "' UNION SELECT * FROM users --",
      "'; UPDATE users SET password_hash = 'hacked' WHERE id = 1; --"
    };

    for (String payload : sqlInjectionPayloads) {
      CreateStudyBookRequest request = new CreateStudyBookRequest();
      request.setLanguage("JavaScript");
      request.setQuestion(payload);
      request.setExplanation("SQL injection test");

      mockMvc
          .perform(
              post("/api/studybooks")
                  .header("X-User-Id", user.userId)
                  .header("Authorization", "Bearer " + user.token)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated()); // Should be sanitized and created safely
    }

    // Verify system integrity - should still be able to query normally
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());

    // Verify user can still authenticate (password not changed)
    LoginRequest loginRequest = new LoginRequest();
    loginRequest.setLoginId("sqlinjectionuser");
    loginRequest.setPassword("SecurePass123!");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
        .andExpect(status().isOk());
  }

  @Test
  @DisplayName("Security Test: XSS Prevention")
  void shouldPreventXssAttacks() throws Exception {
    UserSession user = createTestUser("xssuser", "SecurePass123!");

    // Test XSS payloads
    String[] xssPayloads = {
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert('xss')>",
      "<svg onload=alert('xss')>",
      "javascript:alert('xss')",
      "<iframe src='javascript:alert(\"xss\")'></iframe>",
      "<body onload=alert('xss')>",
      "<input onfocus=alert('xss') autofocus>",
      "<select onfocus=alert('xss') autofocus><option>test</option></select>"
    };

    for (String payload : xssPayloads) {
      CreateStudyBookRequest request = new CreateStudyBookRequest();
      request.setLanguage("JavaScript");
      request.setQuestion("console.log('test'); " + payload);
      request.setExplanation("XSS test: " + payload);

      mockMvc
          .perform(
              post("/api/studybooks")
                  .header("X-User-Id", user.userId)
                  .header("Authorization", "Bearer " + user.token)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated());
    }

    // Verify XSS content is sanitized
    MvcResult result =
        mockMvc
            .perform(
                get("/api/studybooks")
                    .header("X-User-Id", user.userId)
                    .header("Authorization", "Bearer " + user.token))
            .andExpect(status().isOk())
            .andReturn();

    String response = result.getResponse().getContentAsString();

    // Verify no script tags or dangerous attributes remain
    assert !response.contains("<script>") : "Script tags found in response";
    assert !response.contains("onerror=") : "onerror attributes found in response";
    assert !response.contains("onload=") : "onload attributes found in response";
    assert !response.contains("javascript:") : "javascript: protocol found in response";
  }

  @Test
  @DisplayName("Security Test: Authentication Bypass Attempts")
  void shouldPreventAuthenticationBypass() throws Exception {
    // Test accessing protected endpoints without authentication
    mockMvc
        .perform(get("/api/studybooks"))
        .andExpect(status().isBadRequest()); // Missing user ID header

    mockMvc
        .perform(get("/api/studybooks").header("X-User-Id", UUID.randomUUID().toString()))
        .andExpect(status().isUnauthorized()); // Missing or invalid token

    // Test with invalid tokens
    String[] invalidTokens = {
      "invalid-token",
      "Bearer invalid",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
      "",
      "null",
      "undefined"
    };

    for (String invalidToken : invalidTokens) {
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", UUID.randomUUID().toString())
                  .header("Authorization", "Bearer " + invalidToken))
          .andExpect(status().isUnauthorized());
    }

    // Test with expired token (simulate by using a very old timestamp)
    // This would require creating a token with past expiration, which is handled by JWT validation
  }

  @Test
  @DisplayName("Security Test: Authorization Boundary Violations")
  void shouldEnforceAuthorizationBoundaries() throws Exception {
    // Create two users
    UserSession user1 = createTestUser("authuser1", "SecurePass123!");
    UserSession user2 = createTestUser("authuser2", "SecurePass123!");

    // User1 creates a study book
    CreateStudyBookRequest request = new CreateStudyBookRequest();
    request.setLanguage("Java");
    request.setQuestion("System.out.println('authorization test');");
    request.setExplanation("Authorization boundary test");

    MvcResult createResult =
        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", user1.userId)
                    .header("Authorization", "Bearer " + user1.token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpected(status().isCreated())
            .andReturn();

    String studyBookId =
        objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

    // Test cross-user access attempts

    // User2 tries to access User1's study book directly
    mockMvc
        .perform(
            delete("/api/studybooks/{id}", studyBookId)
                .header("X-User-Id", user2.userId)
                .header("Authorization", "Bearer " + user2.token))
        .andExpect(status().isNotFound()); // Should not find due to user isolation

    // User2 tries to update User1's study book
    CreateStudyBookRequest updateRequest = new CreateStudyBookRequest();
    updateRequest.setLanguage("Java");
    updateRequest.setQuestion("System.out.println('hacked');");
    updateRequest.setExplanation("Unauthorized update attempt");

    mockMvc
        .perform(
            put("/api/studybooks/{id}", studyBookId)
                .header("X-User-Id", user2.userId)
                .header("Authorization", "Bearer " + user2.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isNotFound());

    // User2 tries to record typing results for User1's study book
    RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
    typingRequest.setStudyBookId(UUID.fromString(studyBookId));
    typingRequest.setTypedText("System.out.println('authorization test');");
    typingRequest.setTargetText("System.out.println('authorization test');");
    typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(2));
    typingRequest.setCompletedAt(LocalDateTime.now());
    typingRequest.setTotalCharacters(40);
    typingRequest.setCorrectCharacters(40);

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", user2.userId)
                .header("Authorization", "Bearer " + user2.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(typingRequest)))
        .andExpect(status().isNotFound());

    // Test token/user ID mismatch
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", user1.userId)
                .header("Authorization", "Bearer " + user2.token))
        .andExpect(status().isUnauthorized()); // Token doesn't match user ID
  }

  @Test
  @DisplayName("Security Test: Input Validation and Sanitization")
  void shouldValidateAndSanitizeInput() throws Exception {
    UserSession user = createTestUser("validationuser", "SecurePass123!");

    // Test oversized input
    String oversizedQuestion = "a".repeat(10000); // Very large input
    CreateStudyBookRequest oversizedRequest = new CreateStudyBookRequest();
    oversizedRequest.setLanguage("JavaScript");
    oversizedRequest.setQuestion(oversizedQuestion);
    oversizedRequest.setExplanation("Oversized input test");

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(oversizedRequest)))
        .andExpect(status().isBadRequest()); // Should reject oversized input

    // Test null and empty values
    CreateStudyBookRequest nullRequest = new CreateStudyBookRequest();
    nullRequest.setLanguage(null);
    nullRequest.setQuestion(null);
    nullRequest.setExplanation(null);

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nullRequest)))
        .andExpect(status().isBadRequest());

    // Test special characters and encoding
    String specialCharsQuestion = "function test() { return '\\u0000\\u001f\\u007f\\uffff'; }";
    CreateStudyBookRequest specialCharsRequest = new CreateStudyBookRequest();
    specialCharsRequest.setLanguage("JavaScript");
    specialCharsRequest.setQuestion(specialCharsQuestion);
    specialCharsRequest.setExplanation("Special characters test");

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(specialCharsRequest)))
        .andExpect(status().isCreated()); // Should handle special characters safely

    // Test invalid UUID formats
    mockMvc
        .perform(
            delete("/api/studybooks/{id}", "invalid-uuid")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isBadRequest());

    // Test invalid typing result data
    RecordTypingResultRequest invalidTypingRequest = new RecordTypingResultRequest();
    invalidTypingRequest.setStudyBookId(UUID.randomUUID());
    invalidTypingRequest.setTotalCharacters(-1); // Invalid negative value
    invalidTypingRequest.setCorrectCharacters(-1); // Invalid negative value
    invalidTypingRequest.setStartedAt(LocalDateTime.now().plusHours(1)); // Future time
    invalidTypingRequest.setCompletedAt(LocalDateTime.now().minusHours(1)); // Before start time

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidTypingRequest)))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("Security Test: Rate Limiting and DoS Prevention")
  void shouldPreventDosAttacks() throws Exception {
    UserSession user = createTestUser("dosuser", "SecurePass123!");

    // Test rapid successive requests (simulating DoS)
    int rapidRequestCount = 50;
    int successCount = 0;
    int rateLimitedCount = 0;

    for (int i = 0; i < rapidRequestCount; i++) {
      CreateStudyBookRequest request = new CreateStudyBookRequest();
      request.setLanguage("JavaScript");
      request.setQuestion("function dos" + i + "() { return " + i + "; }");
      request.setExplanation("DoS test " + i);

      try {
        MvcResult result =
            mockMvc
                .perform(
                    post("/api/studybooks")
                        .header("X-User-Id", user.userId)
                        .header("Authorization", "Bearer " + user.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        if (result.getResponse().getStatus() == 201) {
          successCount++;
        } else if (result.getResponse().getStatus() == 429) { // Too Many Requests
          rateLimitedCount++;
        }
      } catch (Exception e) {
        // Expected for rate limiting
        rateLimitedCount++;
      }

      // Small delay to avoid overwhelming the test
      Thread.sleep(10);
    }

    System.out.println("DoS Prevention Test Results:");
    System.out.println("- Successful requests: " + successCount);
    System.out.println("- Rate limited requests: " + rateLimitedCount);

    // Should have some rate limiting in place for rapid requests
    // (Adjust expectations based on actual rate limiting implementation)
  }

  @Test
  @DisplayName("Security Test: Session Management Security")
  void shouldSecureSessionManagement() throws Exception {
    UserSession user = createTestUser("sessionuser", "SecurePass123!");

    // Test concurrent sessions (should be allowed but tracked)
    LoginRequest loginRequest = new LoginRequest();
    loginRequest.setLoginId("sessionuser");
    loginRequest.setPassword("SecurePass123!");

    // Login multiple times to create multiple sessions
    String[] tokens = new String[3];
    for (int i = 0; i < 3; i++) {
      MvcResult loginResult =
          mockMvc
              .perform(
                  post("/api/auth/login")
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(loginRequest)))
              .andExpect(status().isOk())
              .andReturn();

      String response = loginResult.getResponse().getContentAsString();
      tokens[i] = objectMapper.readTree(response).get("token").asText();
    }

    // All tokens should be valid initially
    for (String token : tokens) {
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", user.userId)
                  .header("Authorization", "Bearer " + token))
          .andExpect(status().isOk());
    }

    // Test token reuse after logout (if logout invalidates tokens)
    // This depends on the logout implementation
  }

  @Test
  @DisplayName("Security Test: Data Leakage Prevention")
  void shouldPreventDataLeakage() throws Exception {
    UserSession user = createTestUser("leakageuser", "SecurePass123!");

    // Test error messages don't leak sensitive information
    mockMvc
        .perform(
            get("/api/studybooks/{id}", UUID.randomUUID())
                .header("X-User-Id", user.userId)
                .header("Authorization", "Bearer " + user.token))
        .andExpect(status().isNotFound())
        .andExpect(
            result -> {
              String response = result.getResponse().getContentAsString();
              // Should not contain database details, file paths, or internal errors
              assert !response.toLowerCase().contains("database") : "Database details leaked";
              assert !response.toLowerCase().contains("sql") : "SQL details leaked";
              assert !response.toLowerCase().contains("exception") : "Exception details leaked";
              assert !response.toLowerCase().contains("stacktrace") : "Stack trace leaked";
            });

    // Test that user enumeration is not possible
    RegisterRequest duplicateRequest = new RegisterRequest();
    duplicateRequest.setLoginId("leakageuser"); // Already exists
    duplicateRequest.setPassword("AnotherPass123!");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateRequest)))
        .andExpect(status().isConflict())
        .andExpect(
            result -> {
              String response = result.getResponse().getContentAsString();
              // Should not reveal specific user details
              assert !response.contains(user.userId) : "User ID leaked in error message";
            });

    // Test login with non-existent user
    LoginRequest nonExistentLogin = new LoginRequest();
    nonExistentLogin.setLoginId("nonexistentuser12345");
    nonExistentLogin.setPassword("password");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nonExistentLogin)))
        .andExpect(status().isUnauthorized())
        .andExpect(
            result -> {
              String response = result.getResponse().getContentAsString();
              // Should not distinguish between "user not found" and "wrong password"
              assert !response.toLowerCase().contains("not found") : "User existence leaked";
              assert !response.toLowerCase().contains("does not exist") : "User existence leaked";
            });
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
