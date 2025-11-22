package com.rct.infrastructure.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.rct.integration.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureWebMvc
@DisplayName("Security Configuration Integration Tests")
class SecurityConfigIntegrationTest extends BaseIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Test
  @DisplayName("Should allow access to public authentication endpoints")
  void shouldAllowAccessToPublicAuthenticationEndpoints() throws Exception {
    // Test login endpoint
    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"loginId\":\"test\",\"password\":\"test\"}"))
        .andExpect(status().isNotFound()); // 404 because endpoint doesn't exist yet, but not 401

    // Test register endpoint
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"loginId\":\"test\",\"password\":\"test\"}"))
        .andExpect(status().isNotFound()); // 404 because endpoint doesn't exist yet, but not 401
  }

  @Test
  @DisplayName("Should allow access to health check endpoints")
  void shouldAllowAccessToHealthCheckEndpoints() throws Exception {
    mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());

    mockMvc.perform(get("/actuator/info")).andExpect(status().isOk());
  }

  @Test
  @DisplayName("Should deny access to protected endpoints without authentication")
  void shouldDenyAccessToProtectedEndpointsWithoutAuthentication() throws Exception {
    mockMvc
        .perform(get("/api/users/profile"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("Unauthorized"))
        .andExpect(jsonPath("$.message").value("Authentication required to access this resource"))
        .andExpect(jsonPath("$.errorCode").value("AUTH_001"));
  }

  @Test
  @DisplayName("Should deny access to protected endpoints with invalid token")
  void shouldDenyAccessToProtectedEndpointsWithInvalidToken() throws Exception {
    mockMvc
        .perform(get("/api/users/profile").header("Authorization", "Bearer invalid.jwt.token"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("Unauthorized"));
  }

  @Test
  @DisplayName("Should deny access to protected endpoints with malformed authorization header")
  void shouldDenyAccessToProtectedEndpointsWithMalformedAuthorizationHeader() throws Exception {
    // Test without Bearer prefix
    mockMvc
        .perform(get("/api/users/profile").header("Authorization", "invalid.jwt.token"))
        .andExpect(status().isUnauthorized());

    // Test with Basic auth
    mockMvc
        .perform(get("/api/users/profile").header("Authorization", "Basic dGVzdDp0ZXN0"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("Should handle CORS preflight requests")
  void shouldHandleCorsPreflightRequests() throws Exception {
    mockMvc
        .perform(
            MockMvcRequestBuilders.options("/api/users/profile")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "Authorization"))
        .andExpect(status().isOk());
  }

  @Test
  @DisplayName("Should allow access to static resources")
  void shouldAllowAccessToStaticResources() throws Exception {
    // These will return 404 since files don't exist, but should not return 401
    mockMvc.perform(get("/css/style.css")).andExpect(status().isNotFound());
    mockMvc.perform(get("/js/app.js")).andExpect(status().isNotFound());
    mockMvc.perform(get("/images/logo.png")).andExpect(status().isNotFound());
    mockMvc.perform(get("/favicon.ico")).andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("Should allow access to API documentation endpoints")
  void shouldAllowAccessToApiDocumentationEndpoints() throws Exception {
    // These will return 404 since Swagger is disabled, but should not return 401
    mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isNotFound());
    mockMvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("Should return proper error format for unauthorized access")
  void shouldReturnProperErrorFormatForUnauthorizedAccess() throws Exception {
    mockMvc
        .perform(get("/api/protected-endpoint"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.timestamp").exists())
        .andExpect(jsonPath("$.status").value(401))
        .andExpect(jsonPath("$.error").value("Unauthorized"))
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.path").value("/api/protected-endpoint"))
        .andExpect(jsonPath("$.errorCode").value("AUTH_001"));
  }

  // Helper class to access MockMvcRequestBuilders.options
  private static class MockMvcRequestBuilders
      extends org.springframework.test.web.servlet.request.MockMvcRequestBuilders {
    // This class exists to provide access to the options method
  }
}
