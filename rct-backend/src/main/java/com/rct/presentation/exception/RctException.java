package com.rct.presentation.exception;

/**
 * Base exception class for all RCT application exceptions. Provides a common structure for error
 * handling with error codes and user-friendly messages.
 */
public abstract class RctException extends RuntimeException {

  private final ErrorCode errorCode;
  private final String userMessage;

  protected RctException(ErrorCode errorCode, String message, String userMessage) {
    super(message);
    this.errorCode = errorCode;
    this.userMessage = userMessage;
  }

  protected RctException(ErrorCode errorCode, String message, String userMessage, Throwable cause) {
    super(message, cause);
    this.errorCode = errorCode;
    this.userMessage = userMessage;
  }

  public ErrorCode getErrorCode() {
    return errorCode;
  }

  public String getUserMessage() {
    return userMessage;
  }

  public int getHttpStatus() {
    return errorCode.getHttpStatus();
  }
}
