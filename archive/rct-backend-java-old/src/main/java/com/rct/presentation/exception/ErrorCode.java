package com.rct.presentation.exception;

/**
 * Enumeration of error codes used throughout the application. Each error code has an associated
 * HTTP status code and category.
 */
public enum ErrorCode {

  // Authentication errors (AUTH_xxx)
  AUTH_001("AUTH_001", "Invalid credentials", 401),
  AUTH_002("AUTH_002", "User not found", 404),
  AUTH_003("AUTH_003", "User already exists", 409),
  AUTH_004("AUTH_004", "Authentication required", 401),
  AUTH_005("AUTH_005", "Access denied", 403),
  AUTH_006("AUTH_006", "Invalid refresh token", 401),
  AUTH_007("AUTH_007", "Refresh token expired", 401),
  AUTH_008("AUTH_008", "Token revoked", 401),

  // Convenience aliases for common errors
  INVALID_CREDENTIALS("AUTH_001", "Invalid credentials", 401),
  USER_NOT_FOUND("AUTH_002", "User not found", 404),
  INVALID_REFRESH_TOKEN("AUTH_006", "Invalid refresh token", 401),
  REFRESH_TOKEN_EXPIRED("AUTH_007", "Refresh token expired", 401),

  // Validation errors (VAL_xxx)
  VAL_001("VAL_001", "Invalid input data", 400),
  VAL_002("VAL_002", "Required field missing", 400),
  VAL_003("VAL_003", "Invalid format", 400),
  VAL_004("VAL_004", "Value out of range", 400),

  // Business logic errors (BIZ_xxx)
  BIZ_001("BIZ_001", "Study book not found", 404),
  BIZ_002("BIZ_002", "Study book access denied", 403),
  BIZ_003("BIZ_003", "Cannot modify system problem", 400),
  BIZ_004("BIZ_004", "Typing session not found", 404),
  BIZ_005("BIZ_005", "Invalid typing session state", 400),

  // System errors (SYS_xxx)
  SYS_001("SYS_001", "Internal server error", 500),
  SYS_002("SYS_002", "Database error", 500),
  SYS_003("SYS_003", "External service error", 502),
  SYS_004("SYS_004", "Configuration error", 500);

  private final String code;
  private final String description;
  private final int httpStatus;

  ErrorCode(String code, String description, int httpStatus) {
    this.code = code;
    this.description = description;
    this.httpStatus = httpStatus;
  }

  public String getCode() {
    return code;
  }

  public String getDescription() {
    return description;
  }

  public int getHttpStatus() {
    return httpStatus;
  }
}
