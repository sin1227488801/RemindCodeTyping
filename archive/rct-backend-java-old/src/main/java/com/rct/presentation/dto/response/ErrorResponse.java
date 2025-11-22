package com.rct.presentation.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Standard error response DTO. */
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

  private String errorCode;

  private String message;

  private String userMessage;

  private int status;

  private LocalDateTime timestamp;

  private Map<String, String> fieldErrors;

  private String path;

  private String traceId;

  public static ErrorResponse of(String errorCode, String message, String userMessage, int status) {
    return new ErrorResponse(
        errorCode, message, userMessage, status, LocalDateTime.now(), null, null, null);
  }

  public static ErrorResponse of(
      String errorCode, String message, String userMessage, int status, String path) {
    return new ErrorResponse(
        errorCode, message, userMessage, status, LocalDateTime.now(), null, path, null);
  }

  public static ErrorResponse withFieldErrors(
      String errorCode,
      String message,
      String userMessage,
      int status,
      Map<String, String> fieldErrors) {
    return new ErrorResponse(
        errorCode, message, userMessage, status, LocalDateTime.now(), fieldErrors, null, null);
  }
}
