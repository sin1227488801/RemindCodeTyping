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
  private String token;
  private boolean isGuest;
}
