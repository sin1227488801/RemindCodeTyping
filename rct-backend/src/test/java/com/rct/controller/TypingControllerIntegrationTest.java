package com.rct.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rct.integration.BaseIntegrationTest;
import com.rct.presentation.dto.request.RecordTypingResultRequest;
import java.time.LocalDateTime;
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
 * Integration tests for TypingController. Tests HTTP concerns and proper request/response mapping.
 */
@AutoConfigureWebMvc
@Transactional
class TypingControllerIntegrationTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  private UUID testUserId;
  private UUID testStudyBookId;

  @BeforeEach
  void setUp() {
    testUserId = UUID.randomUUID();
    testStudyBookId = UUID.randomUUID();
  }

  @Test
  @DisplayName("Should record typing result successfully")
  void shouldRecordTypingResultSuccessfully() throws Exception {
    RecordTypingResultRequest request = new RecordTypingResultRequest();
    request.setStudyBookId(testStudyBookId);
    request.setTypedText("console.log('Hello World');");
    request.setTargetText("console.log('Hello World');");
    request.setStartedAt(LocalDateTime.now().minusMinutes(1));
    request.setCompletedAt(LocalDateTime.now());
    request.setTotalCharacters(26);
    request.setCorrectCharacters(26);

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());
  }

  @Test
  @DisplayName("Should reject record typing result with invalid data")
  void shouldRejectRecordTypingResultWithInvalidData() throws Exception {
    RecordTypingResultRequest request = new RecordTypingResultRequest();
    // Missing required fields

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"))
        .andExpect(jsonPath("$.fieldErrors").exists());
  }

  @Test
  @DisplayName("Should reject record typing result without user ID header")
  void shouldRejectRecordTypingResultWithoutUserIdHeader() throws Exception {
    RecordTypingResultRequest request = new RecordTypingResultRequest();
    request.setStudyBookId(testStudyBookId);
    request.setTypedText("console.log('Hello World');");
    request.setTargetText("console.log('Hello World');");
    request.setStartedAt(LocalDateTime.now().minusMinutes(1));
    request.setCompletedAt(LocalDateTime.now());
    request.setTotalCharacters(26);
    request.setCorrectCharacters(26);

    mockMvc
        .perform(
            post("/api/typing/results")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_002"));
  }

  @Test
  @DisplayName("Should reject record typing result with negative character counts")
  void shouldRejectRecordTypingResultWithNegativeCharacterCounts() throws Exception {
    RecordTypingResultRequest request = new RecordTypingResultRequest();
    request.setStudyBookId(testStudyBookId);
    request.setTypedText("console.log('Hello World');");
    request.setTargetText("console.log('Hello World');");
    request.setStartedAt(LocalDateTime.now().minusMinutes(1));
    request.setCompletedAt(LocalDateTime.now());
    request.setTotalCharacters(-1); // Invalid: negative
    request.setCorrectCharacters(-1); // Invalid: negative

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"));
  }

  @Test
  @DisplayName("Should reject record typing result with correct characters greater than total")
  void shouldRejectRecordTypingResultWithCorrectCharactersGreaterThanTotal() throws Exception {
    RecordTypingResultRequest request = new RecordTypingResultRequest();
    request.setStudyBookId(testStudyBookId);
    request.setTypedText("console.log('Hello World');");
    request.setTargetText("console.log('Hello World');");
    request.setStartedAt(LocalDateTime.now().minusMinutes(1));
    request.setCompletedAt(LocalDateTime.now());
    request.setTotalCharacters(10);
    request.setCorrectCharacters(15); // Invalid: greater than total

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"));
  }

  @Test
  @DisplayName("Should reject record typing result with completed time before started time")
  void shouldRejectRecordTypingResultWithCompletedTimeBeforeStartedTime() throws Exception {
    LocalDateTime now = LocalDateTime.now();
    RecordTypingResultRequest request = new RecordTypingResultRequest();
    request.setStudyBookId(testStudyBookId);
    request.setTypedText("console.log('Hello World');");
    request.setTargetText("console.log('Hello World');");
    request.setStartedAt(now);
    request.setCompletedAt(now.minusMinutes(1)); // Invalid: before started time
    request.setTotalCharacters(26);
    request.setCorrectCharacters(26);

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"));
  }

  @Test
  @DisplayName("Should get typing statistics successfully")
  void shouldGetTypingStatisticsSuccessfully() throws Exception {
    mockMvc
        .perform(get("/api/typing/statistics").header("X-User-Id", testUserId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalSessions").exists())
        .andExpect(jsonPath("$.averageAccuracy").exists())
        .andExpect(jsonPath("$.totalCharactersTyped").exists())
        .andExpect(jsonPath("$.averageSpeed").exists())
        .andExpect(jsonPath("$.bestAccuracy").exists())
        .andExpect(jsonPath("$.recentSessions").isArray());
  }

  @Test
  @DisplayName("Should reject get typing statistics without user ID header")
  void shouldRejectGetTypingStatisticsWithoutUserIdHeader() throws Exception {
    mockMvc
        .perform(get("/api/typing/statistics"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_002"));
  }

  @Test
  @DisplayName("Should reject requests with invalid UUID format")
  void shouldRejectRequestsWithInvalidUuidFormat() throws Exception {
    RecordTypingResultRequest request = new RecordTypingResultRequest();
    request.setStudyBookId(testStudyBookId);
    request.setTypedText("console.log('Hello World');");
    request.setTargetText("console.log('Hello World');");
    request.setStartedAt(LocalDateTime.now().minusMinutes(1));
    request.setCompletedAt(LocalDateTime.now());
    request.setTotalCharacters(26);
    request.setCorrectCharacters(26);

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", "invalid-uuid")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_003"));
  }

  @Test
  @DisplayName("Should handle malformed JSON gracefully")
  void shouldHandleMalformedJsonGracefully() throws Exception {
    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_003"));
  }

  @Test
  @DisplayName("Should handle missing content type gracefully")
  void shouldHandleMissingContentTypeGracefully() throws Exception {
    RecordTypingResultRequest request = new RecordTypingResultRequest();
    request.setStudyBookId(testStudyBookId);
    request.setTypedText("console.log('Hello World');");
    request.setTargetText("console.log('Hello World');");
    request.setStartedAt(LocalDateTime.now().minusMinutes(1));
    request.setCompletedAt(LocalDateTime.now());
    request.setTotalCharacters(26);
    request.setCorrectCharacters(26);

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", testUserId.toString())
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnsupportedMediaType());
  }

  @Test
  @DisplayName("Should handle very large text inputs gracefully")
  void shouldHandleVeryLargeTextInputsGracefully() throws Exception {
    String largeText = "a".repeat(10000); // 10KB of text

    RecordTypingResultRequest request = new RecordTypingResultRequest();
    request.setStudyBookId(testStudyBookId);
    request.setTypedText(largeText);
    request.setTargetText(largeText);
    request.setStartedAt(LocalDateTime.now().minusMinutes(1));
    request.setCompletedAt(LocalDateTime.now());
    request.setTotalCharacters(largeText.length());
    request.setCorrectCharacters(largeText.length());

    mockMvc
        .perform(
            post("/api/typing/results")
                .header("X-User-Id", testUserId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest()) // Should be rejected due to size limits
        .andExpect(jsonPath("$.errorCode").value("VAL_001"));
  }
}
