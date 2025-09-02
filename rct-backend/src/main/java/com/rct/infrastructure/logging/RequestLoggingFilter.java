package com.rct.infrastructure.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Filter that logs HTTP requests and responses with correlation IDs for tracing. */
@Component
@Order(1)
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

  private static final String TRACE_ID_HEADER = "X-Trace-ID";
  private static final String TRACE_ID_MDC_KEY = "traceId";

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String traceId = getOrGenerateTraceId(request);

    try {
      // Set trace ID in MDC for logging
      MDC.put(TRACE_ID_MDC_KEY, traceId);

      // Add trace ID to response header
      response.setHeader(TRACE_ID_HEADER, traceId);

      // Log request
      logRequest(request, traceId);

      long startTime = System.currentTimeMillis();

      // Process request
      filterChain.doFilter(request, response);

      // Log response
      long duration = System.currentTimeMillis() - startTime;
      logResponse(request, response, traceId, duration);

    } finally {
      // Clean up MDC
      MDC.remove(TRACE_ID_MDC_KEY);
    }
  }

  private String getOrGenerateTraceId(HttpServletRequest request) {
    String traceId = request.getHeader(TRACE_ID_HEADER);
    if (traceId == null || traceId.trim().isEmpty()) {
      traceId = UUID.randomUUID().toString().substring(0, 8);
    }
    return traceId;
  }

  private void logRequest(HttpServletRequest request, String traceId) {
    if (shouldLogRequest(request)) {
      log.info(
          "HTTP Request [{}] {} {} from {}",
          traceId,
          request.getMethod(),
          request.getRequestURI(),
          getClientIpAddress(request));

      // Log headers in debug mode
      if (log.isDebugEnabled()) {
        request
            .getHeaderNames()
            .asIterator()
            .forEachRemaining(
                headerName -> {
                  if (!isSensitiveHeader(headerName)) {
                    log.debug(
                        "Request Header [{}]: {} = {}",
                        traceId,
                        headerName,
                        request.getHeader(headerName));
                  }
                });
      }
    }
  }

  private void logResponse(
      HttpServletRequest request, HttpServletResponse response, String traceId, long duration) {
    if (shouldLogRequest(request)) {
      log.info(
          "HTTP Response [{}] {} {} - Status: {} - Duration: {}ms",
          traceId,
          request.getMethod(),
          request.getRequestURI(),
          response.getStatus(),
          duration);
    }
  }

  private boolean shouldLogRequest(HttpServletRequest request) {
    String uri = request.getRequestURI();

    // Skip logging for health checks and static resources
    return !uri.startsWith("/actuator/health")
        && !uri.startsWith("/static/")
        && !uri.startsWith("/css/")
        && !uri.startsWith("/js/")
        && !uri.startsWith("/images/");
  }

  private boolean isSensitiveHeader(String headerName) {
    String lowerCaseName = headerName.toLowerCase();
    return lowerCaseName.contains("authorization")
        || lowerCaseName.contains("cookie")
        || lowerCaseName.contains("password")
        || lowerCaseName.contains("token");
  }

  private String getClientIpAddress(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
    }

    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
      return xRealIp;
    }

    return request.getRemoteAddr();
  }
}
