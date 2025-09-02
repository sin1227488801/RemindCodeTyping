package com.rct.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import com.rct.util.TestDataBuilder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
@DisplayName("JWT Authentication Filter Tests")
class JwtAuthenticationFilterTest {

  @Mock private JwtTokenService jwtTokenService;

  @Mock private HttpServletRequest request;

  @Mock private HttpServletResponse response;

  @Mock private FilterChain filterChain;

  private JwtAuthenticationFilter jwtAuthenticationFilter;
  private User testUser;

  @BeforeEach
  void setUp() {
    jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtTokenService);
    testUser = TestDataBuilder.createUser(new LoginId("testuser"));

    // Clear security context before each test
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("Should authenticate user with valid JWT token")
  void shouldAuthenticateUserWithValidJwtToken() throws ServletException, IOException {
    // Given
    String validToken = "valid.jwt.token";
    String authHeader = "Bearer " + validToken;
    JwtTokenService.TokenClaims claims = createMockTokenClaims();

    when(request.getHeader("Authorization")).thenReturn(authHeader);
    when(jwtTokenService.validateToken(validToken)).thenReturn(Optional.of(claims));

    // When
    jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

    // Then
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    assertThat(authentication).isNotNull();
    assertThat(authentication.isAuthenticated()).isTrue();
    assertThat(authentication.getPrincipal())
        .isInstanceOf(JwtAuthenticationFilter.AuthenticatedUser.class);

    JwtAuthenticationFilter.AuthenticatedUser authenticatedUser =
        (JwtAuthenticationFilter.AuthenticatedUser) authentication.getPrincipal();
    assertThat(authenticatedUser.getUserId()).isEqualTo(testUser.getId());
    assertThat(authenticatedUser.getLoginId()).isEqualTo(testUser.getLoginId().getValue());

    verify(filterChain).doFilter(request, response);
  }

  @Test
  @DisplayName("Should not authenticate with invalid JWT token")
  void shouldNotAuthenticateWithInvalidJwtToken() throws ServletException, IOException {
    // Given
    String invalidToken = "invalid.jwt.token";
    String authHeader = "Bearer " + invalidToken;

    when(request.getHeader("Authorization")).thenReturn(authHeader);
    when(jwtTokenService.validateToken(invalidToken)).thenReturn(Optional.empty());

    // When
    jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

    // Then
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    assertThat(authentication).isNull();

    verify(filterChain).doFilter(request, response);
  }

  @Test
  @DisplayName("Should not authenticate when no Authorization header present")
  void shouldNotAuthenticateWhenNoAuthorizationHeaderPresent()
      throws ServletException, IOException {
    // Given
    when(request.getHeader("Authorization")).thenReturn(null);

    // When
    jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

    // Then
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    assertThat(authentication).isNull();

    verify(jwtTokenService, never()).validateToken(anyString());
    verify(filterChain).doFilter(request, response);
  }

  @Test
  @DisplayName("Should not authenticate when Authorization header doesn't start with Bearer")
  void shouldNotAuthenticateWhenAuthorizationHeaderDoesntStartWithBearer()
      throws ServletException, IOException {
    // Given
    when(request.getHeader("Authorization")).thenReturn("Basic sometoken");

    // When
    jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

    // Then
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    assertThat(authentication).isNull();

    verify(jwtTokenService, never()).validateToken(anyString());
    verify(filterChain).doFilter(request, response);
  }

  @Test
  @DisplayName("Should not authenticate when Authorization header is empty Bearer")
  void shouldNotAuthenticateWhenAuthorizationHeaderIsEmptyBearer()
      throws ServletException, IOException {
    // Given
    when(request.getHeader("Authorization")).thenReturn("Bearer ");

    // When
    jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

    // Then
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    assertThat(authentication).isNull();

    verify(jwtTokenService).validateToken("");
    verify(filterChain).doFilter(request, response);
  }

  @Test
  @DisplayName("Should not re-authenticate when user is already authenticated")
  void shouldNotReAuthenticateWhenUserIsAlreadyAuthenticated()
      throws ServletException, IOException {
    // Given
    String validToken = "valid.jwt.token";
    String authHeader = "Bearer " + validToken;

    // Set up existing authentication
    JwtAuthenticationFilter.AuthenticatedUser existingUser =
        new JwtAuthenticationFilter.AuthenticatedUser(testUser.getId(), "existinguser");
    Authentication existingAuth = mock(Authentication.class);
    when(existingAuth.isAuthenticated()).thenReturn(true);
    when(existingAuth.getPrincipal()).thenReturn(existingUser);
    SecurityContextHolder.getContext().setAuthentication(existingAuth);

    when(request.getHeader("Authorization")).thenReturn(authHeader);

    // When
    jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

    // Then
    verify(jwtTokenService, never()).validateToken(anyString());
    verify(filterChain).doFilter(request, response);
  }

  @Test
  @DisplayName("Should clear security context on exception")
  void shouldClearSecurityContextOnException() throws ServletException, IOException {
    // Given
    String validToken = "valid.jwt.token";
    String authHeader = "Bearer " + validToken;

    when(request.getHeader("Authorization")).thenReturn(authHeader);
    when(jwtTokenService.validateToken(validToken)).thenThrow(new RuntimeException("Token error"));

    // When
    jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

    // Then
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    assertThat(authentication).isNull();

    verify(filterChain).doFilter(request, response);
  }

  @Test
  @DisplayName("AuthenticatedUser should provide correct user information")
  void authenticatedUserShouldProvideCorrectUserInformation() {
    // Given
    UserId userId = new UserId(UUID.randomUUID());
    String loginId = "testuser";

    // When
    JwtAuthenticationFilter.AuthenticatedUser authenticatedUser =
        new JwtAuthenticationFilter.AuthenticatedUser(userId, loginId);

    // Then
    assertThat(authenticatedUser.getUserId()).isEqualTo(userId);
    assertThat(authenticatedUser.getLoginId()).isEqualTo(loginId);
    assertThat(authenticatedUser.toString()).isEqualTo(loginId);
  }

  private JwtTokenService.TokenClaims createMockTokenClaims() {
    JwtTokenService.TokenClaims claims = mock(JwtTokenService.TokenClaims.class);
    when(claims.getUserId()).thenReturn(testUser.getId());
    when(claims.getLoginId()).thenReturn(testUser.getLoginId().getValue());
    return claims;
  }
}
