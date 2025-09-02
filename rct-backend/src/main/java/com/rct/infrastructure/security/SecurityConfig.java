package com.rct.infrastructure.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration optimized for Railway deployment
 * Prioritizes health check accessibility over security (for initial deployment)
 */
@Configuration
public class SecurityConfig {

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/", "/actuator/health", "/actuator/health/**").permitAll()
            .anyRequest().permitAll()  // まずは通すことを最優先（後で絞る）
        )
        .httpBasic(Customizer.withDefaults());
    return http.build();
  }
}