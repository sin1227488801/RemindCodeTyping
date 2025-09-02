package com.rct.documentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rct.integration.BaseIntegrationTest;
import com.rct.presentation.dto.request.CreateStudyBookRequest;
import com.rct.presentation.dto.request.LoginRequest;
import com.rct.presentation.dto.request.RecordTypingResultRequest;
import com.rct.presentation.dto.request.RegisterRequest;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests that validate API documentation accuracy by testing actual API behavior against
 * documented examples and specifications.
 *
 * <p>These tests ensure that:
 *
 * <ul>
 *   <li>API endpoints work as documented
 *   <li>Request/response formats match OpenAPI specifications
 *   <li>Error responses follow documented patterns
 *   <li>Authentication requirements are correctly enforced
 * </ul>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@Transactional
@DisplayName("API Documentation Validation Tests")
class ApiDocumentationTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @DisplayName("Authentication endpoints should work as documented")
  void testAuthenticationEndpointsDocumentation() throws Exception {
    // Test user registration as documented
    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setLoginId("doctest_user");
    registerRequest.setPassword("password123");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.loginId").value("doctest_user"))
        .andExpect(jsonPath("$.accessToken").exists())
        .andExpect(jsonPath("$.refreshToken").exists())
        .andExpect(jsonPath("$.expiresIn").exists())
        .andExpect(jsonPath("$.tokenType").value("Bearer"));

    // Test user login as documented
    LoginRequest loginRequest = new LoginRequest();
    loginRequest.setLoginId("doctest_user");
    loginRequest.setPassword("password123");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.loginId").value("doctest_user"))
        .andExpect(jsonPath("$.accessToken").exists())
        .andExpect(jsonPath("$.refreshToken").exists());

    // Test demo login as documented
    mockMvc
        .perform(post("/api/auth/demo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.loginId").value("guest"))
        .andExpect(jsonPath("$.accessToken").exists());
  }

  @Test
  @DisplayName("Authentication error responses should match documentation")
  void testAuthenticationErrorDocumentation() throws Exception {
    // Test invalid credentials error
    LoginRequest invalidRequest = new LoginRequest();
    invalidRequest.setLoginId("nonexistent");
    invalidRequest.setPassword("wrongpassword");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.errorCode").exists())
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.timestamp").exists());

    // Test validation error
    LoginRequest emptyRequest = new LoginRequest();
    emptyRequest.setLoginId("");
    emptyRequest.setPassword("");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyRequest)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").exists())
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.timestamp").exists());
  }

  @Test
  @DisplayName("Study book endpoints should work as documented")
  void testStudyBookEndpointsDocumentation() throws Exception {
    // Create authenticated user
    var authResult = createAuthenticatedUser("doctest_studybook");
    String accessToken = authResult.getAccessToken();
    UUID userId = authResult.getUserId();

    // Test study book creation as documented
    CreateStudyBookRequest createRequest = new CreateStudyBookRequest();
    createRequest.setLanguage("JavaScript");
    createRequest.setQuestion("console.log('Hello World');");
    createRequest.setExplanation("Basic console output in JavaScript");

    String createResponse =
        mockMvc
            .perform(
                post("/api/studybooks")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("X-User-Id", userId.toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.language").value("JavaScript"))
            .andExpect(jsonPath("$.question").value("console.log('Hello World');"))
            .andExpect(jsonPath("$.explanation").value("Basic console output in JavaScript"))
            .andExpect(jsonPath("$.createdAt").exists())
            .andExpect(jsonPath("$.updatedAt").exists())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // Test getting study books as documented
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-User-Id", userId.toString())
                .param("language", "JavaScript")
                .param("page", "0")
                .param("size", "20"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.pageable.pageNumber").value(0))
        .andExpect(jsonPath("$.pageable.pageSize").value(20))
        .andExpect(jsonPath("$.totalElements").exists())
        .andExpect(jsonPath("$.totalPages").exists())
        .andExpect(jsonPath("$.first").exists())
        .andExpect(jsonPath("$.last").exists());

    // Test getting random study books as documented
    mockMvc
        .perform(
            get("/api/studybooks/random")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-User-Id", userId.toString())
                .param("language", "JavaScript")
                .param("limit", "5"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());

    // Test getting languages as documented
    mockMvc
        .perform(
            get("/api/studybooks/languages")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-User-Id", userId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @DisplayName("Study book error responses should match documentation")
  void testStudyBookErrorDocumentation() throws Exception {
    // Test unauthorized access
    mockMvc
        .perform(get("/api/studybooks"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.errorCode").exists())
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.timestamp").exists());

    // Test validation error
    var authResult = createAuthenticatedUser("doctest_validation");
    String accessToken = authResult.getAccessToken();
    UUID userId = authResult.getUserId();

    CreateStudyBookRequest invalidRequest = new CreateStudyBookRequest();
    invalidRequest.setLanguage(""); // Invalid empty language
    invalidRequest.setQuestion(""); // Invalid empty question

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-User-Id", userId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").exists())
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.timestamp").exists());
  }

  @Test
  @DisplayName("Typing session endpoints should work as documented")
  void testTypingSessionEndpointsDocumentation() throws Exception {
    // Create authenticated user and study book
    var authResult = createAuthenticatedUser("doctest_typing");
    String accessToken = authResult.getAccessToken();
    UUID userId = authResult.getUserId();

    var studyBook = createTestStudyBook(userId, "JavaScript", "console.log('test');");

    // Test recording typing result as documented
    RecordTypingResultRequest recordRequest = new RecordTypingResultRequest();
    recordRequest.setStudyBookId(studyBook.getId());
    recordRequest.setTypedText("console.log('test');");
    recordRequest.setDurationMs(15000L);
    recordRequest.setAccuracy(95.5);

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-User-Id", userId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(recordRequest)))
        .andExpect(status().isCreated());

    // Test getting typing statistics as documented
    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-User-Id", userId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalAttempts").exists())
        .andExpect(jsonPath("$.averageAccuracy").exists())
        .andExpect(jsonPath("$.bestAccuracy").exists())
        .andExpect(jsonPath("$.totalCharsTyped").exists())
        .andExpect(jsonPath("$.totalTimeMs").exists())
        .andExpect(jsonPath("$.currentLoginStreak").exists())
        .andExpect(jsonPath("$.maxLoginStreak").exists())
        .andExpect(jsonPath("$.totalLoginDays").exists());
  }

  @Test
  @DisplayName("OpenAPI specification should be accessible")
  void testOpenApiSpecificationAccess() throws Exception {
    // Test that OpenAPI JSON specification is accessible
    mockMvc
        .perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.openapi").exists())
        .andExpect(jsonPath("$.info.title").value("RemindCodeTyping API"))
        .andExpect(jsonPath("$.info.description").exists())
        .andExpect(jsonPath("$.paths").exists())
        .andExpect(jsonPath("$.components.securitySchemes.bearerAuth").exists());

    // Test that Swagger UI is accessible
    mockMvc
        .perform(get("/swagger-ui/index.html"))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.TEXT_HTML));
  }

  @Test
  @DisplayName("API responses should include proper headers")
  void testApiResponseHeaders() throws Exception {
    var authResult = createAuthenticatedUser("doctest_headers");
    String accessToken = authResult.getAccessToken();
    UUID userId = authResult.getUserId();

    mockMvc
        .perform(
            get("/api/studybooks")
                .header("Authorization", "Bearer " + accessToken)
                .header("X-User-Id", userId.toString()))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Type", "application/json"))
        .andExpect(header().exists("X-Content-Type-Options"))
        .andExpect(header().exists("X-Frame-Options"));
  }

  @Test
  @DisplayName("API should handle CORS properly")
  void testCorsConfiguration() throws Exception {
    mockMvc
        .perform(
            options("/api/auth/demo")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isOk())
        .andExpect(header().exists("Access-Control-Allow-Origin"))
        .andExpect(header().exists("Access-Control-Allow-Methods"))
        .andExpect(header().exists("Access-Control-Allow-Headers"));
  }

  @Test
  @DisplayName("API should validate content types")
  void testContentTypeValidation() throws Exception {
    // Test that endpoints reject invalid content types
    mockMvc
        .perform(
            post("/api/auth/login").contentType(MediaType.TEXT_PLAIN).content("invalid content"))
        .andExpect(status().isUnsupportedMediaType());
  }

  @Test
  @DisplayName("API should handle malformed JSON")
  void testMalformedJsonHandling() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ invalid json }"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").exists())
        .andExpect(jsonPath("$.message").exists());
  }

  @Test
  @DisplayName("API should enforce rate limiting headers")
  void testRateLimitingHeaders() throws Exception {
    // Make multiple requests to check rate limiting headers
    for (int i = 0; i < 5; i++) {
      mockMvc
          .perform(post("/api/auth/demo"))
          .andExpect(status().isOk())
          .andExpect(header().exists("X-RateLimit-Remaining"));
    }
  }

  @Test
  @DisplayName("API documentation examples should be valid")
  void testDocumentationExamples() throws Exception {
    // Test that all examples in the documentation are valid JSON
    // This would typically parse the OpenAPI spec and validate examples

    // For now, test a few key examples manually
    String loginExample =
        """
        {
          "loginId": "testuser",
          "password": "password123"
        }
        """;

    // Validate that the example parses correctly
    LoginRequest loginRequest = objectMapper.readValue(loginExample, LoginRequest.class);
    assertThat(loginRequest.getLoginId()).isEqualTo("testuser");
    assertThat(loginRequest.getPassword()).isEqualTo("password123");
  }
}
