package com.rct.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rct.integration.BaseIntegrationTest;
import com.rct.presentation.dto.request.LoginRequest;
import com.rct.presentation.dto.request.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for AuthController. Tests HTTP concerns and proper request/response mapping.
 */
@AutoConfigureWebMvc
@Transactional
class AuthControllerIntegrationTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @DisplayName("Should register new user successfully")
  void shouldRegisterNewUserSuccessfully() throws Exception {
    RegisterRequest request = new RegisterRequest();
    request.setLoginId("newuser123");
    request.setPassword("SecurePass123!");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.loginId").value("newuser123"))
        .andExpect(jsonPath("$.token").exists())
        .andExpect(jsonPath("$.isGuest").value(false));
  }

  @Test
  @DisplayName("Should reject registration with invalid data")
  void shouldRejectRegistrationWithInvalidData() throws Exception {
    RegisterRequest request = new RegisterRequest();
    request.setLoginId(""); // Invalid: empty
    request.setPassword("123"); // Invalid: too short

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"))
        .andExpect(jsonPath("$.fieldErrors").exists());
  }

  @Test
  @DisplayName("Should reject registration with duplicate login ID")
  void shouldRejectRegistrationWithDuplicateLoginId() throws Exception {
    // First registration
    RegisterRequest firstRequest = new RegisterRequest();
    firstRequest.setLoginId("duplicate123");
    firstRequest.setPassword("SecurePass123!");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(firstRequest)))
        .andExpect(status().isCreated());

    // Second registration with same login ID
    RegisterRequest secondRequest = new RegisterRequest();
    secondRequest.setLoginId("duplicate123");
    secondRequest.setPassword("AnotherPass123!");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(secondRequest)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.errorCode").value("AUTH_003"));
  }

  @Test
  @DisplayName("Should login existing user successfully")
  void shouldLoginExistingUserSuccessfully() throws Exception {
    // First register a user
    RegisterRequest registerRequest = new RegisterRequest();
    registerRequest.setLoginId("logintest123");
    registerRequest.setPassword("SecurePass123!");

    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
        .andExpect(status().isCreated());

    // Then login
    LoginRequest loginRequest = new LoginRequest();
    loginRequest.setLoginId("logintest123");
    loginRequest.setPassword("SecurePass123!");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.loginId").value("logintest123"))
        .andExpect(jsonPath("$.token").exists())
        .andExpect(jsonPath("$.isGuest").value(false));
  }

  @Test
  @DisplayName("Should reject login with invalid credentials")
  void shouldRejectLoginWithInvalidCredentials() throws Exception {
    LoginRequest request = new LoginRequest();
    request.setLoginId("nonexistent");
    request.setPassword("wrongpassword");

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.errorCode").value("AUTH_001"));
  }

  @Test
  @DisplayName("Should reject login with invalid request format")
  void shouldRejectLoginWithInvalidRequestFormat() throws Exception {
    LoginRequest request = new LoginRequest();
    request.setLoginId(""); // Invalid: empty
    request.setPassword(""); // Invalid: empty

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_001"))
        .andExpect(jsonPath("$.fieldErrors").exists());
  }

  @Test
  @DisplayName("Should create demo session successfully")
  void shouldCreateDemoSessionSuccessfully() throws Exception {
    mockMvc
        .perform(post("/api/auth/demo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.loginId").exists())
        .andExpect(jsonPath("$.token").exists())
        .andExpect(jsonPath("$.isGuest").value(true));
  }

  @Test
  @DisplayName("Should reject malformed JSON")
  void shouldRejectMalformedJson() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VAL_003"));
  }

  @Test
  @DisplayName("Should reject missing content type")
  void shouldRejectMissingContentType() throws Exception {
    LoginRequest request = new LoginRequest();
    request.setLoginId("test");
    request.setPassword("password");

    mockMvc
        .perform(post("/api/auth/login").content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnsupportedMediaType());
  }
}
