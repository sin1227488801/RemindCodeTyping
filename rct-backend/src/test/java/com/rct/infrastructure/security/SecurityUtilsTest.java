package com.rct.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.rct.domain.model.user.UserId;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@DisplayName("Security Utils Tests")
class SecurityUtilsTest {

  private UserId testUserId;
  private String testLoginId;
  private JwtAuthenticationFilter.AuthenticatedUser authenticatedUser;

  @BeforeEach
  void setUp() {
    testUserId = new UserId(UUID.randomUUID());
    testLoginId = "testuser";
    authenticatedUser = new JwtAuthenticationFilter.AuthenticatedUser(testUserId, testLoginId);
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("Should return current user when authenticated")
  void shouldReturnCurrentUserWhenAuthenticated() {
    // Given
    setUpAuthenticatedContext();

    // When
    Optional<JwtAuthenticationFilter.AuthenticatedUser> currentUser =
        SecurityUtils.getCurrentUser();

    // Then
    assertThat(currentUser).isPresent();
    assertThat(currentUser.get().getUserId()).isEqualTo(testUserId);
    assertThat(currentUser.get().getLoginId()).isEqualTo(testLoginId);
  }

  @Test
  @DisplayName("Should return empty optional when not authenticated")
  void shouldReturnEmptyOptionalWhenNotAuthenticated() {
    // Given - No authentication set up

    // When
    Optional<JwtAuthenticationFilter.AuthenticatedUser> currentUser =
        SecurityUtils.getCurrentUser();

    // Then
    assertThat(currentUser).isEmpty();
  }

  @Test
  @DisplayName("Should return empty optional when authentication is null")
  void shouldReturnEmptyOptionalWhenAuthenticationIsNull() {
    // Given
    SecurityContextHolder.getContext().setAuthentication(null);

    // When
    Optional<JwtAuthenticationFilter.AuthenticatedUser> currentUser =
        SecurityUtils.getCurrentUser();

    // Then
    assertThat(currentUser).isEmpty();
  }

  @Test
  @DisplayName("Should return empty optional when authentication is not authenticated")
  void shouldReturnEmptyOptionalWhenAuthenticationIsNotAuthenticated() {
    // Given
    Authentication authentication = mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(false);
    SecurityContextHolder.getContext().setAuthentication(authentication);

    // When
    Optional<JwtAuthenticationFilter.AuthenticatedUser> currentUser =
        SecurityUtils.getCurrentUser();

    // Then
    assertThat(currentUser).isEmpty();
  }

  @Test
  @DisplayName("Should return empty optional when principal is not AuthenticatedUser")
  void shouldReturnEmptyOptionalWhenPrincipalIsNotAuthenticatedUser() {
    // Given
    Authentication authentication = mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(true);
    when(authentication.getPrincipal()).thenReturn("not-an-authenticated-user");
    SecurityContextHolder.getContext().setAuthentication(authentication);

    // When
    Optional<JwtAuthenticationFilter.AuthenticatedUser> currentUser =
        SecurityUtils.getCurrentUser();

    // Then
    assertThat(currentUser).isEmpty();
  }

  @Test
  @DisplayName("Should return current user ID when authenticated")
  void shouldReturnCurrentUserIdWhenAuthenticated() {
    // Given
    setUpAuthenticatedContext();

    // When
    Optional<UserId> currentUserId = SecurityUtils.getCurrentUserId();

    // Then
    assertThat(currentUserId).isPresent();
    assertThat(currentUserId.get()).isEqualTo(testUserId);
  }

  @Test
  @DisplayName("Should return empty optional for user ID when not authenticated")
  void shouldReturnEmptyOptionalForUserIdWhenNotAuthenticated() {
    // Given - No authentication set up

    // When
    Optional<UserId> currentUserId = SecurityUtils.getCurrentUserId();

    // Then
    assertThat(currentUserId).isEmpty();
  }

  @Test
  @DisplayName("Should return current login ID when authenticated")
  void shouldReturnCurrentLoginIdWhenAuthenticated() {
    // Given
    setUpAuthenticatedContext();

    // When
    Optional<String> currentLoginId = SecurityUtils.getCurrentLoginId();

    // Then
    assertThat(currentLoginId).isPresent();
    assertThat(currentLoginId.get()).isEqualTo(testLoginId);
  }

  @Test
  @DisplayName("Should return empty optional for login ID when not authenticated")
  void shouldReturnEmptyOptionalForLoginIdWhenNotAuthenticated() {
    // Given - No authentication set up

    // When
    Optional<String> currentLoginId = SecurityUtils.getCurrentLoginId();

    // Then
    assertThat(currentLoginId).isEmpty();
  }

  @Test
  @DisplayName("Should return true when user is authenticated")
  void shouldReturnTrueWhenUserIsAuthenticated() {
    // Given
    setUpAuthenticatedContext();

    // When
    boolean isAuthenticated = SecurityUtils.isAuthenticated();

    // Then
    assertThat(isAuthenticated).isTrue();
  }

  @Test
  @DisplayName("Should return false when user is not authenticated")
  void shouldReturnFalseWhenUserIsNotAuthenticated() {
    // Given - No authentication set up

    // When
    boolean isAuthenticated = SecurityUtils.isAuthenticated();

    // Then
    assertThat(isAuthenticated).isFalse();
  }

  @Test
  @DisplayName("Should return true when checking current user with matching ID")
  void shouldReturnTrueWhenCheckingCurrentUserWithMatchingId() {
    // Given
    setUpAuthenticatedContext();

    // When
    boolean isCurrentUser = SecurityUtils.isCurrentUser(testUserId);

    // Then
    assertThat(isCurrentUser).isTrue();
  }

  @Test
  @DisplayName("Should return false when checking current user with different ID")
  void shouldReturnFalseWhenCheckingCurrentUserWithDifferentId() {
    // Given
    setUpAuthenticatedContext();
    UserId differentUserId = new UserId(UUID.randomUUID());

    // When
    boolean isCurrentUser = SecurityUtils.isCurrentUser(differentUserId);

    // Then
    assertThat(isCurrentUser).isFalse();
  }

  @Test
  @DisplayName("Should return false when checking current user but not authenticated")
  void shouldReturnFalseWhenCheckingCurrentUserButNotAuthenticated() {
    // Given - No authentication set up

    // When
    boolean isCurrentUser = SecurityUtils.isCurrentUser(testUserId);

    // Then
    assertThat(isCurrentUser).isFalse();
  }

  @Test
  @DisplayName("Should return authenticated user when requiring authentication")
  void shouldReturnAuthenticatedUserWhenRequiringAuthentication() {
    // Given
    setUpAuthenticatedContext();

    // When
    JwtAuthenticationFilter.AuthenticatedUser user = SecurityUtils.requireAuthenticated();

    // Then
    assertThat(user).isNotNull();
    assertThat(user.getUserId()).isEqualTo(testUserId);
    assertThat(user.getLoginId()).isEqualTo(testLoginId);
  }

  @Test
  @DisplayName("Should throw exception when requiring authentication but not authenticated")
  void shouldThrowExceptionWhenRequiringAuthenticationButNotAuthenticated() {
    // Given - No authentication set up

    // When & Then
    assertThatThrownBy(SecurityUtils::requireAuthenticated)
        .isInstanceOf(SecurityException.class)
        .hasMessage("Authentication required");
  }

  @Test
  @DisplayName("Should not throw exception when requiring current user with matching ID")
  void shouldNotThrowExceptionWhenRequiringCurrentUserWithMatchingId() {
    // Given
    setUpAuthenticatedContext();

    // When & Then - Should not throw exception
    SecurityUtils.requireCurrentUser(testUserId);
  }

  @Test
  @DisplayName("Should throw exception when requiring current user with different ID")
  void shouldThrowExceptionWhenRequiringCurrentUserWithDifferentId() {
    // Given
    setUpAuthenticatedContext();
    UserId differentUserId = new UserId(UUID.randomUUID());

    // When & Then
    assertThatThrownBy(() -> SecurityUtils.requireCurrentUser(differentUserId))
        .isInstanceOf(SecurityException.class)
        .hasMessage("Access denied: user ID mismatch");
  }

  @Test
  @DisplayName("Should throw exception when requiring current user but not authenticated")
  void shouldThrowExceptionWhenRequiringCurrentUserButNotAuthenticated() {
    // Given - No authentication set up

    // When & Then
    assertThatThrownBy(() -> SecurityUtils.requireCurrentUser(testUserId))
        .isInstanceOf(SecurityException.class)
        .hasMessage("Access denied: user ID mismatch");
  }

  private void setUpAuthenticatedContext() {
    Authentication authentication = mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(true);
    when(authentication.getPrincipal()).thenReturn(authenticatedUser);
    SecurityContextHolder.getContext().setAuthentication(authentication);
  }
}
