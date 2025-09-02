package com.rct.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request DTO for refresh token operations. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequest {

  @NotBlank(message = "Refresh token is required")
  private String refreshToken;
}
