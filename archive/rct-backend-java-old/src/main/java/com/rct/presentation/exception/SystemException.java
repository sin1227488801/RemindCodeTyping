package com.rct.presentation.exception;

/** Exception thrown when system-level errors occur. */
public class SystemException extends RctException {

  public SystemException(ErrorCode errorCode, String message, String userMessage) {
    super(errorCode, message, userMessage);
  }

  public SystemException(ErrorCode errorCode, String message, String userMessage, Throwable cause) {
    super(errorCode, message, userMessage, cause);
  }

  public static SystemException internalError(String message) {
    return new SystemException(
        ErrorCode.SYS_001, message, "An internal server error occurred. Please try again later.");
  }

  public static SystemException internalError(String message, Throwable cause) {
    return new SystemException(
        ErrorCode.SYS_001,
        message,
        "An internal server error occurred. Please try again later.",
        cause);
  }

  public static SystemException databaseError(String message, Throwable cause) {
    return new SystemException(
        ErrorCode.SYS_002,
        "Database error: " + message,
        "A database error occurred. Please try again later.",
        cause);
  }

  public static SystemException externalServiceError(String serviceName, Throwable cause) {
    return new SystemException(
        ErrorCode.SYS_003,
        "External service error: " + serviceName,
        "An external service is currently unavailable. Please try again later.",
        cause);
  }

  public static SystemException configurationError(String message) {
    return new SystemException(
        ErrorCode.SYS_004,
        "Configuration error: " + message,
        "A system configuration error occurred. Please contact support.");
  }
}
