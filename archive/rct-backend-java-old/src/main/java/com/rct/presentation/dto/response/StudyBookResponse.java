package com.rct.presentation.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for study book operations. */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudyBookResponse {

  private UUID id;

  private String language;

  @Schema(description = "Code question or problem", example = "console.log('Hello World');")
  private String question;

  private String explanation;

  private LocalDateTime createdAt;

  private LocalDateTime updatedAt;
}
