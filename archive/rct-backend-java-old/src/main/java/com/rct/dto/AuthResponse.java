package com.rct.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
  private UUID userId;
  private String loginId;
  private String token;
  private boolean isGuest;
}
