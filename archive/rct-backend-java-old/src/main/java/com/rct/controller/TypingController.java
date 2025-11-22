package com.rct.controller;

import com.rct.application.service.TypingSessionApplicationService;
import com.rct.presentation.dto.request.RecordTypingResultRequest;
import com.rct.presentation.dto.response.ErrorResponse;
import com.rct.presentation.dto.response.TypingStatisticsResponse;
import com.rct.presentation.mapper.TypingSessionDtoMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for typing session operations. Handles HTTP concerns only and delegates business
 * logic to application services.
 */
@RestController
@RequestMapping("/api/typing")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(
    name = "Typing Sessions",
    description =
        "Typing practice session endpoints. Handles recording typing results and retrieving user statistics.")
public class TypingController {

  private final TypingSessionApplicationService typingSessionService;
  private final TypingSessionDtoMapper dtoMapper;

  @Operation(
      summary = "Record typing result",
      description =
          "Records the result of a typing practice session including accuracy, speed, and other metrics.")
  @ApiResponses(
      value = {
        @ApiResponse(responseCode = "201", description = "Typing result recorded successfully"),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Validation Error",
                            value =
                                """
                        {
                          "errorCode": "VALIDATION_ERROR",
                          "message": "Study book ID is required",
                          "timestamp": "2024-01-01T12:00:00Z",
                          "details": {
                            "field": "studyBookId",
                            "rejectedValue": null
                          }
                        }
                        """))),
        @ApiResponse(
            responseCode = "401",
            description = "Authentication required",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Study book not found",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @PostMapping("/results")
  public ResponseEntity<Void> recordTypingResult(
      @Parameter(
              description = "User ID",
              required = true,
              example = "123e4567-e89b-12d3-a456-426614174000")
          @RequestHeader("X-User-Id")
          UUID userId,
      @Parameter(
              description = "Typing session result data",
              required = true,
              schema = @Schema(implementation = RecordTypingResultRequest.class))
          @Valid
          @RequestBody
          RecordTypingResultRequest request) {

    log.info(
        "Recording typing result for user: {}, study book: {}", userId, request.getStudyBookId());

    var command = dtoMapper.toRecordTypingResultCommand(userId, request);
    typingSessionService.recordTypingResult(command);

    log.info("Typing result recorded successfully for user: {}", userId);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @Operation(
      summary = "Get typing statistics",
      description =
          "Retrieves comprehensive typing statistics for the authenticated user including accuracy, speed, and login streaks.")
  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TypingStatisticsResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Typing Statistics",
                            value =
                                """
                        {
                          "totalAttempts": 150,
                          "averageAccuracy": 87.5,
                          "bestAccuracy": 98.2,
                          "totalCharsTyped": 12500,
                          "totalTimeMs": 450000,
                          "currentLoginStreak": 7,
                          "maxLoginStreak": 15,
                          "totalLoginDays": 45
                        }
                        """))),
        @ApiResponse(
            responseCode = "401",
            description = "Authentication required",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @GetMapping("/statistics")
  public ResponseEntity<TypingStatisticsResponse> getTypingStatistics(
      @Parameter(
              description = "User ID",
              required = true,
              example = "123e4567-e89b-12d3-a456-426614174000")
          @RequestHeader("X-User-Id")
          UUID userId) {

    log.info("Getting typing statistics for user: {}", userId);

    var command = dtoMapper.toGetTypingStatisticsCommand(userId);
    var result = typingSessionService.getTypingStatistics(command);
    var response = dtoMapper.toTypingStatisticsResponse(result);

    return ResponseEntity.ok(response);
  }
}
