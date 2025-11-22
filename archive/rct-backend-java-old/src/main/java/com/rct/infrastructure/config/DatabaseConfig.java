package com.rct.infrastructure.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/** Database configuration with optimized connection pooling and environment-specific settings. */
@Configuration
@EnableConfigurationProperties({ApplicationProperties.class, EnvironmentConfig.class})
public class DatabaseConfig {

  private final ApplicationProperties applicationProperties;
  private final EnvironmentConfig environmentConfig;

  public DatabaseConfig(
      ApplicationProperties applicationProperties, EnvironmentConfig environmentConfig) {
    this.applicationProperties = applicationProperties;
    this.environmentConfig = environmentConfig;
  }

  /**
   * Configures HikariCP connection pool for production environments. Only active when not using the
   * default Spring Boot datasource configuration.
   */
  @Bean
  @Primary
  @ConditionalOnProperty(name = "app.database.use-custom-pool", havingValue = "true")
  public DataSource customDataSource() {
    var dbProps = applicationProperties.database();

    HikariConfig config = new HikariConfig();

    // Connection pool settings
    config.setMaximumPoolSize(dbProps.connectionPoolSize());
    config.setMinimumIdle(Math.max(1, dbProps.connectionPoolSize() / 4));
    config.setConnectionTimeout(dbProps.connectionTimeout().toMillis());
    config.setIdleTimeout(dbProps.idleTimeout().toMillis());
    config.setMaxLifetime(dbProps.maxLifetime().toMillis());

    // Performance optimizations
    config.setLeakDetectionThreshold(60000); // 60 seconds
    config.setPoolName("RCT-HikariCP");

    // Environment-specific settings
    if (environmentConfig.isProduction()) {
      // Production optimizations
      config.addDataSourceProperty("cachePrepStmts", "true");
      config.addDataSourceProperty("prepStmtCacheSize", "250");
      config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
      config.addDataSourceProperty("useServerPrepStmts", "true");
      config.addDataSourceProperty("useLocalSessionState", "true");
      config.addDataSourceProperty("rewriteBatchedStatements", "true");
      config.addDataSourceProperty("cacheResultSetMetadata", "true");
      config.addDataSourceProperty("cacheServerConfiguration", "true");
      config.addDataSourceProperty("elideSetAutoCommits", "true");
      config.addDataSourceProperty("maintainTimeStats", "false");
    } else {
      // Development settings for better debugging
      config.addDataSourceProperty("logger", "com.mysql.cj.log.Slf4JLogger");
      config.addDataSourceProperty("profileSQL", "true");
    }

    return new HikariDataSource(config);
  }
}
