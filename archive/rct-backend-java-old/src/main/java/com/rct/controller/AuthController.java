package com.rct.controller;

import com.rct.application.service.AuthenticationApplicationService;
import com.rct.application.usecase.auth.RefreshTokenUseCase;
import com.rct.infrastructure.security.SecurityUtils;
import com.rct.presentation.dto.request.LoginRequest;
import com.rct.presentation.dto.request.RefreshTokenRequest;
import com.rct.presentation.dto.request.RegisterRequest;
import com.rct.presentation.dto.response.AuthenticationResponse;
import com.rct.presentation.dto.response.ErrorResponse;
import com.rct.presentation.mapper.AuthenticationDtoMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication operations. Handles HTTP concerns only and delegates business
 * logic to application services.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(
    name = "Authentication",
    description =
        "Authentication and user management endpoints. Handles user registration, login, token refresh, and logout operations.")
public class AuthController {

  private final AuthenticationApplicationService authenticationService;
  private final RefreshTokenUseCase refreshTokenUseCase;
  private final AuthenticationDtoMapper dtoMapper;

  @Operation(
      summary = "Register a new user",
      description =
          "Creates a new user account with the provided credentials. Returns authentication tokens upon successful registration.")
  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "201",
            description = "User registered successfully",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AuthenticationResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Successful Registration",
                            value =
                                """
                        {
                          "userId": "123e4567-e89b-12d3-a456-426614174000",
                          "loginId": "newuser",
                          "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
                          "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
                          "expiresIn": 3600,
                          "tokenType": "Bearer"
                        }
                        """))),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data or user already exists",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Validation Error",
                            value =
                                """
                        {
                          "errorCode": "VALIDATION_ERROR",
                          "message": "Login ID already exists",
                          "timestamp": "2024-01-01T12:00:00Z",
                          "details": {
                            "field": "loginId",
                            "rejectedValue": "existinguser"
                          }
                        }
                        """))),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @PostMapping("/register")
  public ResponseEntity<AuthenticationResponse> register(
      @Parameter(
              description = "User registration details",
              required = true,
              schema = @Schema(implementation = RegisterRequest.class))
          @Valid
          @RequestBody
          RegisterRequest request) {
    log.info("Registration request received for loginId: {}", request.getLoginId());

    var command = dtoMapper.toRegisterCommand(request);
    var result = authenticationService.register(command);
    var response = dtoMapper.toAuthenticationResponse(result);

    log.info("User registered successfully with ID: {}", result.getUserId());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @Operation(
      summary = "Authenticate user",
      description =
          "Authenticates a user with login credentials and returns JWT tokens for API access.")
  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "200",
            description = "Authentication successful",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AuthenticationResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Successful Login",
                            value =
                                """
                        {
                          "userId": "123e4567-e89b-12d3-a456-426614174000",
                          "loginId": "testuser",
                          "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
                          "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
                          "expiresIn": 3600,
                          "tokenType": "Bearer"
                        }
                        """))),
        @ApiResponse(
            responseCode = "401",
            description = "Invalid credentials",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Invalid Credentials",
                            value =
                                """
                        {
                          "errorCode": "INVALID_CREDENTIALS",
                          "message": "Invalid login credentials",
                          "timestamp": "2024-01-01T12:00:00Z"
                        }
                        """))),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request format",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @PostMapping("/login")
  public ResponseEntity<AuthenticationResponse> login(
      @Parameter(
              description = "User login credentials",
              required = true,
              schema = @Schema(implementation = LoginRequest.class))
          @Valid
          @RequestBody
          LoginRequest request) {
    log.info("Login request received for loginId: {}", request.getLoginId());

    var command = dtoMapper.toLoginCommand(request);
    var result = authenticationService.authenticate(command);
    var response = dtoMapper.toAuthenticationResponse(result);

    log.info("User authenticated successfully with ID: {}", result.getUserId());
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "Create demo/guest session",
      description =
          "Creates a temporary guest session for demo purposes. No registration required.")
  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "200",
            description = "Guest session created successfully",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AuthenticationResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Guest Session",
                            value =
                                """
                        {
                          "userId": "guest-123e4567-e89b-12d3-a456-426614174000",
                          "loginId": "guest",
                          "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
                          "refreshToken": null,
                          "expiresIn": 3600,
                          "tokenType": "Bearer"
                        }
                        """))),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @PostMapping("/demo")
  public ResponseEntity<AuthenticationResponse> demoLogin() {
    log.info("Demo login request received");

    var result = authenticationService.createGuestSession();
    var response = dtoMapper.toAuthenticationResponse(result);

    log.info("Guest session created with ID: {}", result.getUserId());
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "Refresh access token",
      description = "Refreshes an expired access token using a valid refresh token.")
  @ApiResponses(
      value = {
        @ApiResponse(
            responseCode = "200",
            description = "Token refreshed successfully",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AuthenticationResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Refreshed Token",
                            value =
                                """
                        {
                          "userId": "123e4567-e89b-12d3-a456-426614174000",
                          "loginId": "testuser",
                          "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
                          "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
                          "expiresIn": 3600,
                          "tokenType": "Bearer"
                        }
                        """))),
        @ApiResponse(
            responseCode = "401",
            description = "Invalid or expired refresh token",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class),
                    examples =
                        @ExampleObject(
                            name = "Invalid Refresh Token",
                            value =
                                """
                        {
                          "errorCode": "INVALID_TOKEN",
                          "message": "Refresh token is invalid or expired",
                          "timestamp": "2024-01-01T12:00:00Z"
                        }
                        """))),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request format",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @PostMapping("/refresh")
  public ResponseEntity<AuthenticationResponse> refreshToken(
      @Parameter(
              description = "Refresh token request",
              required = true,
              schema = @Schema(implementation = RefreshTokenRequest.class))
          @Valid
          @RequestBody
          RefreshTokenRequest request) {
    log.info("Token refresh request received");

    var result = refreshTokenUseCase.execute(request.getRefreshToken());
    var response = dtoMapper.toAuthenticationResponse(result);

    log.info("Token refreshed successfully for user ID: {}", result.getUserId());
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "Logout user",
      description = "Logs out the user by revoking the provided refresh token.")
  @ApiResponses(
      value = {
        @ApiResponse(responseCode = "200", description = "Logout successful"),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request format",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(
            responseCode = "401",
            description = "Invalid refresh token",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      @Parameter(
              description = "Refresh token to revoke",
              required = true,
              schema = @Schema(implementation = RefreshTokenRequest.class))
          @Valid
          @RequestBody
          RefreshTokenRequest request) {
    log.info("Logout request received");

    refreshTokenUseCase.revokeToken(request.getRefreshToken());

    log.info("User logged out successfully");
    return ResponseEntity.ok().build();
  }

  @Operation(
      summary = "Logout from all devices",
      description =
          "Logs out the user from all devices by revoking all refresh tokens for the authenticated user.")
  @ApiResponses(
      value = {
        @ApiResponse(responseCode = "200", description = "Logout from all devices successful"),
        @ApiResponse(
            responseCode = "401",
            description = "Authentication required",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)))
      })
  @SecurityRequirement(name = "bearerAuth")
  @PostMapping("/logout-all")
  public ResponseEntity<Void> logoutAll() {
    log.info("Logout all devices request received");

    var userId = SecurityUtils.getCurrentUserId();
    refreshTokenUseCase.revokeAllTokensForUser(userId);

    log.info("User logged out from all devices: {}", userId);
    return ResponseEntity.ok().build();
  }
}
