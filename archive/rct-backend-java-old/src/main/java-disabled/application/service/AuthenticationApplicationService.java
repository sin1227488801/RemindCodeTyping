package com.rct.application.service;

import com.rct.application.command.AuthenticateUserCommand;
import com.rct.application.command.RegisterUserCommand;
import com.rct.application.result.AuthenticationResult;
import com.rct.application.usecase.auth.AuthenticateUserUseCase;
import com.rct.application.usecase.auth.RegisterUserUseCase;
import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.security.JwtTokenService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Application service that coordinates authentication-related use cases. Provides a unified
 * interface for authentication operations and handles cross-cutting concerns.
 *
 * <p>This service acts as a facade for authentication use cases and can handle transaction
 * management, security, and other cross-cutting concerns.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationApplicationService {

  private final AuthenticateUserUseCase authenticateUserUseCase;
  private final RegisterUserUseCase registerUserUseCase;
  private final JwtTokenService jwtTokenService;

  /**
   * Authenticates a user with the provided credentials.
   *
   * @param command the authentication command
   * @return the authentication result with token
   */
  public AuthenticationResult authenticate(AuthenticateUserCommand command) {
    log.debug("Processing authentication request for user: {}", command.getLoginId());

    var useCaseCommand =
        new AuthenticateUserUseCase.AuthenticationCommand(
            command.getLoginId(), command.getPassword());

    User user = authenticateUserUseCase.execute(useCaseCommand);
    String token = jwtTokenService.generateToken(user);
    String refreshToken = jwtTokenService.generateRefreshToken(user);

    return AuthenticationResult.success(
        user.getId(), 
        user.getLoginId().getValue(), 
        user.getRole().getCode(),
        token,
        refreshToken);
  }

  /**
   * Registers a new user with the provided information.
   *
   * @param command the registration command
   * @return the authentication result with token
   */
  public AuthenticationResult register(RegisterUserCommand command) {
    log.debug("Processing registration request for user: {}", command.getLoginId());

    var useCaseCommand =
        new RegisterUserUseCase.RegistrationCommand(command.getLoginId(), command.getPassword());

    var registrationResult = registerUserUseCase.execute(useCaseCommand);
    
    if (!registrationResult.isSuccess()) {
      throw new RuntimeException(registrationResult.getErrorMessage());
    }
    
    User user = registrationResult.getUser();
    String token = jwtTokenService.generateToken(user);
    String refreshToken = jwtTokenService.generateRefreshToken(user);

    return AuthenticationResult.success(
        user.getId(), 
        user.getLoginId().getValue(), 
        user.getRole().getCode(),
        token,
        refreshToken);
  }

  /**
   * Creates a guest session for demo purposes.
   *
   * @return the authentication result for guest session
   */
  public AuthenticationResult createGuestSession() {
    log.debug("Creating guest session");

    // Create a temporary guest user ID and login
    UserId guestUserId = UserId.of(UUID.randomUUID());
    LoginId guestLoginId = LoginId.of("guest_" + System.currentTimeMillis());

    // Generate a token for the guest session
    String token = jwtTokenService.generateGuestToken(guestUserId, guestLoginId);

    return AuthenticationResult.guestSession(guestUserId, guestLoginId.getValue(), token);
  }
}
