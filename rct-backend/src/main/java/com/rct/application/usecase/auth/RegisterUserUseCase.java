package com.rct.application.usecase.auth;

import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.PasswordHash;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import com.rct.domain.model.user.UserRepository;
import com.rct.service.PasswordService;
import java.time.LocalDate;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case for registering a new user. Handles the business logic for user registration including
 * validation, password hashing, and initial user creation.
 *
 * <p>This use case follows the Single Responsibility Principle by focusing solely on user
 * registration logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RegisterUserUseCase {

  private final UserRepository userRepository;
  private final PasswordService passwordService;

  /**
   * Registers a new user with the provided information.
   *
   * @param command the registration command containing user information
   * @return the registration result
   * @throws IllegalArgumentException if command is null
   * @throws UserRegistrationException if registration fails
   */
  @Transactional
  public RegistrationResult execute(RegistrationCommand command) {
    Objects.requireNonNull(command, "Registration command cannot be null");

    log.debug("Attempting to register user: {}", command.getLoginId());

    LoginId loginId = LoginId.of(command.getLoginId());

    // Check if user already exists
    if (userRepository.existsByLoginId(loginId)) {
      log.warn("Registration failed: User already exists with loginId: {}", loginId);
      throw new UserRegistrationException("A user with this login ID already exists");
    }

    // Create new user
    UserId userId = UserId.generate();
    PasswordHash passwordHash = PasswordHash.of(passwordService.encode(command.getPassword()));
    User newUser = User.create(userId, loginId, passwordHash);

    // Record initial login
    newUser.recordLogin(LocalDate.now());

    User savedUser = userRepository.save(newUser);

    log.info("User registered successfully: {}", loginId);

    return RegistrationResult.success(savedUser);
  }

  /** Command object for registration request. */
  public static class RegistrationCommand {
    private final String loginId;
    private final String password;

    public RegistrationCommand(String loginId, String password) {
      this.loginId = Objects.requireNonNull(loginId, "Login ID cannot be null");
      this.password = Objects.requireNonNull(password, "Password cannot be null");
      validateInput();
    }

    private void validateInput() {
      if (loginId.trim().isEmpty()) {
        throw new IllegalArgumentException("Login ID cannot be empty");
      }
      if (password.trim().isEmpty()) {
        throw new IllegalArgumentException("Password cannot be empty");
      }
      if (loginId.length() < 4 || loginId.length() > 50) {
        throw new IllegalArgumentException("Login ID must be between 4 and 50 characters");
      }
      if (password.length() < 8 || password.length() > 100) {
        throw new IllegalArgumentException("Password must be between 8 and 100 characters");
      }
    }

    public String getLoginId() {
      return loginId;
    }

    public String getPassword() {
      return password;
    }
  }

  /** Result object for registration response. */
  public static class RegistrationResult {
    private final boolean success;
    private final User user;
    private final String errorMessage;

    private RegistrationResult(boolean success, User user, String errorMessage) {
      this.success = success;
      this.user = user;
      this.errorMessage = errorMessage;
    }

    public static RegistrationResult success(User user) {
      return new RegistrationResult(true, user, null);
    }

    public static RegistrationResult failure(String errorMessage) {
      return new RegistrationResult(false, null, errorMessage);
    }

    public boolean isSuccess() {
      return success;
    }

    public User getUser() {
      return user;
    }

    public String getErrorMessage() {
      return errorMessage;
    }
  }

  /** Exception thrown when user registration fails. */
  public static class UserRegistrationException extends RuntimeException {
    public UserRegistrationException(String message) {
      super(message);
    }
  }
}
