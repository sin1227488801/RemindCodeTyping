package com.rct.application.command;

import java.util.Objects;
import java.util.UUID;
import lombok.Data;

/** Command for deleting a study book. */
@Data
public class DeleteStudyBookCommand {
  private final UUID userId;
  private final UUID studyBookId;

  public DeleteStudyBookCommand(UUID userId, UUID studyBookId) {
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.studyBookId = Objects.requireNonNull(studyBookId, "Study book ID cannot be null");
  }
}
