package com.rct.application.command;

import java.util.Objects;
import lombok.Data;

/** Command for user authentication requests. */
@Data
public class AuthenticateUserCommand {
  private final String loginId;
  private final String password;

  public AuthenticateUserCommand(String loginId, String password) {
    this.loginId = Objects.requireNonNull(loginId, "Login ID cannot be null");
    this.password = Objects.requireNonNull(password, "Password cannot be null");
  }
}
