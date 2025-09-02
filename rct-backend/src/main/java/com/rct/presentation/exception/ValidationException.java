package com.rct.presentation.exception;

import java.util.Map;

/** Exception thrown when validation fails. */
public class ValidationException extends RctException {

  private final Map<String, String> fieldErrors;

  public ValidationException(String message, Map<String, String> fieldErrors) {
    super(ErrorCode.VAL_001, message, "The provided data is invalid");
    this.fieldErrors = fieldErrors;
  }

  public ValidationException(String message, String userMessage) {
    super(ErrorCode.VAL_001, message, userMessage);
    this.fieldErrors = Map.of();
  }

  public ValidationException(ErrorCode errorCode, String message, String userMessage) {
    super(errorCode, message, userMessage);
    this.fieldErrors = Map.of();
  }

  public Map<String, String> getFieldErrors() {
    return fieldErrors;
  }

  public static ValidationException requiredField(String fieldName) {
    return new ValidationException(
        ErrorCode.VAL_002,
        "Required field missing: " + fieldName,
        "The field '" + fieldName + "' is required");
  }

  public static ValidationException invalidFormat(String fieldName, String expectedFormat) {
    return new ValidationException(
        ErrorCode.VAL_003,
        "Invalid format for field: " + fieldName + ", expected: " + expectedFormat,
        "The field '" + fieldName + "' has an invalid format");
  }

  public static ValidationException valueOutOfRange(String fieldName, String range) {
    return new ValidationException(
        ErrorCode.VAL_004,
        "Value out of range for field: " + fieldName + ", expected range: " + range,
        "The field '" + fieldName + "' value is out of the allowed range");
  }
}
