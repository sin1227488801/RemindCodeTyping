package com.rct.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StudyBookResponse {
  private UUID id;
  private String language;
  private String question;
  private String explanation;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
