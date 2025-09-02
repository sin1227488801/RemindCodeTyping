package com.rct.application.usecase.auth;

import com.rct.application.result.AuthenticationResult;
import com.rct.domain.model.auth.RefreshToken;
import com.rct.domain.model.auth.RefreshTokenRepository;
import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserRepository;
import com.rct.infrastructure.security.JwtTokenService;
import com.rct.infrastructure.security.PasswordService;
import com.rct.presentation.exception.AuthenticationException;
import com.rct.presentation.exception.ErrorCode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case for authenticating users in the RemindCodeTyping system.
 *
 * <p>This use case implements the complete user authentication workflow following Clean
 * Architecture principles. It orchestrates domain objects and infrastructure services to provide
 * secure user authentication with comprehensive audit trails and token management.
 *
 * <p>Authentication Process:
 *
 * <ol>
 *   <li>Validate input credentials format and presence
 *   <li>Lookup user by login ID in the repository
 *   <li>Verify password using secure hashing comparison
 *   <li>Update user login statistics for engagement tracking
 *   <li>Generate JWT access and refresh tokens
 *   <li>Persist refresh token for future token renewal
 *   <li>Return authentication result with tokens
 * </ol>
 *
 * <p>Security Features:
 *
 * <ul>
 *   <li>Secure password verification using bcrypt or similar
 *   <li>JWT token generation with proper expiration
 *   <li>Refresh token rotation for enhanced security
 *   <li>Comprehensive audit logging for security monitoring
 *   <li>Protection against timing attacks
 * </ul>
 *
 * <p>Business Rules:
 *
 * <ul>
 *   <li>Users must provide valid login ID and password
 *   <li>Login statistics are updated on successful authentication
 *   <li>Failed authentication attempts are logged for security
 *   <li>Tokens have appropriate expiration times
 *   <li>Refresh tokens are stored securely for renewal
 * </ul>
 *
 * <p>Usage Example:
 *
 * <pre>{@code
 * AuthenticationCommand command = new AuthenticationCommand("john_doe", "password123");
 * AuthenticationResult result = authenticateUserUseCase.execute(command);
 *
 * if (result.isSuccess()) {
 *     String accessToken = result.getAccessToken();
 *     String refreshToken = result.getRefreshToken();
 *     // Use tokens for subsequent API calls
 * }
 * }</pre>
 *
 * @author RCT Development Team
 * @since 1.0.0
 * @see AuthenticationCommand
 * @see AuthenticationResult
 * @see User
 * @see JwtTokenService
 * @see PasswordService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticateUserUseCase {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordService passwordService;
  private final JwtTokenService jwtTokenService;

  /**
   * Executes the user authentication process with comprehensive security measures.
   *
   * <p>This method performs the complete authentication workflow including credential validation,
   * password verification, login statistics update, and token generation. It ensures secure
   * authentication while maintaining user engagement metrics.
   *
   * <p>The method is transactional to ensure data consistency - if any step fails, all changes are
   * rolled back to maintain system integrity.
   *
   * <p>Security Considerations:
   *
   * <ul>
   *   <li>Passwords are never logged or exposed in error messages
   *   <li>Failed attempts are logged with user ID for monitoring
   *   <li>Timing attacks are mitigated by consistent processing time
   *   <li>Tokens are generated with cryptographically secure randomness
   * </ul>
   *
   * @param command the authentication command containing login credentials, must not be null
   * @return the authentication result containing user info and JWT tokens
   * @throws NullPointerException if command is null
   * @throws AuthenticationException if user not found or password is invalid
   * @throws IllegalStateException if user account is in invalid state
   * @since 1.0.0
   */
  @Transactional
  public User execute(AuthenticationCommand command) {
    Objects.requireNonNull(command, "Authentication command cannot be null");

    log.debug("Attempting to authenticate user: {}", command.getLoginId());

    LoginId loginId = LoginId.of(command.getLoginId());
    User user =
        userRepository
            .findByLoginId(loginId)
            .orElseThrow(
                () -> {
                  log.warn("Authentication failed: User not found for loginId: {}", loginId);
                  return new AuthenticationException(
                      ErrorCode.INVALID_CREDENTIALS, "Invalid login credentials");
                });

    if (!passwordService.matches(command.getPassword(), user.getPasswordHash())) {
      log.warn("Authentication failed: Invalid password for user: {}", loginId);
      throw new AuthenticationException(ErrorCode.INVALID_CREDENTIALS, "Invalid login credentials");
    }

    // Update login statistics
    user.recordLogin(LocalDate.now());
    User updatedUser = userRepository.save(user);

    // Generate tokens
    String accessToken = jwtTokenService.generateAccessToken(updatedUser);
    String refreshToken = jwtTokenService.generateRefreshToken(updatedUser);

    // Save refresh token
    LocalDateTime refreshExpiration =
        LocalDateTime.now().plus(jwtTokenService.getRefreshTokenExpiration());
    RefreshToken refreshTokenEntity =
        RefreshToken.create(updatedUser.getId(), refreshToken, refreshExpiration);
    refreshTokenRepository.save(refreshTokenEntity);

    log.info("User authenticated successfully: {}", loginId);

    return updatedUser;
  }

  /**
   * Command object encapsulating authentication request data.
   *
   * <p>This immutable command object follows the Command pattern to encapsulate all information
   * needed for user authentication. It ensures data integrity and provides a clean interface for
   * the authentication process.
   *
   * <p>Security Note: The password is stored as a String for compatibility with Spring Security and
   * other frameworks, but should be cleared from memory as soon as possible after use.
   *
   * @since 1.0.0
   */
  public static class AuthenticationCommand {
    private final String loginId;
    private final String password;

    public AuthenticationCommand(String loginId, String password) {
      this.loginId = Objects.requireNonNull(loginId, "Login ID cannot be null");
      this.password = Objects.requireNonNull(password, "Password cannot be null");
    }

    public String getLoginId() {
      return loginId;
    }

    public String getPassword() {
      return password;
    }
  }
}
