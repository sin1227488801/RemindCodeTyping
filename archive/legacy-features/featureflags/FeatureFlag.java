package com.rct.infrastructure.featureflags;

/**
 * Enumeration of all feature flags in the system Used for gradual rollout of refactored components
 * Requirements: 9.3
 */
public enum FeatureFlag {

  // Authentication and User Management
  NEW_JWT_AUTHENTICATION("new-jwt-authentication", "Use new JWT authentication system", false),
  NEW_USER_DOMAIN_MODEL("new-user-domain-model", "Use new User domain model", false),
  NEW_PASSWORD_SERVICE(
      "new-password-service", "Use new password service with enhanced security", false),

  // Study Book Management
  NEW_STUDYBOOK_DOMAIN_MODEL("new-studybook-domain-model", "Use new StudyBook domain model", false),
  NEW_STUDYBOOK_REPOSITORY(
      "new-studybook-repository", "Use new StudyBook repository implementation", false),
  NEW_STUDYBOOK_VALIDATION("new-studybook-validation", "Use new StudyBook validation rules", false),

  // Typing Session Management
  NEW_TYPING_SESSION_MODEL("new-typing-session-model", "Use new TypingSession domain model", false),
  NEW_TYPING_ACCURACY_CALCULATION(
      "new-typing-accuracy-calculation", "Use new accuracy calculation algorithm", false),
  NEW_TYPING_STATISTICS("new-typing-statistics", "Use new typing statistics service", false),

  // Database and Performance
  NEW_DATABASE_SCHEMA("new-database-schema", "Use new normalized database schema", false),
  OPTIMIZED_QUERIES("optimized-queries", "Use optimized database queries", false),
  QUERY_CACHING("query-caching", "Enable query result caching", false),

  // API and Controllers
  NEW_REST_CONTROLLERS("new-rest-controllers", "Use refactored REST controllers", false),
  NEW_ERROR_HANDLING("new-error-handling", "Use new global error handling", false),
  NEW_VALIDATION_FRAMEWORK("new-validation-framework", "Use new input validation framework", false),

  // Frontend Integration
  NEW_API_RESPONSES("new-api-responses", "Use new API response format", false),
  ENHANCED_CORS_CONFIG("enhanced-cors-config", "Use enhanced CORS configuration", false),

  // Monitoring and Observability
  ENHANCED_LOGGING("enhanced-logging", "Use enhanced structured logging", false),
  APPLICATION_METRICS("application-metrics", "Enable application metrics collection", false),
  HEALTH_CHECKS("health-checks", "Enable comprehensive health checks", false),

  // Security Enhancements
  ENHANCED_INPUT_SANITIZATION(
      "enhanced-input-sanitization", "Use enhanced input sanitization", false),
  SECURITY_HEADERS("security-headers", "Enable security headers", false),
  RATE_LIMITING("rate-limiting", "Enable API rate limiting", false),

  // Performance Optimizations
  LAZY_LOADING("lazy-loading", "Enable lazy loading for large datasets", false),
  ASYNC_PROCESSING("async-processing", "Enable asynchronous processing", false),
  CONNECTION_POOLING("connection-pooling", "Use optimized connection pooling", false);

  private final String key;
  private final String description;
  private final boolean defaultValue;

  FeatureFlag(String key, String description, boolean defaultValue) {
    this.key = key;
    this.description = description;
    this.defaultValue = defaultValue;
  }

  public String getKey() {
    return key;
  }

  public String getDescription() {
    return description;
  }

  public boolean getDefaultValue() {
    return defaultValue;
  }

  /** Get feature flag by key */
  public static FeatureFlag fromKey(String key) {
    for (FeatureFlag flag : values()) {
      if (flag.getKey().equals(key)) {
        return flag;
      }
    }
    throw new IllegalArgumentException("Unknown feature flag key: " + key);
  }
}
