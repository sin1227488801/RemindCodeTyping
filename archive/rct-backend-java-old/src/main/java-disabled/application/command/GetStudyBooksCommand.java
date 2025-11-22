package com.rct.application.command;

import java.util.Objects;
import java.util.UUID;
import lombok.Data;

/** Command for getting study books with filters. */
@Data
public class GetStudyBooksCommand {
  private final UUID userId;
  private final String language;
  private final String query;
  private final int page;
  private final int size;

  public GetStudyBooksCommand(UUID userId, String language, String query, int page, int size) {
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.language = language; // Can be null for no filter
    this.query = query; // Can be null for no search
    this.page = Math.max(0, page);
    this.size = Math.max(1, size);
  }
}
