package com.rct.application.command;

import java.util.Objects;
import java.util.UUID;
import lombok.Data;

/** Command for getting random study books. */
@Data
public class GetRandomStudyBooksCommand {
  private final UUID userId;
  private final String language;
  private final int limit;

  public GetRandomStudyBooksCommand(UUID userId, String language, int limit) {
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.language = language; // Can be null for no filter
    this.limit = Math.max(1, limit);
  }
}
