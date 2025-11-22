package com.rct.presentation.dto.request;

import com.rct.presentation.validation.SafeInput;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Request DTO for user login. */
@Data
public class LoginRequest {

  @NotBlank(message = "Login ID is required")
  @Size(min = 4, max = 50, message = "Login ID must be between 4 and 50 characters")
  @SafeInput(maxLength = 50, strict = true, allowHtml = false)
  private String loginId;

  @NotBlank(message = "Password is required")
  @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
  @SafeInput(maxLength = 100, strict = false, allowHtml = false)
  private String password;
}
