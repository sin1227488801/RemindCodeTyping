package com.rct.application.command;

import java.util.Objects;
import lombok.Data;

/** Command for user registration requests. */
@Data
public class RegisterUserCommand {
  private final String loginId;
  private final String password;

  public RegisterUserCommand(String loginId, String password) {
    this.loginId = Objects.requireNonNull(loginId, "Login ID cannot be null");
    this.password = Objects.requireNonNull(password, "Password cannot be null");
  }
}
