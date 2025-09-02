package com.rct.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI configuration for comprehensive API documentation.
 *
 * <p>This configuration provides detailed API documentation including:
 *
 * <ul>
 *   <li>Authentication schemes (JWT Bearer token)
 *   <li>Server configurations for different environments
 *   <li>Contact information and licensing
 *   <li>Security requirements
 * </ul>
 */
@Configuration
public class OpenApiConfig {

  @Value("${app.version:1.0.0}")
  private String appVersion;

  @Value("${server.servlet.context-path:}")
  private String contextPath;

  /**
   * Configures the OpenAPI specification for the RCT API.
   *
   * @return OpenAPI configuration with comprehensive documentation
   */
  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .info(createApiInfo())
        .servers(createServers())
        .components(createComponents())
        .addSecurityItem(createSecurityRequirement());
  }

  private Info createApiInfo() {
    return new Info()
        .title("RemindCodeTyping API")
        .description(
            """
            ## RemindCodeTyping API Documentation

            This API provides endpoints for a typing practice application that helps users improve their coding skills through typing exercises.

            ### Features
            - **Authentication**: JWT-based authentication with refresh tokens
            - **Study Books**: Manage coding questions and explanations
            - **Typing Sessions**: Track typing practice sessions and statistics
            - **User Management**: User registration and profile management

            ### Authentication
            Most endpoints require authentication using a JWT Bearer token. Use the `/api/auth/login` endpoint to obtain a token.

            ### Error Handling
            All endpoints return standardized error responses with appropriate HTTP status codes and error messages.

            ### Rate Limiting
            API endpoints are rate-limited to prevent abuse. Check response headers for rate limit information.
            """)
        .version(appVersion)
        .contact(
            new Contact()
                .name("RCT Development Team")
                .email("support@remindcodetyping.com")
                .url("https://github.com/remindcodetyping/rct"))
        .license(new License().name("MIT License").url("https://opensource.org/licenses/MIT"));
  }

  private List<Server> createServers() {
    return List.of(
        new Server()
            .url("http://localhost:8080" + contextPath)
            .description("Local development server"),
        new Server()
            .url("https://api-staging.remindcodetyping.com" + contextPath)
            .description("Staging server"),
        new Server()
            .url("https://api.remindcodetyping.com" + contextPath)
            .description("Production server"));
  }

  private Components createComponents() {
    return new Components()
        .addSecuritySchemes(
            "bearerAuth",
            new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description(
                    """
                    JWT Bearer token authentication.

                    To authenticate:
                    1. Login using `/api/auth/login` to get an access token
                    2. Include the token in the Authorization header: `Bearer <token>`
                    3. Tokens expire after 1 hour - use `/api/auth/refresh` to get a new token
                    """));
  }

  private SecurityRequirement createSecurityRequirement() {
    return new SecurityRequirement().addList("bearerAuth");
  }
}
