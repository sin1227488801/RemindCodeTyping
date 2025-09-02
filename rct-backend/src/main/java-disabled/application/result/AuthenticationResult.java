package com.rct.application.result;

import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.UserId;
import lombok.AllArgsConstructor;
import lombok.Data;

/** Result object for authentication operations. */
@Data
@AllArgsConstructor
public class AuthenticationResult {
  private final UserId userId;
  private final String loginId;
  private final String role;
  private final String accessToken;
  private final String refreshToken;
  private final boolean isGuest;

  public static AuthenticationResult success(
      UserId userId, String loginId, String role, String accessToken, String refreshToken) {
    return new AuthenticationResult(userId, loginId, role, accessToken, refreshToken, false);
  }

  public static AuthenticationResult guestSession(
      UserId userId, String loginId, String accessToken) {
    return new AuthenticationResult(userId, loginId, "GUEST", accessToken, null, true);
  }

  // Backward compatibility methods
  public LoginId getLoginId() {
    return LoginId.of(loginId);
  }

  public String getToken() {
    return accessToken;
  }
}
