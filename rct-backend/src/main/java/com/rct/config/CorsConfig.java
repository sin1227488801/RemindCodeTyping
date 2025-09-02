package com.rct.config;

import com.rct.infrastructure.config.ApplicationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(ApplicationProperties.class)
public class CorsConfig implements WebMvcConfigurer {

  private final ApplicationProperties applicationProperties;

  public CorsConfig(ApplicationProperties applicationProperties) {
    this.applicationProperties = applicationProperties;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    var corsProps = applicationProperties.cors();

    registry
        .addMapping("/api/**")
        .allowedOrigins(corsProps.allowedOrigins().toArray(new String[0]))
        .allowedMethods(corsProps.allowedMethods().toArray(new String[0]))
        .allowedHeaders(corsProps.allowedHeaders().toArray(new String[0]))
        .allowCredentials(corsProps.allowCredentials())
        .maxAge(corsProps.maxAge().toSeconds());
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    var corsProps = applicationProperties.cors();

    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(corsProps.allowedOrigins());
    configuration.setAllowedMethods(corsProps.allowedMethods());
    configuration.setAllowedHeaders(corsProps.allowedHeaders());
    configuration.setAllowCredentials(corsProps.allowCredentials());
    configuration.setMaxAge(corsProps.maxAge().toSeconds());

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
  }
}
