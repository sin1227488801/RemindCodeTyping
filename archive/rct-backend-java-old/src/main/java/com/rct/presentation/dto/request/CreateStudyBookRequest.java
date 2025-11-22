package com.rct.presentation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Request DTO for creating a study book. */
@Data
public class CreateStudyBookRequest {

  @NotBlank(message = "Language is required")
  @Size(max = 20, message = "Language must not exceed 20 characters")
  private String language;

  @NotBlank(message = "Question is required")
  @Size(max = 5000, message = "Question must not exceed 5000 characters")
  @Schema(description = "Code question or problem", example = "console.log('Hello World');")
  private String question;

  @Size(max = 5000, message = "Explanation must not exceed 5000 characters")
  private String explanation;
}
