package com.rct.application.command;

import java.util.Objects;
import java.util.UUID;
import lombok.Data;

/** Command for getting available languages. */
@Data
public class GetLanguagesCommand {
  private final UUID userId;

  public GetLanguagesCommand(UUID userId) {
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
  }
}
