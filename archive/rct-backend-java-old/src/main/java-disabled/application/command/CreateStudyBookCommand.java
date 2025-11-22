package com.rct.application.command;

import java.util.Objects;
import java.util.UUID;
import lombok.Data;

/** Command for creating a study book. */
@Data
public class CreateStudyBookCommand {
  private final UUID userId;
  private final String language;
  private final String question;
  private final String explanation;

  public CreateStudyBookCommand(UUID userId, String language, String question, String explanation) {
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.language = Objects.requireNonNull(language, "Language cannot be null");
    this.question = Objects.requireNonNull(question, "Question cannot be null");
    this.explanation = explanation; // Can be null
  }
}
