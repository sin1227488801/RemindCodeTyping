package com.rct.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import com.rct.util.TestDataBuilder;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("JWT Token Service Tests")
class JwtTokenServiceTest {

  private JwtTokenService jwtTokenService;
  private User testUser;

  @BeforeEach
  void setUp() {
    // Use test configuration
    String secretKey = "testSecretKey123456789012345678901234567890123456789012345678901234567890";
    long expirationMinutes = 60;
    String issuer = "test-issuer";

    jwtTokenService = new JwtTokenService(secretKey, expirationMinutes, issuer);

    testUser = TestDataBuilder.createUser(new LoginId("testuser"));
  }

  @Test
  @DisplayName("Should generate valid JWT token for user")
  void shouldGenerateValidJwtToken() {
    // When
    String token = jwtTokenService.generateToken(testUser);

    // Then
    assertThat(token).isNotNull().isNotEmpty();
    assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts separated by dots
  }

  @Test
  @DisplayName("Should validate and extract claims from valid token")
  void shouldValidateAndExtractClaimsFromValidToken() {
    // Given
    String token = jwtTokenService.generateToken(testUser);

    // When
    Optional<JwtTokenService.TokenClaims> claims = jwtTokenService.validateToken(token);

    // Then
    assertThat(claims).isPresent();
    assertThat(claims.get().getUserId()).isEqualTo(testUser.getId());
    assertThat(claims.get().getLoginId()).isEqualTo(testUser.getLoginId().getValue());
    assertThat(claims.get().getIssuer()).isEqualTo("test-issuer");
    assertThat(claims.get().getIssuedAt()).isNotNull();
    assertThat(claims.get().getExpiration()).isNotNull();
  }

  @Test
  @DisplayName("Should return empty optional for invalid token")
  void shouldReturnEmptyOptionalForInvalidToken() {
    // Given
    String invalidToken = "invalid.jwt.token";

    // When
    Optional<JwtTokenService.TokenClaims> claims = jwtTokenService.validateToken(invalidToken);

    // Then
    assertThat(claims).isEmpty();
  }

  @Test
  @DisplayName("Should return empty optional for null token")
  void shouldReturnEmptyOptionalForNullToken() {
    // When
    Optional<JwtTokenService.TokenClaims> claims = jwtTokenService.validateToken(null);

    // Then
    assertThat(claims).isEmpty();
  }

  @Test
  @DisplayName("Should return empty optional for empty token")
  void shouldReturnEmptyOptionalForEmptyToken() {
    // When
    Optional<JwtTokenService.TokenClaims> claims = jwtTokenService.validateToken("");

    // Then
    assertThat(claims).isEmpty();
  }

  @Test
  @DisplayName("Should extract user ID from valid token")
  void shouldExtractUserIdFromValidToken() {
    // Given
    String token = jwtTokenService.generateToken(testUser);

    // When
    Optional<UserId> userId = jwtTokenService.extractUserId(token);

    // Then
    assertThat(userId).isPresent();
    assertThat(userId.get()).isEqualTo(testUser.getId());
  }

  @Test
  @DisplayName("Should return empty optional when extracting user ID from invalid token")
  void shouldReturnEmptyOptionalWhenExtractingUserIdFromInvalidToken() {
    // Given
    String invalidToken = "invalid.jwt.token";

    // When
    Optional<UserId> userId = jwtTokenService.extractUserId(invalidToken);

    // Then
    assertThat(userId).isEmpty();
  }

  @Test
  @DisplayName("Should detect non-expired token as not expired")
  void shouldDetectNonExpiredTokenAsNotExpired() {
    // Given
    String token = jwtTokenService.generateToken(testUser);

    // When
    boolean isExpired = jwtTokenService.isTokenExpired(token);

    // Then
    assertThat(isExpired).isFalse();
  }

  @Test
  @DisplayName("Should detect invalid token as expired")
  void shouldDetectInvalidTokenAsExpired() {
    // Given
    String invalidToken = "invalid.jwt.token";

    // When
    boolean isExpired = jwtTokenService.isTokenExpired(invalidToken);

    // Then
    assertThat(isExpired).isTrue();
  }

  @Test
  @DisplayName("Should generate different tokens for different users")
  void shouldGenerateDifferentTokensForDifferentUsers() {
    // Given
    User anotherUser = TestDataBuilder.createUser(new LoginId("anotheruser"));

    // When
    String token1 = jwtTokenService.generateToken(testUser);
    String token2 = jwtTokenService.generateToken(anotherUser);

    // Then
    assertThat(token1).isNotEqualTo(token2);
  }

  @Test
  @DisplayName("Should generate different tokens for same user at different times")
  void shouldGenerateDifferentTokensForSameUserAtDifferentTimes() throws InterruptedException {
    // Given
    String token1 = jwtTokenService.generateToken(testUser);
    Thread.sleep(1000); // Wait 1 second to ensure different issued time

    // When
    String token2 = jwtTokenService.generateToken(testUser);

    // Then
    assertThat(token1).isNotEqualTo(token2);
  }

  @Test
  @DisplayName("Should handle token with wrong issuer")
  void shouldHandleTokenWithWrongIssuer() {
    // Given - Create service with different issuer
    JwtTokenService differentIssuerService =
        new JwtTokenService(
            "testSecretKey123456789012345678901234567890123456789012345678901234567890",
            60,
            "different-issuer");
    String token = differentIssuerService.generateToken(testUser);

    // When - Try to validate with original service
    Optional<JwtTokenService.TokenClaims> claims = jwtTokenService.validateToken(token);

    // Then
    assertThat(claims).isEmpty();
  }

  @Test
  @DisplayName("TokenClaims should provide access to all claim data")
  void tokenClaimsShouldProvideAccessToAllClaimData() {
    // Given
    String token = jwtTokenService.generateToken(testUser);
    Optional<JwtTokenService.TokenClaims> claimsOpt = jwtTokenService.validateToken(token);

    // When
    assertThat(claimsOpt).isPresent();
    JwtTokenService.TokenClaims claims = claimsOpt.get();

    // Then
    assertThat(claims.getUserId()).isNotNull();
    assertThat(claims.getLoginId()).isNotNull();
    assertThat(claims.getIssuedAt()).isNotNull();
    assertThat(claims.getExpiration()).isNotNull();
    assertThat(claims.getIssuer()).isNotNull();

    // Verify specific values
    assertThat(claims.getUserId().getValue()).isEqualTo(testUser.getId().getValue());
    assertThat(claims.getLoginId()).isEqualTo(testUser.getLoginId().getValue());
    assertThat(claims.getIssuer()).isEqualTo("test-issuer");
  }
}
