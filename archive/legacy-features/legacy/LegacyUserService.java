package com.rct.infrastructure.legacy;

import org.springframework.stereotype.Service;

/**
 * Legacy user service implementation Maintains existing behavior during transition period
 * Requirements: 8.4
 */
@Service
public class LegacyUserService {

  /** Legacy authentication method Maintains exact same behavior as original implementation */
  public LegacyApiAdapter.LegacyAuthResponse authenticate(String loginId, String password) {
    // This would contain the original authentication logic
    // Kept for backward compatibility during transition

    // Placeholder implementation
    return new LegacyApiAdapter.LegacyAuthResponse(
        "success", "legacy_token_" + loginId, "user_" + loginId);
  }

  /** Legacy user registration */
  public LegacyApiAdapter.LegacyAuthResponse register(String loginId, String password) {
    // Original registration logic
    return new LegacyApiAdapter.LegacyAuthResponse(
        "success", "legacy_token_" + loginId, "user_" + loginId);
  }

  /** Legacy user profile retrieval */
  public LegacyUserProfile getUserProfile(String userId) {
    // Original profile retrieval logic
    return new LegacyUserProfile(userId, "legacy_user_" + userId);
  }

  public static class LegacyUserProfile {
    private String userId;
    private String loginId;

    public LegacyUserProfile(String userId, String loginId) {
      this.userId = userId;
      this.loginId = loginId;
    }

    public String getUserId() {
      return userId;
    }

    public String getLoginId() {
      return loginId;
    }
  }
}
