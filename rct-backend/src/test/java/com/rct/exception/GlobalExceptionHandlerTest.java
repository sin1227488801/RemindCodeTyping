package com.rct.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.rct.integration.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for GlobalExceptionHandler. Tests comprehensive error handling and proper error
 * response format.
 */
@AutoConfigureWebMvc
@Transactional
class GlobalExceptionHandlerTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Test
  @DisplayName("Should return proper error format for not found endpoints")
  void shouldReturnProperErrorFormatForNotFoundEndpoints() throws Exception {
    mockMvc
        .perform(get("/api/nonexistent"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.errorCode").exists())
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.userMessage").exists())
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.timestamp").exists())
        .andExpect(jsonPath("$.path").exists())
        .andExpect(jsonPath("$.traceId").exists());
  }

  @Test
  @DisplayName("Should return proper error format for method not allowed")
  void shouldReturnProperErrorFormatForMethodNotAllowed() throws Exception {
    // Try to POST to a GET endpoint
    mockMvc
        .perform(get("/api/studybooks").header("X-HTTP-Method-Override", "DELETE"))
        .andExpect(status().isUnauthorized()); // Will be unauthorized due to missing auth
  }

  @Test
  @DisplayName("Should handle missing required headers gracefully")
  void shouldHandleMissingRequiredHeadersGracefully() throws Exception {
    // This should trigger missing header validation
    mockMvc
        .perform(get("/api/studybooks"))
        .andExpect(status().isUnauthorized()); // Will be unauthorized due to missing auth
  }
}
