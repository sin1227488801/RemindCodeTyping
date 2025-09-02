package com.rct.presentation.dto.request;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;

/** Request DTO for getting study books with filters. */
@Data
@AllArgsConstructor
public class GetStudyBooksRequest {
  private UUID userId;
  private String language;
  private String query;
  private int page;
  private int size;
}
