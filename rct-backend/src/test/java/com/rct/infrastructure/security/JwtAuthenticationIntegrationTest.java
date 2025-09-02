package com.rct.infrastructure.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.PasswordHash;
import com.rct.domain.model.user.Role;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import com.rct.integration.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Integration tests for JWT authentication system. */
@AutoConfigureWebMvc
class JwtAuthenticationIntegrationTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private JwtTokenService jwtTokenService;

  @Test
  void shouldAllowAccessWithValidToken() throws Exception {
    // Given
    User user =
        User.create(
            UserId.generate(),
            LoginId.of("testuser"),
            PasswordHash.of("hashedpassword"),
            Role.user());
    String token = jwtTokenService.generateAccessToken(user);

    // When & Then
    mockMvc
        .perform(
            get("/api/study-books")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk());
  }

  @Test
  void shouldDenyAccessWithoutToken() throws Exception {
    // When & Then
    mockMvc
        .perform(get("/api/study-books").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void shouldDenyAccessWithInvalidToken() throws Exception {
    // When & Then
    mockMvc
        .perform(
            get("/api/study-books")
                .header("Authorization", "Bearer invalid-token")
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void shouldDenyAccessWithRefreshToken() throws Exception {
    // Given
    User user =
        User.create(
            UserId.generate(),
            LoginId.of("testuser"),
            PasswordHash.of("hashedpassword"),
            Role.user());
    String refreshToken = jwtTokenService.generateRefreshToken(user);

    // When & Then
    mockMvc
        .perform(
            get("/api/study-books")
                .header("Authorization", "Bearer " + refreshToken)
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void shouldAllowAdminAccessToAdminEndpoints() throws Exception {
    // Given
    User adminUser =
        User.create(
            UserId.generate(),
            LoginId.of("admin"),
            PasswordHash.of("hashedpassword"),
            Role.admin());
    String token = jwtTokenService.generateAccessToken(adminUser);

    // When & Then
    mockMvc
        .perform(
            get("/api/admin/users")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isNotFound()); // Endpoint doesn't exist, but auth passes
  }

  @Test
  void shouldDenyUserAccessToAdminEndpoints() throws Exception {
    // Given
    User user =
        User.create(
            UserId.generate(),
            LoginId.of("testuser"),
            PasswordHash.of("hashedpassword"),
            Role.user());
    String token = jwtTokenService.generateAccessToken(user);

    // When & Then
    mockMvc
        .perform(
            get("/api/admin/users")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldAllowGuestAccessToTypingEndpoints() throws Exception {
    // Given
    User guestUser =
        User.create(
            UserId.generate(),
            LoginId.of("guest123"),
            PasswordHash.of("hashedpassword"),
            Role.guest());
    String token = jwtTokenService.generateAccessToken(guestUser);

    // When & Then
    mockMvc
        .perform(
            get("/api/typing/statistics")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk());
  }

  @Test
  void shouldDenyGuestAccessToStudyBookCreation() throws Exception {
    // Given
    User guestUser =
        User.create(
            UserId.generate(),
            LoginId.of("guest123"),
            PasswordHash.of("hashedpassword"),
            Role.guest());
    String token = jwtTokenService.generateAccessToken(guestUser);

    // When & Then
    mockMvc
        .perform(
            post("/api/study-books")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"language\":\"Java\",\"question\":\"test\",\"explanation\":\"test\"}"))
        .andExpect(status().isForbidden());
  }
}
