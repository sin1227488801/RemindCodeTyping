package com.rct.infrastructure.monitoring;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Filter to add correlation IDs to all requests for distributed tracing. This enables tracking
 * requests across multiple services and log aggregation.
 */
@Component
@Order(1)
public class CorrelationIdFilter implements Filter {

  public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
  public static final String CORRELATION_ID_MDC_KEY = "correlationId";
  public static final String REQUEST_ID_MDC_KEY = "requestId";
  public static final String USER_ID_MDC_KEY = "userId";
  public static final String SESSION_ID_MDC_KEY = "sessionId";

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {

    HttpServletRequest httpRequest = (HttpServletRequest) request;
    HttpServletResponse httpResponse = (HttpServletResponse) response;

    try {
      // Generate or extract correlation ID
      String correlationId = extractOrGenerateCorrelationId(httpRequest);

      // Generate unique request ID
      String requestId = UUID.randomUUID().toString();

      // Extract user information if available
      String userId = extractUserId(httpRequest);
      String sessionId = extractSessionId(httpRequest);

      // Add to MDC for logging
      MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
      MDC.put(REQUEST_ID_MDC_KEY, requestId);

      if (userId != null) {
        MDC.put(USER_ID_MDC_KEY, userId);
      }

      if (sessionId != null) {
        MDC.put(SESSION_ID_MDC_KEY, sessionId);
      }

      // Add correlation ID to response headers
      httpResponse.setHeader(CORRELATION_ID_HEADER, correlationId);
      httpResponse.setHeader("X-Request-ID", requestId);

      // Continue with the request
      chain.doFilter(request, response);

    } finally {
      // Clean up MDC to prevent memory leaks
      MDC.clear();
    }
  }

  /** Extract correlation ID from request headers or generate a new one */
  private String extractOrGenerateCorrelationId(HttpServletRequest request) {
    String correlationId = request.getHeader(CORRELATION_ID_HEADER);

    if (correlationId == null || correlationId.trim().isEmpty()) {
      correlationId = UUID.randomUUID().toString();
    }

    return correlationId;
  }

  /** Extract user ID from request headers or JWT token */
  private String extractUserId(HttpServletRequest request) {
    // Try to get from custom header first
    String userId = request.getHeader("X-User-ID");

    if (userId == null) {
      // Try to extract from JWT token in Authorization header
      String authHeader = request.getHeader("Authorization");
      if (authHeader != null && authHeader.startsWith("Bearer ")) {
        // In a real implementation, you would decode the JWT token here
        // For now, we'll just return null and let the security layer handle it
        return null;
      }
    }

    return userId;
  }

  /** Extract session ID from request */
  private String extractSessionId(HttpServletRequest request) {
    // Try to get session ID from various sources
    String sessionId = request.getHeader("X-Session-ID");

    if (sessionId == null && request.getSession(false) != null) {
      sessionId = request.getSession().getId();
    }

    return sessionId;
  }
}
