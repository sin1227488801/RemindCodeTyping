package com.rct.presentation.exception;

/** Exception thrown when business logic rules are violated. */
public class BusinessException extends RctException {

  public BusinessException(ErrorCode errorCode, String message, String userMessage) {
    super(errorCode, message, userMessage);
  }

  public BusinessException(
      ErrorCode errorCode, String message, String userMessage, Throwable cause) {
    super(errorCode, message, userMessage, cause);
  }

  public static BusinessException studyBookNotFound(String studyBookId) {
    return new BusinessException(
        ErrorCode.BIZ_001,
        "Study book not found with ID: " + studyBookId,
        "The requested study book could not be found");
  }

  public static BusinessException studyBookAccessDenied(String studyBookId, String userId) {
    return new BusinessException(
        ErrorCode.BIZ_002,
        "User " + userId + " does not have access to study book " + studyBookId,
        "You do not have permission to access this study book");
  }

  public static BusinessException cannotModifySystemProblem() {
    return new BusinessException(
        ErrorCode.BIZ_003,
        "Cannot modify system-provided problems",
        "System problems cannot be modified");
  }

  public static BusinessException typingSessionNotFound(String sessionId) {
    return new BusinessException(
        ErrorCode.BIZ_004,
        "Typing session not found with ID: " + sessionId,
        "The requested typing session could not be found");
  }

  public static BusinessException invalidTypingSessionState(String sessionId, String currentState) {
    return new BusinessException(
        ErrorCode.BIZ_005,
        "Invalid typing session state: " + currentState + " for session: " + sessionId,
        "The typing session is in an invalid state for this operation");
  }
}
