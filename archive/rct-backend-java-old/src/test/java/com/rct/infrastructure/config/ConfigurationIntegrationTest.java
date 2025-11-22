package com.rct.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(
    properties = {
      "app.environment.name=test",
      "app.environment.production=false",
      "app.environment.debug-enabled=true",
      "app.environment.version=1.0.0-TEST",
      "app.environment.build-timestamp=2024-01-01T00:00:00Z",
      "app.jwt.secret=test-secret-key-with-sufficient-length-for-testing-purposes",
      "app.jwt.expiration=PT30M",
      "app.jwt.issuer=test-issuer",
      "app.jwt.audience=test-audience",
      "app.cors.allowed-origins=http://localhost:3000,http://localhost:8080",
      "app.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS",
      "app.cors.allowed-headers=*",
      "app.cors.allow-credentials=true",
      "app.cors.max-age=PT1H",
      "app.security.password-min-length=8",
      "app.security.password-max-length=128",
      "app.security.max-login-attempts=3",
      "app.security.lockout-duration=PT1M",
      "app.security.require-strong-password=true",
      "app.database.connection-pool-size=5",
      "app.database.connection-timeout=PT30S",
      "app.database.idle-timeout=PT10M",
      "app.database.max-lifetime=PT30M",
      "app.database.show-sql=true"
    })
class ConfigurationIntegrationTest {

  @Autowired private ApplicationProperties applicationProperties;

  @Autowired private EnvironmentConfig environmentConfig;

  @Test
  void shouldLoadApplicationPropertiesCorrectly() {
    // JWT properties
    assertThat(applicationProperties.jwt().secret())
        .isEqualTo("test-secret-key-with-sufficient-length-for-testing-purposes");
    assertThat(applicationProperties.jwt().expiration()).isEqualTo(Duration.ofMinutes(30));
    assertThat(applicationProperties.jwt().issuer()).isEqualTo("test-issuer");
    assertThat(applicationProperties.jwt().audience()).isEqualTo("test-audience");

    // CORS properties
    assertThat(applicationProperties.cors().allowedOrigins())
        .containsExactly("http://localhost:3000", "http://localhost:8080");
    assertThat(applicationProperties.cors().allowedMethods())
        .containsExactly("GET", "POST", "PUT", "DELETE", "OPTIONS");
    assertThat(applicationProperties.cors().allowedHeaders()).containsExactly("*");
    assertThat(applicationProperties.cors().allowCredentials()).isTrue();
    assertThat(applicationProperties.cors().maxAge()).isEqualTo(Duration.ofHours(1));

    // Security properties
    assertThat(applicationProperties.security().passwordMinLength()).isEqualTo(8);
    assertThat(applicationProperties.security().passwordMaxLength()).isEqualTo(128);
    assertThat(applicationProperties.security().maxLoginAttempts()).isEqualTo(3);
    assertThat(applicationProperties.security().lockoutDuration()).isEqualTo(Duration.ofMinutes(1));
    assertThat(applicationProperties.security().requireStrongPassword()).isTrue();

    // Database properties
    assertThat(applicationProperties.database().connectionPoolSize()).isEqualTo(5);
    assertThat(applicationProperties.database().connectionTimeout())
        .isEqualTo(Duration.ofSeconds(30));
    assertThat(applicationProperties.database().idleTimeout()).isEqualTo(Duration.ofMinutes(10));
    assertThat(applicationProperties.database().maxLifetime()).isEqualTo(Duration.ofMinutes(30));
    assertThat(applicationProperties.database().showSql()).isTrue();
  }

  @Test
  void shouldLoadEnvironmentConfigCorrectly() {
    assertThat(environmentConfig.name()).isEqualTo("test");
    assertThat(environmentConfig.production()).isFalse();
    assertThat(environmentConfig.debugEnabled()).isTrue();
    assertThat(environmentConfig.version()).isEqualTo("1.0.0-TEST");
    assertThat(environmentConfig.buildTimestamp()).isEqualTo("2024-01-01T00:00:00Z");

    // Test convenience methods
    assertThat(environmentConfig.isProduction()).isFalse();
    assertThat(environmentConfig.isDevelopment()).isFalse();
    assertThat(environmentConfig.isStaging()).isFalse();
    assertThat(environmentConfig.isDebugEnabled()).isTrue();
  }
}
