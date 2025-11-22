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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * End-to-end integration tests that verify complete user workflows across multiple API endpoints.
 * These tests simulate real user scenarios from registration to typing practice completion.
 */
@AutoConfigureWebMvc
@Transactional
class EndToEndIntegrationTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @DisplayName(
      "Complete user workflow: Register -> Login -> Create StudyBook -> Practice Typing -> View Statistics")
  void shouldCompleteFullUserWorkflow() throws Exception {
    // Step 1: Register a new user
    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setLoginId("e2euser123");
    registerRequest.setPassword("SecurePass123!");

    MvcResult registerResult =
        mockMvc
            .perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.userId").exists())
            .andExpect(jsonPath("$.token").exists())
            .andReturn();

    String registerResponse = registerResult.getResponse().getContentAsString();
    String userId = objectMapper.readTree(registerResponse).get("userId").asText();
    String authToken = objectMapper.readTree(registerResponse).get("token").asText();

    // Step 2: Login with the registered user
    LoginRequest loginRequest = new LoginRequest();
    loginRequest.setLoginId("e2euser123");
    loginRequest.setPassword("SecurePass123!");

    MvcResult loginResult =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").value(userId))
            .andExpect(jsonPath("$.token").exists())
            .andReturn();

    String loginResponse = loginResult.getResponse().getContentAsString();
    String loginToken = objectMapper.readTree(loginResponse).get("token").asText();

    // Step 3: Create a study book
    CreateStudyBookRequest createStudyBookRequest = new CreateStudyBookRequest();
    createStudyBookRequest.setLanguage("JavaScript");
    createStudyBookRequest.setQuestion("function greet(name) { return 'Hello, ' + name + '!'; }");
    createStudyBookRequest.setExplanation("A simple greeting function that takes a name parameter");

    MvcResult createStudyBookResult =
        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", userId)
                    .header("Authorization", "Bearer " + loginToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createStudyBookRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.language").value("JavaScript"))
            .andReturn();

    String createStudyBookResponse = createStudyBookResult.getResponse().getContentAsString();
    String studyBookId = objectMapper.readTree(createStudyBookResponse).get("id").asText();

    // Step 4: Get study books to verify creation
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + loginToken)
                .param("page", "0")
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.content[0].id").value(studyBookId))
        .andExpect(jsonPath("$.totalElements").value(1));

    // Step 5: Practice typing with the created study book
    RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
    typingRequest.setStudyBookId(UUID.fromString(studyBookId));
    typingRequest.setTypedText("function greet(name) { return 'Hello, ' + name + '!'; }");
    typingRequest.setTargetText("function greet(name) { return 'Hello, ' + name + '!'; }");
    typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(2));
    typingRequest.setCompletedAt(LocalDateTime.now());
    typingRequest.setTotalCharacters(54);
    typingRequest.setCorrectCharacters(54);

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + loginToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(typingRequest)))
        .andExpect(status().isCreated());

    // Step 6: View typing statistics
    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + loginToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSessions").value(1))
        .andExpect(jsonPath("$.averageAccuracy").value(100.0))
        .andExpect(jsonPath("$.totalCharactersTyped").value(54))
        .andExpect(jsonPath("$.bestAccuracy").value(100.0))
        .andExpect(jsonPath("$.recentSessions").isArray())
        .andExpect(jsonPath("$.recentSessions[0].accuracy").value(100.0));

    // Step 7: Get random study books for practice
    mockMvc
        .perform(
            get("/api/studybooks/random")
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + loginToken)
                .param("language", "JavaScript")
                .param("limit", "3"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @DisplayName("Demo user workflow: Create demo session -> Practice typing -> View statistics")
  void shouldCompleteDemoUserWorkflow() throws Exception {
    // Step 1: Create demo session
    MvcResult demoResult =
        mockMvc
            .perform(post("/api/auth/demo"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").exists())
            .andExpect(jsonPath("$.isGuest").value(true))
            .andReturn();

    String demoResponse = demoResult.getResponse().getContentAsString();
    String demoUserId = objectMapper.readTree(demoResponse).get("userId").asText();
    String demoToken = objectMapper.readTree(demoResponse).get("token").asText();

    // Step 2: Get system study books for demo user
    MvcResult studyBooksResult =
        mockMvc
            .perform(
                get("/api/studybooks/random")
                    .header("X-User-Id", demoUserId)
                    .header("Authorization", "Bearer " + demoToken)
                    .param("limit", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andReturn();

    // If there are system study books, practice with one
    String studyBooksResponse = studyBooksResult.getResponse().getContentAsString();
    if (!objectMapper.readTree(studyBooksResponse).isEmpty()) {
      String systemStudyBookId =
          objectMapper.readTree(studyBooksResponse).get(0).get("id").asText();
      String targetText = objectMapper.readTree(studyBooksResponse).get(0).get("question").asText();

      // Step 3: Practice typing with system study book
      RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
      typingRequest.setStudyBookId(UUID.fromString(systemStudyBookId));
      typingRequest.setTypedText(targetText);
      typingRequest.setTargetText(targetText);
      typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(1));
      typingRequest.setCompletedAt(LocalDateTime.now());
      typingRequest.setTotalCharacters(targetText.length());
      typingRequest.setCorrectCharacters(targetText.length());

      mockMvc
          .perform(
              post("/api/typing/results")
                  .header("X-User-Id", demoUserId)
                  .header("Authorization", "Bearer " + demoToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(typingRequest)))
          .andExpect(status().isCreated());

      // Step 4: View typing statistics for demo user
      mockMvc
          .perform(
              get("/api/typing/statistics")
                  .header("X-User-Id", demoUserId)
                  .header("Authorization", "Bearer " + demoToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalSessions").value(1))
          .andExpect(jsonPath("$.averageAccuracy").value(100.0));
    }
  }

  @Test
  @DisplayName("Multi-session typing practice workflow with accuracy tracking")
  void shouldTrackMultipleTypingSessions() throws Exception {
    // Step 1: Register user
    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setLoginId("multisession123");
    registerRequest.setPassword("SecurePass123!");

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
    String authToken = objectMapper.readTree(registerResponse).get("token").asText();

    // Step 2: Create multiple study books
    String[] questions = {
      "console.log('Hello World');",
      "const sum = (a, b) => a + b;",
      "if (condition) { return true; }"
    };

    String[] studyBookIds = new String[3];
    for (int i = 0; i < questions.length; i++) {
      CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
      createRequest.setLanguage("JavaScript");
      createRequest.setQuestion(questions[i]);
      createRequest.setExplanation("Test question " + (i + 1));

      MvcResult createResult =
          mockMvc
              .perform(
                  post("/api/studybooks")
                      .header("X-User-Id", userId)
                      .header("Authorization", "Bearer " + authToken)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content(objectMapper.writeValueAsString(createRequest)))
              .andExpect(status().isCreated())
              .andReturn();

      String createResponse = createResult.getResponse().getContentAsString();
      studyBookIds[i] = objectMapper.readTree(createResponse).get("id").asText();
    }

    // Step 3: Practice typing with different accuracy levels
    double[] accuracies = {100.0, 95.0, 90.0};
    for (int i = 0; i < studyBookIds.length; i++) {
      String targetText = questions[i];
      int totalChars = targetText.length();
      int correctChars = (int) (totalChars * accuracies[i] / 100.0);

      RecordTypingResultRequest typingRequest = new RecordTypingResultRequest();
      typingRequest.setStudyBookId(UUID.fromString(studyBookIds[i]));
      typingRequest.setTypedText(
          targetText.substring(0, correctChars) + "x".repeat(totalChars - correctChars));
      typingRequest.setTargetText(targetText);
      typingRequest.setStartedAt(LocalDateTime.now().minusMinutes(i + 1));
      typingRequest.setCompletedAt(LocalDateTime.now().minusMinutes(i));
      typingRequest.setTotalCharacters(totalChars);
      typingRequest.setCorrectCharacters(correctChars);

      mockMvc
          .perform(
              post("/api/typing/results")
                  .header("X-User-Id", userId)
                  .header("Authorization", "Bearer " + authToken)
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(objectMapper.writeValueAsString(typingRequest)))
          .andExpect(status().isCreated());
    }

    // Step 4: Verify statistics calculation
    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + authToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSessions").value(3))
        .andExpect(jsonPath("$.averageAccuracy").value(95.0)) // (100 + 95 + 90) / 3
        .andExpect(jsonPath("$.bestAccuracy").value(100.0))
        .andExpect(jsonPath("$.recentSessions").isArray())
        .andExpect(jsonPath("$.recentSessions.length()").value(3));
  }

  @Test
  @DisplayName("Study book management workflow: Create -> Update -> Delete")
  void shouldManageStudyBooksLifecycle() throws Exception {
    // Step 1: Register user
    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setLoginId("studybookmanager123");
    registerRequest.setPassword("SecurePass123!");

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
    String authToken = objectMapper.readTree(registerResponse).get("token").asText();

    // Step 2: Create study book
    CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
    createRequest.setLanguage("Python");
    createRequest.setQuestion("print('Hello World')");
    createRequest.setExplanation("Basic Python print statement");

    MvcResult createResult =
        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("X-User-Id", userId)
                    .header("Authorization", "Bearer " + authToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.language").value("Python"))
            .andReturn();

    String createResponse = createResult.getResponse().getContentAsString();
    String studyBookId = objectMapper.readTree(createResponse).get("id").asText();

    // Step 3: Verify study book exists in list
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + authToken)
                .param("language", "Python"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.content[0].id").value(studyBookId))
        .andExpect(jsonPath("$.totalElements").value(1));

    // Step 4: Update study book
    UpdateStudyBookRequest updateRequest = new UpdateStudyBookRequest();
    updateRequest.setLanguage("Python");
    updateRequest.setQuestion("print('Hello, Updated World!')");
    updateRequest.setExplanation("Updated Python print statement");

    mockMvc
        .perform(
            put("/api/studybooks/{id}", studyBookId)
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.question").value("print('Hello, Updated World!')"))
        .andExpect(jsonPath("$.explanation").value("Updated Python print statement"));

    // Step 5: Delete study book
    mockMvc
        .perform(
            delete("/api/studybooks/{id}", studyBookId)
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + authToken))
        .andExpect(status().isNoContent());

    // Step 6: Verify study book is deleted
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + authToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.totalElements").value(0));
  }

  @Test
  @DisplayName("Error handling workflow: Invalid operations and recovery")
  void shouldHandleErrorsGracefully() throws Exception {
    // Step 1: Try to access protected endpoint without authentication
    mockMvc
        .perform(get("/api/studybooks"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_002"));

    // Step 2: Register user with invalid data
    RegisterRequest invalidRegisterRequest = new RegisterRequest();
    invalidRegisterRequest.setLoginId(""); // Invalid
    invalidRegisterRequest.setPassword("123"); // Too short

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRegisterRequest)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"));

    // Step 3: Register valid user
    RegisterRequest validRegisterRequest = new RegisterRequest();
    validRegisterRequest.setLoginId("errorhandling123");
    validRegisterRequest.setPassword("SecurePass123!");

    MvcResult registerResult =
        mockMvc
            .perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRegisterRequest)))
            .andExpect(status().isCreated())
            .andReturn();

    String registerResponse = registerResult.getResponse().getContentAsString();
    String userId = objectMapper.readTree(registerResponse).get("userId").asText();
    String authToken = objectMapper.readTree(registerResponse).get("token").asText();

    // Step 4: Try to duplicate registration
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRegisterRequest)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.errorCode").value("AUTH_003"));

    // Step 5: Try to access non-existent study book
    UUID nonExistentId = UUID.randomUUID();
    mockMvc
        .perform(
            delete("/api/studybooks/{id}", nonExistentId)
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + authToken))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.errorCode").value("STUDYBOOK_001"));

    // Step 6: Try to record typing result with invalid data
    RecordTypingResultRequest invalidTypingRequest = new RecordTypingResultRequest();
    invalidTypingRequest.setStudyBookId(nonExistentId);
    invalidTypingRequest.setTotalCharacters(-1); // Invalid
    invalidTypingRequest.setCorrectCharacters(-1); // Invalid

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", userId)
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidTypingRequest)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"));
  }
}
