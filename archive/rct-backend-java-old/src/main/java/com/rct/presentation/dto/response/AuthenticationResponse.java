package com.rct.presentation.dto.response;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for authentication operations. */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {

  private UUID userId;
  private String loginId;
  private String accessToken;
  private String refreshToken;
  private Long expiresIn;
  private String tokenType;
  private boolean isGuest;

  // Backward compatibility
  public String getToken() {
    return accessToken;
  }
}
