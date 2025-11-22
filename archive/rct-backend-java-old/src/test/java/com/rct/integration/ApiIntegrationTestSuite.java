package com.rct.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rct.presentation.dto.request.CreateStudyBookRequest;
import com.rct.presentation.dto.request.LoginRequest;
import com.rct.presentation.dto.request.RecordTypingResultRequest;
import com.rct.presentation.dto.request.RegisterRequest;
import com.rct.presentation.dto.request.UpdateStudyBookRequest;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * Comprehensive API integration test suite that systematically tests all endpoints with various
 * scenarios including success cases, validation errors, and edge cases.
 */
@AutoConfigureWebMvc
@Transactional
class ApiIntegrationTestSuite extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  private String testUserId;
  private String testAuthToken;

  @BeforeEach
  void setUpTestUser() throws Exception {
    // Create a test user for authenticated endpoints
    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setLoginId("apitest" + System.currentTimeMillis());
    registerRequest.setPassword("SecurePass123!");

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated())
            .andReturn();

    String response = result.getResponse().getContentAsString();
    testUserId = objectMapper.readTree(response).get("userId").asText();
    testAuthToken = objectMapper.readTree(response).get("token").asText();
  }

  @Nested
  @DisplayName("Authentication API Tests")
  class AuthenticationApiTests {

    @Test
    @DisplayName("POST /api/auth/register - Success scenarios")
    void testRegisterSuccess() throws Exception {
      RegisterRequest request = new RegisterRequest();
      request.setLoginId("newuser" + System.currentTimeMillis());
      request.setPassword("ValidPass123!");

      mockMvc
          .perform(
              post("/api/auth/register")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.userId").exists())
          .andExpect(jsonPath("$.loginId").value(request.getLoginId()))
          .andExpect(jsonPath("$.token").exists())
          .andExpect(jsonPath("$.isGuest").value(false));
    }

    @Test
    @DisplayName("POST /api/auth/register - Validation errors")
    void testRegisterValidationErrors() throws Exception {
      // Test empty login ID
      RegisterRequest emptyLoginRequest = new RegisterRequest();
      emptyLoginRequest.setLoginId("");
      emptyLoginRequest.setPassword("ValidPass123!");

      mockMvc
          .perform(
              post("/api/auth/register")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(emptyLoginRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_001"));

      // Test short password
      RegisterRequest shortPasswordRequest = new RegisterRequest();
      shortPasswordRequest.setLoginId("validuser");
      shortPasswordRequest.setPassword("123");

      mockMvc
          .perform(
              post("/api/auth/register")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(shortPasswordRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_001"));

      // Test null values
      RegisterRequest nullRequest = new RegisterRequest();

      mockMvc
          .perform(
              post("/api/auth/register")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(nullRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_001"));
    }

    @Test
    @DisplayName("POST /api/auth/login - Success and failure scenarios")
    void testLoginScenarios() throws Exception {
      // Success case
      LoginRequest validRequest = new LoginRequest();
      validRequest.setLoginId("apitest" + System.currentTimeMillis());
      validRequest.setPassword("SecurePass123!");

      // First register the user
      RegisterRequest registerRequest = new RegisterRequest();
      registerRequest.setLoginId(validRequest.getLoginId());
      registerRequest.setPassword(validRequest.getPassword());

      mockMvc
          .perform(
              post("/api/auth/register")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(registerRequest)))
          .andExpect(status().isCreated());

      // Then login
      mockMvc
          .perform(
              post("/api/auth/login")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(validRequest)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.userId").exists())
          .andExpect(jsonPath("$.token").exists());

      // Invalid credentials
      LoginRequest invalidRequest = new LoginRequest();
      invalidRequest.setLoginId("nonexistent");
      invalidRequest.setPassword("wrongpassword");

      mockMvc
          .perform(
              post("/api/auth/login")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.errorCode").value("AUTH_001"));
    }

    @Test
    @DisplayName("POST /api/auth/demo - Demo session creation")
    void testDemoSessionCreation() throws Exception {
      mockMvc
          .perform(post("/api/auth/demo"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.userId").exists())
          .andExpect(jsonPath("$.loginId").exists())
          .andExpect(jsonPath("$.token").exists())
          .andExpect(jsonPath("$.isGuest").value(true));
    }
  }

  @Nested
  @DisplayName("StudyBook API Tests")
  class StudyBookApiTests {

    @Test
    @DisplayName("POST /api/studybooks - Create study book scenarios")
    void testCreateStudyBook() throws Exception {
      // Success case
      CreateStudyBookRequest validRequest = new CreateStudyBookRequest();
      validRequest.setLanguage("Java");
      validRequest.setQuestion("public class HelloWorld { }");
      validRequest.setExplanation("Basic Java class declaration");

      mockMvc
          .perform(
              post("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(validRequest)))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.id").exists())
          .andExpect(jsonPath("$.language").value("Java"))
          .andExpect(jsonPath("$.question").value("public class HelloWorld { }"))
          .andExpect(jsonPath("$.explanation").value("Basic Java class declaration"))
          .andExpect(jsonPath("$.isSystemProblem").value(false));

      // Validation errors
      CreateStudyBookRequest invalidRequest = new CreateStudyBookRequest();
      invalidRequest.setLanguage("");
      invalidRequest.setQuestion("");

      mockMvc
          .perform(
              post("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_001"));

      // Missing user ID header
      mockMvc
          .perform(
              post("/api/studybooks")
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(validRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_002"));
    }

    @Test
    @DisplayName("GET /api/studybooks - List study books with various filters")
    void testListStudyBooks() throws Exception {
      // Create test study books
      String[] languages = {"JavaScript", "Python", "Java"};
      String[] questions = {
        "console.log('Hello');", "print('Hello')", "System.out.println('Hello');"
      };

      for (int i = 0; i < languages.length; i++) {
        CreateStudyBookRequest request = new CreateStudyBookRequest();
        request.setLanguage(languages[i]);
        request.setQuestion(questions[i]);
        request.setExplanation("Test explanation " + i);

        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", testUserId)
                    .header("Authorization", "Bearer " + testAuthToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
      }

      // Test basic listing
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.content").isArray())
          .andExpect(jsonPath("$.content.length()").value(3))
          .andExpect(jsonPath("$.totalElements").value(3));

      // Test language filter
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .param("language", "JavaScript"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.content").isArray())
          .andExpect(jsonPath("$.content.length()").value(1))
          .andExpect(jsonPath("$.content[0].language").value("JavaScript"));

      // Test search query
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .param("query", "console"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.content").isArray());

      // Test pagination
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .param("page", "0")
                  .param("size", "2"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.content").isArray())
          .andExpect(jsonPath("$.content.length()").value(2))
          .andExpect(jsonPath("$.pageable.pageSize").value(2));
    }

    @Test
    @DisplayName("PUT /api/studybooks/{id} - Update study book scenarios")
    void testUpdateStudyBook() throws Exception {
      // Create a study book first
      CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
      createRequest.setLanguage("Python");
      createRequest.setQuestion("print('Original')");
      createRequest.setExplanation("Original explanation");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/api/studybooks")
                      .header("X-User-Id", testUserId)
                      .header("Authorization", "Bearer " + testAuthToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createRequest)))
              .andExpect(status().isCreated())
              .andReturn();

      String createResponse = createResult.getResponse().getContentAsString();
      String studyBookId = objectMapper.readTree(createResponse).get("id").asText();

      // Update the study book
      UpdateStudyBookRequest updateRequest = new UpdateStudyBookRequest();
      updateRequest.setLanguage("Python");
      updateRequest.setQuestion("print('Updated')");
      updateRequest.setExplanation("Updated explanation");

      mockMvc
          .perform(
              put("/api/studybooks/{id}", studyBookId)
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(updateRequest)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.question").value("print('Updated')"))
          .andExpect(jsonPath("$.explanation").value("Updated explanation"));

      // Try to update non-existent study book
      UUID nonExistentId = UUID.randomUUID();
      mockMvc
          .perform(
              put("/api/studybooks/{id}", nonExistentId)
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(updateRequest)))
          .andExpect(status().isNotFound())
          .andExpect(jsonPath("$.errorCode").value("STUDYBOOK_001"));
    }

    @Test
    @DisplayName("DELETE /api/studybooks/{id} - Delete study book scenarios")
    void testDeleteStudyBook() throws Exception {
      // Create a study book first
      CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
      createRequest.setLanguage("C++");
      createRequest.setQuestion("#include <iostream>");
      createRequest.setExplanation("C++ include statement");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/api/studybooks")
                      .header("X-User-Id", testUserId)
                      .header("Authorization", "Bearer " + testAuthToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createRequest)))
              .andExpect(status().isCreated())
              .andReturn();

      String createResponse = createResult.getResponse().getContentAsString();
      String studyBookId = objectMapper.readTree(createResponse).get("id").asText();

      // Delete the study book
      mockMvc
          .perform(
              delete("/api/studybooks/{id}", studyBookId)
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken))
          .andExpect(status().isNoContent());

      // Try to delete again (should return 404)
      mockMvc
          .perform(
              delete("/api/studybooks/{id}", studyBookId)
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken))
          .andExpect(status().isNotFound())
          .andExpect(jsonPath("$.errorCode").value("STUDYBOOK_001"));
    }

    @Test
    @DisplayName("GET /api/studybooks/random - Random study books scenarios")
    void testGetRandomStudyBooks() throws Exception {
      // Test without any study books
      mockMvc
          .perform(
              get("/api/studybooks/random")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .param("limit", "5"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());

      // Create some study books
      for (int i = 0; i < 3; i++) {
        CreateStudyBookRequest request = new CreateStudyBookRequest();
        request.setLanguage("JavaScript");
        request.setQuestion("var x = " + i + ";");
        request.setExplanation("Variable declaration " + i);

        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", testUserId)
                    .header("Authorization", "Bearer " + testAuthToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
      }

      // Test with language filter
      mockMvc
          .perform(
              get("/api/studybooks/random")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .param("language", "JavaScript")
                  .param("limit", "2"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());

      // Test with high limit
      mockMvc
          .perform(
              get("/api/studybooks/random")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .param("limit", "100"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/studybooks/languages - Get available languages")
    void testGetLanguages() throws Exception {
      // Create study books with different languages
      String[] languages = {"JavaScript", "Python", "Java", "C++", "Go"};
      for (String language : languages) {
        CreateStudyBookRequest request = new CreateStudyBookRequest();
        request.setLanguage(language);
        request.setQuestion("Sample code for " + language);
        request.setExplanation("Sample explanation");

        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", testUserId)
                    .header("Authorization", "Bearer " + testAuthToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
      }

      // Get languages
      mockMvc
          .perform(
              get("/api/studybooks/languages")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray())
          .andExpect(jsonPath("$.length()").value(languages.length));
    }
  }

  @Nested
  @DisplayName("Typing API Tests")
  class TypingApiTests {

    @Test
    @DisplayName("POST /api/typing/results - Record typing result scenarios")
    void testRecordTypingResult() throws Exception {
      // Create a study book first
      CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
      createRequest.setLanguage("JavaScript");
      createRequest.setQuestion("console.log('Test');");
      createRequest.setExplanation("Test logging");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/api/studybooks")
                      .header("X-User-Id", testUserId)
                      .header("Authorization", "Bearer " + testAuthToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createRequest)))
              .andExpect(status().isCreated())
              .andReturn();

      String createResponse = createResult.getResponse().getContentAsString();
      String studyBookId = objectMapper.readTree(createResponse).get("id").asText();

      // Record successful typing result
      RecordTypingResultRequest validRequest = new RecordTypingResultRequest();
      validRequest.setStudyBookId(UUID.fromString(studyBookId));
      validRequest.setTypedText("console.log('Test');");
      validRequest.setTargetText("console.log('Test');");
      validRequest.setStartedAt(LocalDateTime.now().minusMinutes(1));
      validRequest.setCompletedAt(LocalDateTime.now());
      validRequest.setTotalCharacters(19);
      validRequest.setCorrectCharacters(19);

      mockMvc
          .perform(
              post("/api/typing/results")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(validRequest)))
          .andExpect(status().isCreated());

      // Test validation errors
      RecordTypingResultRequest invalidRequest = new RecordTypingResultRequest();
      invalidRequest.setStudyBookId(UUID.fromString(studyBookId));
      invalidRequest.setTotalCharacters(-1); // Invalid
      invalidRequest.setCorrectCharacters(20); // Greater than total

      mockMvc
          .perform(
              post("/api/typing/results")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_001"));

      // Test with non-existent study book
      RecordTypingResultRequest nonExistentRequest = new RecordTypingResultRequest();
      nonExistentRequest.setStudyBookId(UUID.randomUUID());
      nonExistentRequest.setTypedText("test");
      nonExistentRequest.setTargetText("test");
      nonExistentRequest.setStartedAt(LocalDateTime.now().minusMinutes(1));
      nonExistentRequest.setCompletedAt(LocalDateTime.now());
      nonExistentRequest.setTotalCharacters(4);
      nonExistentRequest.setCorrectCharacters(4);

      mockMvc
          .perform(
              post("/api/typing/results")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(nonExistentRequest)))
          .andExpect(status().isNotFound())
          .andExpect(jsonPath("$.errorCode").value("STUDYBOOK_001"));
    }

    @Test
    @DisplayName("GET /api/typing/statistics - Get typing statistics scenarios")
    void testGetTypingStatistics() throws Exception {
      // Test with no typing sessions
      mockMvc
          .perform(
              get("/api/typing/statistics")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalSessions").value(0))
          .andExpect(jsonPath("$.averageAccuracy").value(0.0))
          .andExpect(jsonPath("$.totalCharactersTyped").value(0))
          .andExpect(jsonPath("$.averageSpeed").value(0.0))
          .andExpect(jsonPath("$.bestAccuracy").value(0.0))
          .andExpect(jsonPath("$.recentSessions").isArray())
          .andExpect(jsonPath("$.recentSessions.length()").value(0));

      // Create study book and record typing sessions
      CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
      createRequest.setLanguage("Python");
      createRequest.setQuestion("print('Statistics test')");
      createRequest.setExplanation("Statistics test");

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/api/studybooks")
                      .header("X-User-Id", testUserId)
                      .header("Authorization", "Bearer " + testAuthToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createRequest)))
              .andExpect(status().isCreated())
              .andReturn();

      String createResponse = createResult.getResponse().getContentAsString();
      String studyBookId = objectMapper.readTree(createResponse).get("id").asText();

      // Record multiple typing sessions with different accuracies
      double[] accuracies = {100.0, 95.0, 90.0};
      for (int i = 0; i < accuracies.length; i++) {
        String targetText = "print('Statistics test')";
        int totalChars = targetText.length();
        int correctChars = (int) (totalChars * accuracies[i] / 100.0);

        RecordTypingResultRequest request = new RecordTypingResultRequest();
        request.setStudyBookId(UUID.fromString(studyBookId));
        request.setTypedText(
            targetText.substring(0, correctChars) + "x".repeat(totalChars - correctChars));
        request.setTargetText(targetText);
        request.setStartedAt(LocalDateTime.now().minusMinutes(i + 1));
        request.setCompletedAt(LocalDateTime.now().minusMinutes(i));
        request.setTotalCharacters(totalChars);
        request.setCorrectCharacters(correctChars);

        mockMvc
            .perform(
                post("/api/typing/results")
                    .header("X-User-Id", testUserId)
                    .header("Authorization", "Bearer " + testAuthToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
      }

      // Test statistics after recording sessions
      mockMvc
          .perform(
              get("/api/typing/statistics")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalSessions").value(3))
          .andExpect(jsonPath("$.averageAccuracy").value(95.0)) // (100 + 95 + 90) / 3
          .andExpect(jsonPath("$.bestAccuracy").value(100.0))
          .andExpect(jsonPath("$.recentSessions").isArray())
          .andExpect(jsonPath("$.recentSessions.length()").value(3));

      // Test without user ID header
      mockMvc
          .perform(get("/api/typing/statistics"))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_002"));
    }
  }

  @Nested
  @DisplayName("Security and Error Handling Tests")
  class SecurityAndErrorHandlingTests {

    @Test
    @DisplayName("Authentication and authorization scenarios")
    void testAuthenticationAndAuthorization() throws Exception {
      // Test accessing protected endpoint without authentication
      mockMvc
          .perform(get("/api/studybooks"))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_002"));

      // Test with invalid user ID format
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", "invalid-uuid")
                  .header("Authorization", "Bearer " + testAuthToken))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_003"));

      // Test with invalid JWT token
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer invalid-token"))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Content type and malformed request handling")
    void testContentTypeAndMalformedRequests() throws Exception {
      // Test missing content type
      RegisterRequest request = new RegisterRequest();
      request.setLoginId("testuser");
      request.setPassword("password123");

      mockMvc
          .perform(post("/api/auth/register").content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isUnsupportedMediaType());

      // Test malformed JSON
      mockMvc
          .perform(
              post("/api/auth/register")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("{invalid json"))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errorCode").value("VAL_003"));

      // Test empty request body
      mockMvc
          .perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(""))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("HTTP method not allowed scenarios")
    void testMethodNotAllowed() throws Exception {
      // Test unsupported HTTP methods
      mockMvc.perform(patch("/api/auth/register")).andExpect(status().isMethodNotAllowed());

      mockMvc.perform(put("/api/auth/login")).andExpect(status().isMethodNotAllowed());

      mockMvc.perform(delete("/api/auth/demo")).andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Large payload handling")
    void testLargePayloadHandling() throws Exception {
      // Test with very large text content
      String largeText = "a".repeat(10000); // 10KB of text

      CreateStudyBookRequest largeRequest = new CreateStudyBookRequest();
      largeRequest.setLanguage("JavaScript");
      largeRequest.setQuestion(largeText);
      largeRequest.setExplanation(largeText);

      mockMvc
          .perform(
              post("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(largeRequest)))
          .andExpect(status().isBadRequest()) // Should be rejected due to size limits
          .andExpect(jsonPath("$.errorCode").value("VAL_001"));
    }

    @Test
    @DisplayName("Concurrent request handling")
    void testConcurrentRequests() throws Exception {
      // This test would ideally use multiple threads, but for simplicity
      // we'll test rapid sequential requests
      for (int i = 0; i < 5; i++) {
        CreateStudyBookRequest request = new CreateStudyBookRequest();
        request.setLanguage("JavaScript");
        request.setQuestion("var x = " + i + ";");
        request.setExplanation("Concurrent test " + i);

        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", testUserId)
                    .header("Authorization", "Bearer " + testAuthToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
      }

      // Verify all study books were created
      mockMvc
          .perform(
              get("/api/studybooks")
                  .header("X-User-Id", testUserId)
                  .header("Authorization", "Bearer " + testAuthToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalElements").value(5));
    }
  }
}
