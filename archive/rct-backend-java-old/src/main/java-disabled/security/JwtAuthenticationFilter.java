package com.rct.infrastructure.security;

import com.rct.domain.model.user.Role;
import com.rct.domain.model.user.UserId;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWT Authentication Filter that processes JWT tokens from HTTP requests. Validates tokens and sets
 * up Spring Security authentication context.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String AUTHORIZATION_HEADER = "Authorization";
  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtTokenService jwtTokenService;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    try {
      String token = extractTokenFromRequest(request);

      if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        authenticateToken(token, request);
      }
    } catch (Exception e) {
      log.error("Cannot set user authentication: {}", e.getMessage());
      // Clear security context on error
      SecurityContextHolder.clearContext();
    }

    filterChain.doFilter(request, response);
  }

  /**
   * Extracts JWT token from the Authorization header.
   *
   * @param request the HTTP request
   * @return the JWT token if present, null otherwise
   */
  private String extractTokenFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader(AUTHORIZATION_HEADER);

    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
      return bearerToken.substring(BEARER_PREFIX.length());
    }

    return null;
  }

  /**
   * Authenticates the JWT token and sets up Spring Security context.
   *
   * @param token the JWT token to authenticate
   * @param request the HTTP request for additional details
   */
  private void authenticateToken(String token, HttpServletRequest request) {
    jwtTokenService
        .validateToken(token)
        .ifPresent(
            claims -> {
              // Only process access tokens in this filter
              if (!"ACCESS".equals(claims.getTokenType())) {
                log.debug("Ignoring non-access token");
                return;
              }

              UserId userId = claims.getUserId();
              String loginId = claims.getLoginId();
              String roleString = claims.getRole();

              Role role;
              try {
                role = Role.fromString(roleString);
              } catch (IllegalArgumentException e) {
                log.warn("Invalid role in token: {}", roleString);
                return;
              }

              // Create authorities from role
              Collection<GrantedAuthority> authorities = createAuthorities(role);

              // Create authentication token with user details and authorities
              UsernamePasswordAuthenticationToken authentication =
                  new UsernamePasswordAuthenticationToken(
                      new AuthenticatedUser(userId, loginId, role), null, authorities);

              authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

              // Set authentication in security context
              SecurityContextHolder.getContext().setAuthentication(authentication);

              log.debug("User {} authenticated successfully with role {}", loginId, role.getCode());
            });
  }

  /**
   * Creates Spring Security authorities from user role.
   *
   * @param role the user role
   * @return collection of granted authorities
   */
  private Collection<GrantedAuthority> createAuthorities(Role role) {
    return List.of(new SimpleGrantedAuthority("ROLE_" + role.getCode()));
  }

  /** Represents an authenticated user in the security context. */
  public static class AuthenticatedUser {
    private final UserId userId;
    private final String loginId;
    private final Role role;

    public AuthenticatedUser(UserId userId, String loginId, Role role) {
      this.userId = userId;
      this.loginId = loginId;
      this.role = role;
    }

    public UserId getUserId() {
      return userId;
    }

    public String getLoginId() {
      return loginId;
    }

    public Role getRole() {
      return role;
    }

    public boolean hasPermission(String permission) {
      return role.hasPermission(permission);
    }

    public boolean isAdmin() {
      return role.isAdmin();
    }

    public boolean isGuest() {
      return role.isGuest();
    }

    @Override
    public String toString() {
      return loginId + " (" + role.getCode() + ")";
    }
  }
}
