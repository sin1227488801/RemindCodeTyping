package com.rct.exception;

import com.rct.presentation.dto.response.ErrorResponse;
import com.rct.presentation.exception.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

/**
 * Global exception handler that provides consistent error responses across the application. Handles
 * both application-specific exceptions and common Spring framework exceptions.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  /** Handles custom RCT application exceptions. */
  @ExceptionHandler(RctException.class)
  public ResponseEntity<ErrorResponse> handleRctException(
      RctException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("RCT Exception [{}]: {} - {}", traceId, e.getErrorCode().getCode(), e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            e.getErrorCode().getCode(),
            e.getMessage(),
            e.getUserMessage(),
            e.getHttpStatus(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.status(e.getHttpStatus()).body(response);
  }

  /** Handles validation exceptions from @Valid annotations. */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidationException(
      MethodArgumentNotValidException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Validation Exception [{}]: {}", traceId, e.getMessage());

    Map<String, String> fieldErrors = new HashMap<>();
    for (FieldError error : e.getBindingResult().getFieldErrors()) {
      fieldErrors.put(error.getField(), error.getDefaultMessage());
    }

    ErrorResponse response =
        ErrorResponse.withFieldErrors(
            ErrorCode.VAL_001.getCode(),
            "Validation failed for request",
            "The provided data contains validation errors",
            HttpStatus.BAD_REQUEST.value(),
            fieldErrors);
    response.setPath(request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.badRequest().body(response);
  }

  /** Handles Spring Security authentication exceptions. */
  @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
  public ResponseEntity<ErrorResponse> handleAuthenticationException(
      Exception e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Authentication Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.AUTH_001.getCode(),
            e.getMessage(),
            "Authentication failed",
            HttpStatus.UNAUTHORIZED.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
  }

  /** Handles Spring Security access denied exceptions. */
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDeniedException(
      AccessDeniedException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Access Denied Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.AUTH_005.getCode(),
            e.getMessage(),
            "Access denied",
            HttpStatus.FORBIDDEN.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
  }

  /** Handles database access exceptions. */
  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<ErrorResponse> handleDataAccessException(
      DataAccessException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.error("Database Exception [{}]: {}", traceId, e.getMessage(), e);

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.SYS_002.getCode(),
            "Database operation failed",
            "A database error occurred. Please try again later.",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
  }

  /** Handles HTTP message not readable exceptions (malformed JSON, etc.). */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
      HttpMessageNotReadableException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("HTTP Message Not Readable Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.VAL_003.getCode(),
            "Malformed request body",
            "The request body is not valid JSON or has incorrect format",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.badRequest().body(response);
  }

  /** Handles missing request parameters. */
  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ErrorResponse> handleMissingParameterException(
      MissingServletRequestParameterException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Missing Parameter Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.VAL_002.getCode(),
            "Missing required parameter: " + e.getParameterName(),
            "A required parameter is missing from the request",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.badRequest().body(response);
  }

  /** Handles missing request headers. */
  @ExceptionHandler(MissingRequestHeaderException.class)
  public ResponseEntity<ErrorResponse> handleMissingHeaderException(
      MissingRequestHeaderException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Missing Header Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.VAL_002.getCode(),
            "Missing required header: " + e.getHeaderName(),
            "A required header is missing from the request",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.badRequest().body(response);
  }

  /** Handles method argument type mismatch exceptions. */
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> handleTypeMismatchException(
      MethodArgumentTypeMismatchException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Type Mismatch Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.VAL_003.getCode(),
            "Invalid parameter type for: " + e.getName(),
            "A parameter has an invalid type or format",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.badRequest().body(response);
  }

  /** Handles HTTP method not supported exceptions. */
  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ErrorResponse> handleMethodNotSupportedException(
      HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Method Not Supported Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.VAL_001.getCode(),
            "HTTP method not supported: " + e.getMethod(),
            "The HTTP method is not supported for this endpoint",
            HttpStatus.METHOD_NOT_ALLOWED.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
  }

  /** Handles 404 not found exceptions. */
  @ExceptionHandler(NoHandlerFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFoundException(
      NoHandlerFoundException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Not Found Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.BIZ_001.getCode(),
            "Endpoint not found: " + e.getRequestURL(),
            "The requested resource was not found",
            HttpStatus.NOT_FOUND.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
  }

  /** Handles IllegalArgumentException (legacy support). */
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
      IllegalArgumentException e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.warn("Illegal Argument Exception [{}]: {}", traceId, e.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.VAL_001.getCode(),
            e.getMessage(),
            "Invalid argument provided",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.badRequest().body(response);
  }

  /** Handles all other unexpected exceptions. */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGenericException(
      Exception e, HttpServletRequest request) {
    String traceId = generateTraceId();

    log.error("Unexpected Exception [{}]: {}", traceId, e.getMessage(), e);

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.SYS_001.getCode(),
            "An unexpected error occurred",
            "An internal server error occurred. Please try again later.",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI());
    response.setTraceId(traceId);

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
  }

  /** Generates a unique trace ID for error tracking. */
  private String generateTraceId() {
    return UUID.randomUUID().toString().substring(0, 8);
  }
}
