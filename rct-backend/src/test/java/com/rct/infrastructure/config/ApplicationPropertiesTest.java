package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySource;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

class ApplicationPropertiesTest {

  @Test
  void shouldBindApplicationPropertiesFromConfiguration() {
    // Given
    Map<String, Object> properties =
        Map.of(
            "app.jwt.secret",
            "test-secret-key-with-sufficient-length-for-security",
            "app.jwt.expiration",
            "PT30M",
            "app.jwt.issuer",
            "test-issuer",
            "app.jwt.audience",
            "test-audience",
            "app.cors.allowed-origins",
            List.of("http://localhost:3000", "http://localhost:8080"),
            "app.cors.allowed-methods",
            List.of("GET", "POST", "PUT", "DELETE"),
            "app.cors.allowed-headers",
            List.of("*"),
            "app.cors.allow-credentials",
            true,
            "app.cors.max-age",
            "PT1H",
            "app.security.password-min-length",
            8,
            "app.security.password-max-length",
            128,
            "app.security.max-login-attempts",
            5,
            "app.security.lockout-duration",
            "PT15M",
            "app.security.require-strong-password",
            true,
            "app.database.connection-pool-size",
            10,
            "app.database.connection-timeout",
            "PT30S",
            "app.database.idle-timeout",
            "PT10M",
            "app.database.max-lifetime",
            "PT30M",
            "app.database.show-sql",
            false);

    ConfigurationPropertySource source = new MapConfigurationPropertySource(properties);
    Binder binder = new Binder(source);

    // When
    ApplicationProperties result = binder.bind("app", ApplicationProperties.class).get();

    // Then
    assertThat(result).isNotNull();

    // JWT properties
    assertThat(result.jwt().secret())
        .isEqualTo("test-secret-key-with-sufficient-length-for-security");
    assertThat(result.jwt().expiration()).isEqualTo(Duration.ofMinutes(30));
    assertThat(result.jwt().issuer()).isEqualTo("test-issuer");
    assertThat(result.jwt().audience()).isEqualTo("test-audience");

    // CORS properties
    assertThat(result.cors().allowedOrigins())
        .containsExactly("http://localhost:3000", "http://localhost:8080");
    assertThat(result.cors().allowedMethods()).containsExactly("GET", "POST", "PUT", "DELETE");
    assertThat(result.cors().allowedHeaders()).containsExactly("*");
    assertThat(result.cors().allowCredentials()).isTrue();
    assertThat(result.cors().maxAge()).isEqualTo(Duration.ofHours(1));

    // Security properties
    assertThat(result.security().passwordMinLength()).isEqualTo(8);
    assertThat(result.security().passwordMaxLength()).isEqualTo(128);
    assertThat(result.security().maxLoginAttempts()).isEqualTo(5);
    assertThat(result.security().lockoutDuration()).isEqualTo(Duration.ofMinutes(15));
    assertThat(result.security().requireStrongPassword()).isTrue();

    // Database properties
    assertThat(result.database().connectionPoolSize()).isEqualTo(10);
    assertThat(result.database().connectionTimeout()).isEqualTo(Duration.ofSeconds(30));
    assertThat(result.database().idleTimeout()).isEqualTo(Duration.ofMinutes(10));
    assertThat(result.database().maxLifetime()).isEqualTo(Duration.ofMinutes(30));
    assertThat(result.database().showSql()).isFalse();
  }
}
