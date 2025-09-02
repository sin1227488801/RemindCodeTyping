package com.rct.infrastructure.security;

import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.config.ApplicationProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for JWT token generation and validation. Handles token creation, validation, and claims
 * extraction.
 */
@Service
@Slf4j
public class JwtTokenService {

  private final Key signingKey;
  private final ApplicationProperties.JwtProperties jwtProperties;

  public JwtTokenService(ApplicationProperties applicationProperties) {
    this.jwtProperties = applicationProperties.jwt();
    this.signingKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes());
  }

  /**
   * Generates a JWT access token for the given user.
   *
   * @param user the user for whom to generate the token
   * @return the generated JWT token
   */
  public String generateAccessToken(User user) {
    Instant now = Instant.now();
    Instant expiration = now.plus(jwtProperties.expiration());

    return Jwts.builder()
        .setSubject(user.getId().getValue().toString())
        .setIssuer(jwtProperties.issuer())
        .setAudience(jwtProperties.audience())
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(expiration))
        .claim("loginId", user.getLoginId().getValue())
        .claim("role", user.getRole().getCode())
        .claim("tokenType", "ACCESS")
        .signWith(signingKey, SignatureAlgorithm.HS512)
        .compact();
  }

  /**
   * Generates a JWT refresh token for the given user.
   *
   * @param user the user for whom to generate the token
   * @return the generated refresh token
   */
  public String generateRefreshToken(User user) {
    Instant now = Instant.now();
    Instant expiration = now.plus(jwtProperties.refreshExpiration());

    return Jwts.builder()
        .setSubject(user.getId().getValue().toString())
        .setIssuer(jwtProperties.issuer())
        .setAudience(jwtProperties.audience())
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(expiration))
        .claim("loginId", user.getLoginId().getValue())
        .claim("tokenType", "REFRESH")
        .signWith(signingKey, SignatureAlgorithm.HS512)
        .compact();
  }

  /**
   * Generates a JWT token for the given user (backward compatibility).
   *
   * @param user the user for whom to generate the token
   * @return the generated JWT token
   */
  public String generateToken(User user) {
    return generateAccessToken(user);
  }

  /**
   * Generates a JWT token for a guest session.
   *
   * @param userId the guest user ID
   * @param loginId the guest login ID
   * @return the generated JWT token
   */
  public String generateGuestToken(UserId userId, com.rct.domain.model.user.LoginId loginId) {
    Instant now = Instant.now();
    Instant expiration = now.plus(jwtProperties.expiration());

    return Jwts.builder()
        .setSubject(userId.getValue().toString())
        .setIssuer(jwtProperties.issuer())
        .setAudience(jwtProperties.audience())
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(expiration))
        .claim("loginId", loginId.getValue())
        .claim("role", "GUEST")
        .claim("isGuest", true)
        .claim("tokenType", "ACCESS")
        .signWith(signingKey, SignatureAlgorithm.HS512)
        .compact();
  }

  /**
   * Validates a JWT token and extracts claims if valid.
   *
   * @param token the JWT token to validate
   * @return Optional containing TokenClaims if valid, empty otherwise
   */
  public Optional<TokenClaims> validateToken(String token) {
    try {
      Claims claims =
          Jwts.parser()
              .verifyWith((SecretKey) signingKey)
              .requireIssuer(jwtProperties.issuer())
              .requireAudience(jwtProperties.audience())
              .build()
              .parseSignedClaims(token)
              .getPayload();

      return Optional.of(new TokenClaims(claims));
    } catch (JwtException e) {
      log.warn("Invalid JWT token: {}", e.getMessage());
      return Optional.empty();
    }
  }

  /**
   * Extracts user ID from a valid token without full validation. Use only when token has already
   * been validated.
   *
   * @param token the JWT token
   * @return Optional containing UserId if extractable, empty otherwise
   */
  public Optional<UserId> extractUserId(String token) {
    return validateToken(token).map(TokenClaims::getUserId);
  }

  /**
   * Checks if a token is expired.
   *
   * @param token the JWT token to check
   * @return true if token is expired, false otherwise
   */
  public boolean isTokenExpired(String token) {
    return validateToken(token)
        .map(claims -> claims.getExpiration().before(new Date()))
        .orElse(true);
  }

  /**
   * Validates if a token is a refresh token.
   *
   * @param token the JWT token to check
   * @return true if token is a refresh token, false otherwise
   */
  public boolean isRefreshToken(String token) {
    return validateToken(token)
        .map(claims -> "REFRESH".equals(claims.getTokenType()))
        .orElse(false);
  }

  /**
   * Validates if a token is an access token.
   *
   * @param token the JWT token to check
   * @return true if token is an access token, false otherwise
   */
  public boolean isAccessToken(String token) {
    return validateToken(token).map(claims -> "ACCESS".equals(claims.getTokenType())).orElse(false);
  }

  /**
   * Gets the refresh token expiration duration.
   *
   * @return the refresh token expiration duration
   */
  public java.time.Duration getRefreshTokenExpiration() {
    return jwtProperties.refreshExpiration();
  }

  /** Wrapper class for JWT token claims. */
  public static class TokenClaims {
    private final Claims claims;

    public TokenClaims(Claims claims) {
      this.claims = claims;
    }

    public UserId getUserId() {
      String subject = claims.getSubject();
      return UserId.of(UUID.fromString(subject));
    }

    public String getLoginId() {
      return claims.get("loginId", String.class);
    }

    public String getRole() {
      return claims.get("role", String.class);
    }

    public String getTokenType() {
      return claims.get("tokenType", String.class);
    }

    public boolean isGuest() {
      return Boolean.TRUE.equals(claims.get("isGuest", Boolean.class));
    }

    public Date getIssuedAt() {
      return claims.getIssuedAt();
    }

    public Date getExpiration() {
      return claims.getExpiration();
    }

    public String getIssuer() {
      return claims.getIssuer();
    }
  }
}
