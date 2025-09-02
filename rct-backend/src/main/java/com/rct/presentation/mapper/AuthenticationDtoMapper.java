package com.rct.presentation.mapper;

import com.rct.application.command.AuthenticateUserCommand;
import com.rct.application.command.RegisterUserCommand;
import com.rct.application.result.AuthenticationResult;
import com.rct.presentation.dto.request.LoginRequest;
import com.rct.presentation.dto.request.RegisterRequest;
import com.rct.presentation.dto.response.AuthenticationResponse;
import org.springframework.stereotype.Component;

/** Mapper for converting between presentation DTOs and application layer objects. */
@Component
public class AuthenticationDtoMapper {

  /** Converts RegisterRequest to RegisterUserCommand. */
  public RegisterUserCommand toRegisterCommand(RegisterRequest request) {
    return new RegisterUserCommand(request.getLoginId(), request.getPassword());
  }

  /** Converts LoginRequest to AuthenticateUserCommand. */
  public AuthenticateUserCommand toLoginCommand(LoginRequest request) {
    return new AuthenticateUserCommand(request.getLoginId(), request.getPassword());
  }

  /** Converts AuthenticationResult to AuthenticationResponse. */
  public AuthenticationResponse toAuthenticationResponse(AuthenticationResult result) {
    return new AuthenticationResponse(
        result.getUserId().getValue(),
        result.getLoginId().getValue(), // Convert LoginId to String
        result.getAccessToken(),
        result.getRefreshToken(),
        3600L, // Default expiration time
        "Bearer",
        result.isGuest());
  }
}
