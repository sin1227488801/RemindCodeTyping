package com.rct.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * JWT Authentication Entry Point that handles authentication failures. Returns a JSON error
 * response when authentication is required but not provided or invalid.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {

    log.warn(
        "Unauthorized access attempt to {} from {}",
        request.getRequestURI(),
        request.getRemoteAddr());

    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

    Map<String, Object> errorResponse = createErrorResponse(request, authException);

    objectMapper.writeValue(response.getOutputStream(), errorResponse);
  }

  /**
   * Creates a standardized error response for authentication failures.
   *
   * @param request the HTTP request that failed authentication
   * @param authException the authentication exception that occurred
   * @return a map containing error details
   */
  private Map<String, Object> createErrorResponse(
      HttpServletRequest request, AuthenticationException authException) {

    Map<String, Object> errorResponse = new HashMap<>();
    errorResponse.put("timestamp", LocalDateTime.now().toString());
    errorResponse.put("status", HttpServletResponse.SC_UNAUTHORIZED);
    errorResponse.put("error", "Unauthorized");
    errorResponse.put("message", "Authentication required to access this resource");
    errorResponse.put("path", request.getRequestURI());
    errorResponse.put("errorCode", "AUTH_001");

    // Add additional context for debugging (only in development)
    if (isDevelopmentMode()) {
      errorResponse.put("details", authException.getMessage());
      errorResponse.put("method", request.getMethod());
    }

    return errorResponse;
  }

  /**
   * Checks if the application is running in development mode. In production, this should return
   * false to avoid exposing sensitive information.
   *
   * @return true if in development mode, false otherwise
   */
  private boolean isDevelopmentMode() {
    // This could be configured via application properties
    String profile = System.getProperty("spring.profiles.active", "");
    return profile.contains("dev") || profile.contains("local");
  }
}
