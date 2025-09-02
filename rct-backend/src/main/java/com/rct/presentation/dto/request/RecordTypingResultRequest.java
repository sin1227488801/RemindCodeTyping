package com.rct.presentation.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;

/** Request DTO for recording typing results. */
@Data
public class RecordTypingResultRequest {

  @NotNull(message = "Study book ID is required")
  private UUID studyBookId;

  @NotNull(message = "Start time is required")
  private LocalDateTime startedAt;

  @NotNull(message = "Duration is required")
  @Min(value = 1, message = "Duration must be at least 1 millisecond")
  private Long durationMs;

  @NotNull(message = "Total characters is required")
  @Min(value = 0, message = "Total characters must be non-negative")
  private Integer totalChars;

  @NotNull(message = "Correct characters is required")
  @Min(value = 0, message = "Correct characters must be non-negative")
  private Integer correctChars;
}
