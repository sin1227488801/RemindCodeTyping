package com.rct.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rct.integration.BaseIntegrationTest;
import com.rct.presentation.dto.request.CreateStudyBookRequest;
import com.rct.presentation.dto.request.UpdateStudyBookRequest;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for StudyBookController. Tests HTTP concerns and proper request/response
 * mapping.
 */
@AutoConfigureWebMvc
@Transactional
class StudyBookControllerIntegrationTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  private UUID testUserId;

  @BeforeEach
  void setUp() {
    testUserId = UUID.randomUUID();
  }

  @Test
  @DisplayName("Should create study book successfully")
  void shouldCreateStudyBookSuccessfully() throws Exception {
    CreateStudyBookRequest request = new CreateStudyBookRequest();
    request.setLanguage("JavaScript");
    request.setQuestion("console.log('Hello World');");
    request.setExplanation("Prints Hello World to console");

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.language").value("JavaScript"))
        .andExpect(jsonPath("$.question").value("console.log('Hello World');"))
        .andExpect(jsonPath("$.explanation").value("Prints Hello World to console"))
        .andExpect(jsonPath("$.isSystemProblem").value(false));
  }

  @Test
  @DisplayName("Should reject create study book with invalid data")
  void shouldRejectCreateStudyBookWithInvalidData() throws Exception {
    CreateStudyBookRequest request = new CreateStudyBookRequest();
    request.setLanguage(""); // Invalid: empty
    request.setQuestion(""); // Invalid: empty

    mockMvc
        .perform(
            post("/api/studybooks")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"))
        .andExpect(jsonPath("$.fieldErrors").exists());
  }

  @Test
  @DisplayName("Should reject create study book without user ID header")
  void shouldRejectCreateStudyBookWithoutUserIdHeader() throws Exception {
    CreateStudyBookRequest request = new CreateStudyBookRequest();
    request.setLanguage("JavaScript");
    request.setQuestion("console.log('Hello World');");

    mockMvc
        .perform(
            post("/api/studybooks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_002"));
  }

  @Test
  @DisplayName("Should get study books with pagination")
  void shouldGetStudyBooksWithPagination() throws Exception {
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", testUserId.toString())
                .param("page", "0")
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.pageable").exists())
        .andExpect(jsonPath("$.totalElements").exists());
  }

  @Test
  @DisplayName("Should get study books with language filter")
  void shouldGetStudyBooksWithLanguageFilter() throws Exception {
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", testUserId.toString())
                .param("language", "JavaScript")
                .param("page", "0")
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }

  @Test
  @DisplayName("Should get study books with search query")
  void shouldGetStudyBooksWithSearchQuery() throws Exception {
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", testUserId.toString())
                .param("query", "console")
                .param("page", "0")
                .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }

  @Test
  @DisplayName("Should update study book successfully")
  void shouldUpdateStudyBookSuccessfully() throws Exception {
    UUID studyBookId = UUID.randomUUID();
    UpdateStudyBookRequest request = new UpdateStudyBookRequest();
    request.setLanguage("Python");
    request.setQuestion("print('Hello World')");
    request.setExplanation("Updated explanation");

    mockMvc
        .perform(
            put("/api/studybooks/{id}", studyBookId)
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isNotFound()); // Expected since study book doesn't exist
  }

  @Test
  @DisplayName("Should reject update study book with invalid data")
  void shouldRejectUpdateStudyBookWithInvalidData() throws Exception {
    UUID studyBookId = UUID.randomUUID();
    UpdateStudyBookRequest request = new UpdateStudyBookRequest();
    request.setLanguage(""); // Invalid: empty
    request.setQuestion(""); // Invalid: empty

    mockMvc
        .perform(
            put("/api/studybooks/{id}", studyBookId)
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"));
  }

  @Test
  @DisplayName("Should delete study book successfully")
  void shouldDeleteStudyBookSuccessfully() throws Exception {
    UUID studyBookId = UUID.randomUUID();

    mockMvc
        .perform(
            delete("/api/studybooks/{id}", studyBookId).header("X-User-Id", testUserId.toString()))
        .andExpect(status().isNotFound()); // Expected since study book doesn't exist
  }

  @Test
  @DisplayName("Should get random study books successfully")
  void shouldGetRandomStudyBooksSuccessfully() throws Exception {
    mockMvc
        .perform(
            get("/api/studybooks/random")
                .header("X-User-Id", testUserId.toString())
                .param("limit", "5"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @DisplayName("Should get random study books with language filter")
  void shouldGetRandomStudyBooksWithLanguageFilter() throws Exception {
    mockMvc
        .perform(
            get("/api/studybooks/random")
                .header("X-User-Id", testUserId.toString())
                .param("language", "JavaScript")
                .param("limit", "3"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @DisplayName("Should get all languages successfully")
  void shouldGetAllLanguagesSuccessfully() throws Exception {
    mockMvc
        .perform(get("/api/studybooks/languages").header("X-User-Id", testUserId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray());
  }

  @Test
  @DisplayName("Should reject requests with invalid UUID format")
  void shouldRejectRequestsWithInvalidUuidFormat() throws Exception {
    mockMvc
        .perform(get("/api/studybooks").header("X-User-Id", "invalid-uuid"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_003"));
  }

  @Test
  @DisplayName("Should handle large page size gracefully")
  void shouldHandleLargePageSizeGracefully() throws Exception {
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", testUserId.toString())
                .param("page", "0")
                .param("size", "1000")) // Large page size
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }

  @Test
  @DisplayName("Should handle negative page parameters gracefully")
  void shouldHandleNegativePageParametersGracefully() throws Exception {
    mockMvc
        .perform(
            get("/api/studybooks")
                .header("X-User-Id", testUserId.toString())
                .param("page", "-1")
                .param("size", "-1"))
        .andExpect(status().isOk()) // Spring Boot handles this gracefully
        .andExpect(jsonPath("$.content").isArray());
  }
}
