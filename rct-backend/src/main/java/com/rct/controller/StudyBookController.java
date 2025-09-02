package com.rct.controller;

import com.rct.application.service.StudyBookApplicationService;
import com.rct.presentation.dto.request.CreateStudyBookRequest;
import com.rct.presentation.dto.request.GetStudyBooksRequest;
import com.rct.presentation.dto.request.UpdateStudyBookRequest;
import com.rct.presentation.dto.response.ErrorResponse;
import com.rct.presentation.dto.response.StudyBookResponse;
import com.rct.presentation.mapper.StudyBookDtoMapper;
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
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for study book operations. Handles HTTP concerns only and delegates business
 * logic to application services.
 */
@RestController
@RequestMapping("/api/studybooks")
@RequiredArgsConstructor
@Slf4j
@SecurityRequirement(name = "bearerAuth")
@Tag(
    name = "Study Books",
    description =
        "Study book management endpoints. Handles CRUD operations for coding questions and explanations used in typing practice.")
public class StudyBookController {

  private final StudyBookApplicationService studyBookService;
  private final StudyBookDtoMapper dtoMapper;

  @Operation(
      summary = "Get study books",
      description =
          "Retrieves a paginated list of study books for the authenticated user with optional filtering by language and search query.")
  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "200",
            description = "Study books retrieved successfully",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Page.class),
                    examples =
                        @ExampleObject(
                            name = "Study Books Page",
                            value =
                                """
                        {
                          "content": [
                            {
                              "id": "123e4567-e89b-12d3-a456-426614174000",
                              "language": "JavaScript",
                              "question": "console.log('Hello World');",
                              "explanation": "Basic console output in JavaScript",
                              "createdAt": "2024-01-01T12:00:00Z",
                              "updatedAt": "2024-01-01T12:00:00Z"
                            }
                          ],
                          "pageable": {
                            "pageNumber": 0,
                            "pageSize": 20
                          },
                          "totalElements": 1,
                          "totalPages": 1,
                          "first": true,
                          "last": true
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
            responseCode = "400",
            description = "Invalid request parameters",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @GetMapping
  public ResponseEntity<Page<StudyBookResponse>> getStudyBooks(
      @Parameter(
              description = "User ID",
              required = true,
              example = "123e4567-e89b-12d3-a456-426614174000")
          @RequestHeader("X-User-Id")
          UUID userId,
      @Parameter(description = "Filter by programming language", example = "JavaScript")
          @RequestParam(required = false)
          String language,
      @Parameter(description = "Search query for question content", example = "console.log")
          @RequestParam(required = false)
          String query,
      @Parameter(description = "Page number (0-based)", example = "0")
          @RequestParam(defaultValue = "0")
          int page,
      @Parameter(description = "Number of items per page", example = "20")
          @RequestParam(defaultValue = "20")
          int size) {

    log.info("Getting study books for user: {}, language: {}, query: {}", userId, language, query);

    var request = new GetStudyBooksRequest(userId, language, query, page, size);
    var command = dtoMapper.toGetStudyBooksCommand(request);
    var result = studyBookService.getStudyBooks(command);
    var response = dtoMapper.toStudyBookPageResponse(result);

    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "Create study book",
      description =
          "Creates a new study book with a coding question and explanation for typing practice.")
  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "201",
            description = "Study book created successfully",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = StudyBookResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Created Study Book",
                            value =
                                """
                        {
                          "id": "123e4567-e89b-12d3-a456-426614174000",
                          "language": "JavaScript",
                          "question": "console.log('Hello World');",
                          "explanation": "Basic console output in JavaScript",
                          "createdAt": "2024-01-01T12:00:00Z",
                          "updatedAt": "2024-01-01T12:00:00Z"
                        }
                        """))),
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
                          "message": "Question is required",
                          "timestamp": "2024-01-01T12:00:00Z",
                          "details": {
                            "field": "question",
                            "rejectedValue": ""
                          }
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
  @PostMapping
  public ResponseEntity<StudyBookResponse> createStudyBook(
      @Parameter(
              description = "User ID",
              required = true,
              example = "123e4567-e89b-12d3-a456-426614174000")
          @RequestHeader("X-User-Id")
          UUID userId,
      @Parameter(
              description = "Study book creation details",
              required = true,
              schema = @Schema(implementation = CreateStudyBookRequest.class))
          @Valid
          @RequestBody
          CreateStudyBookRequest request) {

    log.info("Creating study book for user: {}, language: {}", userId, request.getLanguage());

    var command = dtoMapper.toCreateStudyBookCommand(userId, request);
    var result = studyBookService.createStudyBook(command);
    var response = dtoMapper.toStudyBookResponse(result);

    log.info("Study book created with ID: {}", result.getId());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PutMapping("/{id}")
  public ResponseEntity<StudyBookResponse> updateStudyBook(
      @Parameter(description = "User ID") @RequestHeader("X-User-Id") UUID userId,
      @Parameter(description = "Study book ID") @PathVariable UUID id,
      @Valid @RequestBody UpdateStudyBookRequest request) {

    log.info("Updating study book: {} for user: {}", id, userId);

    var command = dtoMapper.toUpdateStudyBookCommand(userId, id, request);
    var result = studyBookService.updateStudyBook(command);
    var response = dtoMapper.toStudyBookResponse(result);

    log.info("Study book updated: {}", id);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteStudyBook(
      @Parameter(description = "User ID") @RequestHeader("X-User-Id") UUID userId,
      @Parameter(description = "Study book ID") @PathVariable UUID id) {

    log.info("Deleting study book: {} for user: {}", id, userId);

    var command = dtoMapper.toDeleteStudyBookCommand(userId, id);
    studyBookService.deleteStudyBook(command);

    log.info("Study book deleted: {}", id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/random")
  public ResponseEntity<List<StudyBookResponse>> getRandomStudyBooks(
      @Parameter(description = "User ID") @RequestHeader("X-User-Id") UUID userId,
      @Parameter(description = "Language filter") @RequestParam(required = false) String language,
      @Parameter(description = "Number of items") @RequestParam(defaultValue = "10") int limit) {

    log.info(
        "Getting random study books for user: {}, language: {}, limit: {}",
        userId,
        language,
        limit);

    var command = dtoMapper.toGetRandomStudyBooksCommand(userId, language, limit);
    var result = studyBookService.getRandomStudyBooks(command);
    var response = dtoMapper.toStudyBookListResponse(result);

    return ResponseEntity.ok(response);
  }

  @GetMapping("/languages")
  public ResponseEntity<List<String>> getAllLanguages(
      @Parameter(description = "User ID") @RequestHeader("X-User-Id") UUID userId) {

    log.info("Getting all languages for user: {}", userId);

    var command = dtoMapper.toGetLanguagesCommand(userId);
    var languages = studyBookService.getAllLanguages(command);

    return ResponseEntity.ok(languages);
  }
}
