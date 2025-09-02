package com.rct.infrastructure.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Security configuration for the application. Configures JWT-based authentication and authorization
 * rules.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

  /**
   * Configures the security filter chain.
   *
   * @param http the HttpSecurity to configure
   * @return the configured SecurityFilterChain
   * @throws Exception if configuration fails
   */
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // Disable CSRF for stateless API
        .csrf(AbstractHttpConfigurer::disable)

        // Configure CORS
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

        // Set session management to stateless
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

        // Configure authorization rules
        .authorizeHttpRequests(
            auth ->
                auth
                    // Public endpoints - no authentication required
                    .requestMatchers(HttpMethod.POST, "/api/auth/login")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/register")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/refresh")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/logout")
                    .authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/public/**")
                    .permitAll()

                    // Health check endpoints
                    .requestMatchers("/actuator/health")
                    .permitAll()
                    .requestMatchers("/actuator/info")
                    .permitAll()

                    // API documentation (when enabled)
                    .requestMatchers("/swagger-ui/**")
                    .permitAll()
                    .requestMatchers("/v3/api-docs/**")
                    .permitAll()

                    // Static resources
                    .requestMatchers("/css/**", "/js/**", "/images/**", "/favicon.ico")
                    .permitAll()

                    // Admin-only endpoints
                    .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                    // User and admin endpoints
                    .requestMatchers(HttpMethod.GET, "/api/users/profile")
                    .hasAnyRole("USER", "ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/users/profile")
                    .hasAnyRole("USER", "ADMIN")

                    // Study book management - users and admins
                    .requestMatchers(HttpMethod.POST, "/api/study-books")
                    .hasAnyRole("USER", "ADMIN")
                    .requestMatchers(HttpMethod.PUT, "/api/study-books/**")
                    .hasAnyRole("USER", "ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/api/study-books/**")
                    .hasAnyRole("USER", "ADMIN")

                    // Typing sessions - all authenticated users including guests
                    .requestMatchers("/api/typing/**")
                    .authenticated()

                    // Study book reading - all authenticated users including guests
                    .requestMatchers(HttpMethod.GET, "/api/study-books/**")
                    .authenticated()

                    // All other requests require authentication
                    .anyRequest()
                    .authenticated())

        // Configure exception handling
        .exceptionHandling(
            exceptions -> exceptions.authenticationEntryPoint(jwtAuthenticationEntryPoint))

        // Add JWT filter before UsernamePasswordAuthenticationFilter
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  /**
   * Configures CORS settings for cross-origin requests.
   *
   * @return the CORS configuration source
   */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // Allow specific origins (configure based on environment)
    configuration.addAllowedOriginPattern("http://localhost:*");
    configuration.addAllowedOriginPattern("https://*.azurewebsites.net");

    // Allow common HTTP methods
    configuration.addAllowedMethod("GET");
    configuration.addAllowedMethod("POST");
    configuration.addAllowedMethod("PUT");
    configuration.addAllowedMethod("DELETE");
    configuration.addAllowedMethod("OPTIONS");

    // Allow common headers
    configuration.addAllowedHeader("*");

    // Allow credentials (cookies, authorization headers)
    configuration.setAllowCredentials(true);

    // Cache preflight response for 1 hour
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);

    return source;
  }
}
