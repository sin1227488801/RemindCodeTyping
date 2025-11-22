package com.rct.application.command;

import java.util.Objects;
import java.util.UUID;
import lombok.Data;

/** Command for updating a study book. */
@Data
public class UpdateStudyBookCommand {
  private final UUID userId;
  private final UUID studyBookId;
  private final String language;
  private final String question;
  private final String explanation;

  public UpdateStudyBookCommand(
      UUID userId, UUID studyBookId, String language, String question, String explanation) {
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.studyBookId = Objects.requireNonNull(studyBookId, "Study book ID cannot be null");
    this.language = Objects.requireNonNull(language, "Language cannot be null");
    this.question = Objects.requireNonNull(question, "Question cannot be null");
    this.explanation = explanation; // Can be null
  }
}
