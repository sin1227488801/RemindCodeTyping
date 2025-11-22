package com.rct.infrastructure.security;

import com.rct.domain.model.user.UserId;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for security-related operations. Provides convenient methods to access current user
 * information from security context.
 */
@Slf4j
public final class SecurityUtils {

  private SecurityUtils() {
    // Utility class - prevent instantiation
  }

  /**
   * Gets the currently authenticated user from the security context.
   *
   * @return Optional containing the authenticated user, empty if not authenticated
   */
  public static Optional<JwtAuthenticationFilter.AuthenticatedUser> getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication != null
        && authentication.isAuthenticated()
        && authentication.getPrincipal()
            instanceof JwtAuthenticationFilter.AuthenticatedUser authenticatedUser) {
      return Optional.of(authenticatedUser);
    }

    return Optional.empty();
  }

  /**
   * Gets the user ID of the currently authenticated user.
   *
   * @return Optional containing the user ID, empty if not authenticated
   */
  public static Optional<UserId> getCurrentUserIdOptional() {
    return getCurrentUser().map(JwtAuthenticationFilter.AuthenticatedUser::getUserId);
  }

  /**
   * Gets the login ID of the currently authenticated user.
   *
   * @return Optional containing the login ID, empty if not authenticated
   */
  public static Optional<String> getCurrentLoginId() {
    return getCurrentUser().map(JwtAuthenticationFilter.AuthenticatedUser::getLoginId);
  }

  /**
   * Checks if there is a currently authenticated user.
   *
   * @return true if user is authenticated, false otherwise
   */
  public static boolean isAuthenticated() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    return authentication != null
        && authentication.isAuthenticated()
        && authentication.getPrincipal() instanceof JwtAuthenticationFilter.AuthenticatedUser;
  }

  /**
   * Checks if the current user has the specified user ID.
   *
   * @param userId the user ID to check against
   * @return true if current user has the specified ID, false otherwise
   */
  public static boolean isCurrentUser(UserId userId) {
    return getCurrentUserIdOptional()
        .map(currentUserId -> currentUserId.equals(userId))
        .orElse(false);
  }

  /**
   * Requires that a user is currently authenticated.
   *
   * @return the authenticated user
   * @throws SecurityException if no user is authenticated
   */
  public static JwtAuthenticationFilter.AuthenticatedUser requireAuthenticated() {
    return getCurrentUser().orElseThrow(() -> new SecurityException("Authentication required"));
  }

  /**
   * Requires that the current user has the specified user ID.
   *
   * @param userId the required user ID
   * @throws SecurityException if user is not authenticated or has different ID
   */
  public static void requireCurrentUser(UserId userId) {
    if (!isCurrentUser(userId)) {
      throw new SecurityException("Access denied: user ID mismatch");
    }
  }

  /**
   * Gets the user ID of the currently authenticated user (non-optional version).
   *
   * @return the user ID
   * @throws SecurityException if not authenticated
   */
  public static UserId getCurrentUserId() {
    return getCurrentUser()
        .map(JwtAuthenticationFilter.AuthenticatedUser::getUserId)
        .orElseThrow(() -> new SecurityException("Authentication required"));
  }

  /**
   * Checks if the current user has the specified permission.
   *
   * @param permission the permission to check
   * @return true if user has permission, false otherwise
   */
  public static boolean hasPermission(String permission) {
    return getCurrentUser().map(user -> user.hasPermission(permission)).orElse(false);
  }

  /**
   * Checks if the current user is an admin.
   *
   * @return true if user is admin, false otherwise
   */
  public static boolean isAdmin() {
    return getCurrentUser().map(JwtAuthenticationFilter.AuthenticatedUser::isAdmin).orElse(false);
  }

  /**
   * Checks if the current user is a guest.
   *
   * @return true if user is guest, false otherwise
   */
  public static boolean isGuest() {
    return getCurrentUser().map(JwtAuthenticationFilter.AuthenticatedUser::isGuest).orElse(false);
  }

  /**
   * Requires that the current user has the specified permission.
   *
   * @param permission the required permission
   * @throws SecurityException if user doesn't have permission
   */
  public static void requirePermission(String permission) {
    if (!hasPermission(permission)) {
      throw new SecurityException("Access denied: insufficient permissions");
    }
  }

  /**
   * Requires that the current user is an admin.
   *
   * @throws SecurityException if user is not admin
   */
  public static void requireAdmin() {
    if (!isAdmin()) {
      throw new SecurityException("Access denied: admin privileges required");
    }
  }
}
