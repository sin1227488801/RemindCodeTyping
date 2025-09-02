package com.rct.application.command;

import java.util.Objects;
import java.util.UUID;
import lombok.Data;

/** Command for getting typing statistics. */
@Data
public class GetTypingStatisticsCommand {
  private final UUID userId;

  public GetTypingStatisticsCommand(UUID userId) {
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
  }
}
