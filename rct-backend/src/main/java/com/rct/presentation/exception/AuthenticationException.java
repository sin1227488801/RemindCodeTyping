package com.rct.presentation.exception;

/** Exception thrown when authentication fails. */
public class AuthenticationException extends RctException {

  public AuthenticationException(String message) {
    super(ErrorCode.AUTH_001, message, "Invalid login credentials provided");
  }

  public AuthenticationException(String message, Throwable cause) {
    super(ErrorCode.AUTH_001, message, "Invalid login credentials provided", cause);
  }

  public static AuthenticationException userNotFound(String loginId) {
    return new AuthenticationException("User not found with login ID: " + loginId);
  }

  public static AuthenticationException invalidPassword() {
    return new AuthenticationException("Invalid password provided");
  }

  public static AuthenticationException userAlreadyExists(String loginId) {
    var exception = new AuthenticationException("User already exists with login ID: " + loginId);
    return new AuthenticationException(
        ErrorCode.AUTH_003,
        exception.getMessage(),
        "A user with this login ID already exists",
        exception.getCause());
  }

  private AuthenticationException(
      ErrorCode errorCode, String message, String userMessage, Throwable cause) {
    super(errorCode, message, userMessage, cause);
  }
}
