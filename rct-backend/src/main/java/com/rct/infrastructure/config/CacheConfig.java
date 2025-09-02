package com.rct.infrastructure.config;

import java.time.Duration;
import java.util.Arrays;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Cache configuration for optimizing database query performance. Provides different caching
 * strategies for different environments.
 */
@Configuration
@EnableCaching
public class CacheConfig {

  // Cache names for different types of data
  public static final String USER_STATISTICS_CACHE = "userStatistics";
  public static final String STUDY_BOOK_STATISTICS_CACHE = "studyBookStatistics";
  public static final String LANGUAGE_STATISTICS_CACHE = "languageStatistics";
  public static final String POPULAR_STUDY_BOOKS_CACHE = "popularStudyBooks";
  public static final String USER_PROGRESS_CACHE = "userProgress";
  public static final String SYSTEM_PROBLEMS_CACHE = "systemProblems";
  public static final String RANDOM_STUDY_BOOKS_CACHE = "randomStudyBooks";

  /**
   * Simple in-memory cache manager for development and testing. Uses ConcurrentHashMap for
   * thread-safe caching.
   */
  @Bean
  @Profile({"dev", "test"})
  public CacheManager simpleCacheManager() {
    ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
    cacheManager.setCacheNames(
        Arrays.asList(
            USER_STATISTICS_CACHE,
            STUDY_BOOK_STATISTICS_CACHE,
            LANGUAGE_STATISTICS_CACHE,
            POPULAR_STUDY_BOOKS_CACHE,
            USER_PROGRESS_CACHE,
            SYSTEM_PROBLEMS_CACHE,
            RANDOM_STUDY_BOOKS_CACHE));
    cacheManager.setAllowNullValues(false);
    return cacheManager;
  }

  /**
   * Production cache manager with more sophisticated caching. In a real production environment,
   * this would use Redis or Hazelcast.
   */
  @Bean
  @Profile("prod")
  public CacheManager productionCacheManager() {
    // For now, using the same simple cache manager
    // In production, this would be replaced with:
    // - Redis cache manager for distributed caching
    // - Hazelcast for in-memory data grid
    // - Caffeine for high-performance local caching
    return simpleCacheManager();
  }

  /** Cache configuration properties for different cache types. */
  public static class CacheProperties {

    // Short-term cache for frequently changing data (5 minutes)
    public static final Duration SHORT_TERM_TTL = Duration.ofMinutes(5);

    // Medium-term cache for moderately stable data (30 minutes)
    public static final Duration MEDIUM_TERM_TTL = Duration.ofMinutes(30);

    // Long-term cache for stable data (2 hours)
    public static final Duration LONG_TERM_TTL = Duration.ofHours(2);

    // Very long-term cache for rarely changing data (24 hours)
    public static final Duration VERY_LONG_TERM_TTL = Duration.ofHours(24);
  }

  /** Cache key generators for consistent cache key creation. */
  public static class CacheKeys {

    public static String userStatistics(String userId) {
      return "user_stats:" + userId;
    }

    public static String studyBookStatistics(String studyBookId) {
      return "studybook_stats:" + studyBookId;
    }

    public static String languageStatistics() {
      return "language_stats:all";
    }

    public static String popularStudyBooks(String language, int limit) {
      return "popular_books:" + language + ":" + limit;
    }

    public static String userProgress(String userId) {
      return "user_progress:" + userId;
    }

    public static String systemProblems(String language) {
      return "system_problems:" + (language != null ? language : "all");
    }

    public static String randomStudyBooks(String language, boolean includeSystem, int limit) {
      return "random_books:" + language + ":" + includeSystem + ":" + limit;
    }
  }
}
