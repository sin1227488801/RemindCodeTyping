package com.rct.infrastructure.security;

import com.rct.presentation.validation.SecurityValidator;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Enumeration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Security filter that validates all incoming request parameters and headers for potential security
 * threats before they reach the application.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Execute before other filters
public class SecurityValidationFilter extends OncePerRequestFilter {

  private final SecurityValidator securityValidator;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    try {
      // Validate request parameters
      if (!validateRequestParameters(request)) {
        log.warn(
            "Malicious request detected from IP: {} to URL: {}",
            getClientIpAddress(request),
            request.getRequestURL());
        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.getWriter().write("{\"error\":\"Invalid request parameters\"}");
        return;
      }

      // Validate headers
      if (!validateHeaders(request)) {
        log.warn(
            "Malicious headers detected from IP: {} to URL: {}",
            getClientIpAddress(request),
            request.getRequestURL());
        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.getWriter().write("{\"error\":\"Invalid request headers\"}");
        return;
      }

      // Validate URL path
      if (!validateUrlPath(request)) {
        log.warn(
            "Malicious URL path detected from IP: {} to URL: {}",
            getClientIpAddress(request),
            request.getRequestURL());
        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.getWriter().write("{\"error\":\"Invalid URL path\"}");
        return;
      }

    } catch (Exception e) {
      log.error("Error in security validation filter", e);
      response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
      response.getWriter().write("{\"error\":\"Security validation error\"}");
      return;
    }

    filterChain.doFilter(request, response);
  }

  /** Validates all request parameters for security threats. */
  private boolean validateRequestParameters(HttpServletRequest request) {
    Enumeration<String> parameterNames = request.getParameterNames();

    while (parameterNames.hasMoreElements()) {
      String paramName = parameterNames.nextElement();
      String[] paramValues = request.getParameterValues(paramName);

      // Validate parameter name
      if (!securityValidator.isSafeInput(paramName)) {
        log.warn("Unsafe parameter name detected: {}", sanitizeForLogging(paramName));
        return false;
      }

      // Validate parameter values
      if (paramValues != null) {
        for (String paramValue : paramValues) {
          if (paramValue != null && !securityValidator.isSafeInput(paramValue)) {
            log.warn(
                "Unsafe parameter value detected for {}: {}",
                paramName,
                sanitizeForLogging(paramValue));
            return false;
          }
        }
      }
    }

    return true;
  }

  /** Validates request headers for security threats. */
  private boolean validateHeaders(HttpServletRequest request) {
    Enumeration<String> headerNames = request.getHeaderNames();

    while (headerNames.hasMoreElements()) {
      String headerName = headerNames.nextElement();
      String headerValue = request.getHeader(headerName);

      // Skip authorization header (it's expected to have special characters)
      if ("Authorization".equalsIgnoreCase(headerName)) {
        continue;
      }

      // Validate header name
      if (!isValidHeaderName(headerName)) {
        log.warn("Invalid header name detected: {}", sanitizeForLogging(headerName));
        return false;
      }

      // Validate header value
      if (headerValue != null && !isValidHeaderValue(headerValue)) {
        log.warn(
            "Invalid header value detected for {}: {}",
            headerName,
            sanitizeForLogging(headerValue));
        return false;
      }
    }

    return true;
  }

  /** Validates URL path for security threats. */
  private boolean validateUrlPath(HttpServletRequest request) {
    String requestURI = request.getRequestURI();

    if (requestURI == null) {
      return true;
    }

    // Check for path traversal
    if (securityValidator.containsPathTraversal(requestURI)) {
      log.warn("Path traversal detected in URL: {}", sanitizeForLogging(requestURI));
      return false;
    }

    // Check for other injection attempts
    if (securityValidator.containsSqlInjection(requestURI)
        || securityValidator.containsXss(requestURI)
        || securityValidator.containsCommandInjection(requestURI)) {
      log.warn("Injection attempt detected in URL: {}", sanitizeForLogging(requestURI));
      return false;
    }

    return true;
  }

  /** Validates header name format. */
  private boolean isValidHeaderName(String headerName) {
    if (headerName == null || headerName.trim().isEmpty()) {
      return false;
    }

    // Header names should only contain ASCII letters, digits, and hyphens
    return headerName.matches("^[a-zA-Z0-9\\-]+$") && headerName.length() <= 100;
  }

  /** Validates header value format. */
  private boolean isValidHeaderValue(String headerValue) {
    if (headerValue == null) {
      return true;
    }

    // Check length
    if (headerValue.length() > 8192) { // Common header value limit
      return false;
    }

    // Check for basic injection patterns (less strict than parameter validation)
    return !securityValidator.containsSqlInjection(headerValue)
        && !securityValidator.containsXss(headerValue);
  }

  /** Gets the client IP address, considering proxy headers. */
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

  /** Sanitizes input for safe logging. */
  private String sanitizeForLogging(String input) {
    if (input == null) {
      return "null";
    }

    // Truncate and remove line breaks to prevent log injection
    String sanitized = input.length() > 100 ? input.substring(0, 100) + "..." : input;
    return sanitized.replaceAll("[\r\n\t]", "_");
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();

    // Skip validation for health check and static resources
    return path.startsWith("/actuator/health")
        || path.startsWith("/css/")
        || path.startsWith("/js/")
        || path.startsWith("/images/")
        || path.equals("/favicon.ico");
  }
}
