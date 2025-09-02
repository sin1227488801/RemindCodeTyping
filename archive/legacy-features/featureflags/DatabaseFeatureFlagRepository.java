package com.rct.infrastructure.featureflags;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/** Database implementation of FeatureFlagRepository Requirements: 9.3 */
@Repository
public class DatabaseFeatureFlagRepository implements FeatureFlagRepository {

  private static final Logger logger = LoggerFactory.getLogger(DatabaseFeatureFlagRepository.class);

  private final JdbcTemplate jdbcTemplate;

  @Autowired
  public DatabaseFeatureFlagRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
    initializeTables();
  }

  @Override
  public FeatureFlagStatus getStatus(String flagKey) {
    try {
      String sql =
          """
                SELECT ff.flag_key, ff.description, ff.enabled, ff.rollout_percentage,
                       ff.last_modified, ff.last_modified_by,
                       COALESCE(uo.override_count, 0) as user_override_count
                FROM feature_flags ff
                LEFT JOIN (
                    SELECT flag_key, COUNT(*) as override_count
                    FROM feature_flag_user_overrides
                    GROUP BY flag_key
                ) uo ON ff.flag_key = uo.flag_key
                WHERE ff.flag_key = ?
                """;

      return jdbcTemplate.queryForObject(sql, new FeatureFlagStatusRowMapper(), flagKey);

    } catch (EmptyResultDataAccessException e) {
      logger.debug("Feature flag not found: {}", flagKey);
      return null;
    }
  }

  @Override
  public Map<String, FeatureFlagStatus> getAllStatuses() {
    String sql =
        """
            SELECT ff.flag_key, ff.description, ff.enabled, ff.rollout_percentage,
                   ff.last_modified, ff.last_modified_by,
                   COALESCE(uo.override_count, 0) as user_override_count
            FROM feature_flags ff
            LEFT JOIN (
                SELECT flag_key, COUNT(*) as override_count
                FROM feature_flag_user_overrides
                GROUP BY flag_key
            ) uo ON ff.flag_key = uo.flag_key
            ORDER BY ff.flag_key
            """;

    List<FeatureFlagStatus> statuses = jdbcTemplate.query(sql, new FeatureFlagStatusRowMapper());

    Map<String, FeatureFlagStatus> statusMap = new HashMap<>();
    for (FeatureFlagStatus status : statuses) {
      statusMap.put(status.getKey(), status);
    }

    return statusMap;
  }

  @Override
  public void createFlag(
      String flagKey, String description, boolean enabled, double rolloutPercentage) {
    String sql =
        """
            INSERT INTO feature_flags (flag_key, description, enabled, rollout_percentage,
                                     last_modified, last_modified_by)
            VALUES (?, ?, ?, ?, ?, ?)
            """;

    jdbcTemplate.update(
        sql,
        flagKey,
        description,
        enabled,
        rolloutPercentage,
        LocalDateTime.now(),
        getCurrentUser());

    logger.info("Created feature flag: {} = {} ({}%)", flagKey, enabled, rolloutPercentage);
  }

  @Override
  public void updateFlag(String flagKey, boolean enabled, double rolloutPercentage) {
    String sql =
        """
            UPDATE feature_flags
            SET enabled = ?, rollout_percentage = ?, last_modified = ?, last_modified_by = ?
            WHERE flag_key = ?
            """;

    int updated =
        jdbcTemplate.update(
            sql, enabled, rolloutPercentage, LocalDateTime.now(), getCurrentUser(), flagKey);

    if (updated == 0) {
      throw new IllegalArgumentException("Feature flag not found: " + flagKey);
    }

    logger.info("Updated feature flag: {} = {} ({}%)", flagKey, enabled, rolloutPercentage);
  }

  @Override
  public void updateRolloutPercentage(String flagKey, double rolloutPercentage) {
    String sql =
        """
            UPDATE feature_flags
            SET rollout_percentage = ?, last_modified = ?, last_modified_by = ?
            WHERE flag_key = ?
            """;

    int updated =
        jdbcTemplate.update(sql, rolloutPercentage, LocalDateTime.now(), getCurrentUser(), flagKey);

    if (updated == 0) {
      throw new IllegalArgumentException("Feature flag not found: " + flagKey);
    }

    logger.info("Updated rollout percentage for {}: {}%", flagKey, rolloutPercentage);
  }

  @Override
  public void addUserOverride(String flagKey, String userId, boolean enabled) {
    // First, remove any existing override
    removeUserOverride(flagKey, userId);

    String sql =
        """
            INSERT INTO feature_flag_user_overrides (flag_key, user_id, enabled, created_at, created_by)
            VALUES (?, ?, ?, ?, ?)
            """;

    jdbcTemplate.update(sql, flagKey, userId, enabled, LocalDateTime.now(), getCurrentUser());

    logger.info("Added user override: {} for user {} = {}", flagKey, userId, enabled);
  }

  @Override
  public void removeUserOverride(String flagKey, String userId) {
    String sql = "DELETE FROM feature_flag_user_overrides WHERE flag_key = ? AND user_id = ?";

    int deleted = jdbcTemplate.update(sql, flagKey, userId);

    if (deleted > 0) {
      logger.info("Removed user override: {} for user {}", flagKey, userId);
    }
  }

  @Override
  public Boolean getUserOverride(String flagKey, String userId) {
    try {
      String sql =
          "SELECT enabled FROM feature_flag_user_overrides WHERE flag_key = ? AND user_id = ?";
      return jdbcTemplate.queryForObject(sql, Boolean.class, flagKey, userId);
    } catch (EmptyResultDataAccessException e) {
      return null;
    }
  }

  @Override
  public void logRollback(String flagKey, String reason) {
    String sql =
        """
            INSERT INTO feature_flag_rollback_log (flag_key, reason, rollback_time, rollback_by)
            VALUES (?, ?, ?, ?)
            """;

    jdbcTemplate.update(sql, flagKey, reason, LocalDateTime.now(), getCurrentUser());

    logger.warn("Logged rollback for {}: {}", flagKey, reason);
  }

  @Override
  public void deleteFlag(String flagKey) {
    // Delete user overrides first
    jdbcTemplate.update("DELETE FROM feature_flag_user_overrides WHERE flag_key = ?", flagKey);

    // Delete the flag
    String sql = "DELETE FROM feature_flags WHERE flag_key = ?";
    int deleted = jdbcTemplate.update(sql, flagKey);

    if (deleted == 0) {
      throw new IllegalArgumentException("Feature flag not found: " + flagKey);
    }

    logger.warn("Deleted feature flag: {}", flagKey);
  }

  private void initializeTables() {
    // Create feature_flags table if it doesn't exist
    String createFlagsTable =
        """
            CREATE TABLE IF NOT EXISTS feature_flags (
                flag_key VARCHAR(255) PRIMARY KEY,
                description TEXT,
                enabled BOOLEAN NOT NULL DEFAULT FALSE,
                rollout_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
                last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_modified_by VARCHAR(100),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_rollout_percentage CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
            )
            """;

    // Create user overrides table if it doesn't exist
    String createOverridesTable =
        """
            CREATE TABLE IF NOT EXISTS feature_flag_user_overrides (
                id SERIAL PRIMARY KEY,
                flag_key VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                enabled BOOLEAN NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100),
                UNIQUE(flag_key, user_id),
                FOREIGN KEY (flag_key) REFERENCES feature_flags(flag_key) ON DELETE CASCADE
            )
            """;

    // Create rollback log table if it doesn't exist
    String createRollbackTable =
        """
            CREATE TABLE IF NOT EXISTS feature_flag_rollback_log (
                id SERIAL PRIMARY KEY,
                flag_key VARCHAR(255) NOT NULL,
                reason TEXT,
                rollback_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                rollback_by VARCHAR(100)
            )
            """;

    try {
      jdbcTemplate.execute(createFlagsTable);
      jdbcTemplate.execute(createOverridesTable);
      jdbcTemplate.execute(createRollbackTable);

      // Create indexes for performance
      jdbcTemplate.execute(
          "CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled)");
      jdbcTemplate.execute(
          "CREATE INDEX IF NOT EXISTS idx_user_overrides_user_id ON feature_flag_user_overrides(user_id)");
      jdbcTemplate.execute(
          "CREATE INDEX IF NOT EXISTS idx_rollback_log_flag_key ON feature_flag_rollback_log(flag_key)");

      logger.info("Feature flag tables initialized successfully");

    } catch (Exception e) {
      logger.error("Failed to initialize feature flag tables", e);
    }
  }

  private String getCurrentUser() {
    // In a real application, this would get the current authenticated user
    // For now, return a system identifier
    return "system";
  }

  private static class FeatureFlagStatusRowMapper implements RowMapper<FeatureFlagStatus> {
    @Override
    public FeatureFlagStatus mapRow(ResultSet rs, int rowNum) throws SQLException {
      return new FeatureFlagStatus(
          rs.getString("flag_key"),
          rs.getString("description"),
          rs.getBoolean("enabled"),
          rs.getDouble("rollout_percentage"),
          rs.getTimestamp("last_modified").toLocalDateTime(),
          rs.getString("last_modified_by"),
          rs.getInt("user_override_count"));
    }
  }
}
