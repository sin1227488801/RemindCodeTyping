package com.rct.presentation.validation;

import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

/** Utility class for sanitizing user input to prevent security vulnerabilities. */
@Component
public class InputSanitizer {

  private static final Pattern SQL_INJECTION_PATTERN =
      Pattern.compile(
          "(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)",
          Pattern.CASE_INSENSITIVE);

  private static final Pattern XSS_PATTERN =
      Pattern.compile(
          "(?i)<script[^>]*>.*?</script>|javascript:|vbscript:|onload=|onerror=|onclick=|onmouseover=",
          Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

  /**
   * Sanitizes HTML content by removing potentially dangerous elements and attributes.
   *
   * @param input the input string to sanitize
   * @return sanitized string with dangerous HTML removed
   */
  public String sanitizeHtml(String input) {
    if (input == null) {
      return null;
    }

    // Use Jsoup with a basic safelist that allows common formatting
    return Jsoup.clean(input, Safelist.basic());
  }

  /**
   * Sanitizes text content by removing HTML tags completely.
   *
   * @param input the input string to sanitize
   * @return plain text with all HTML tags removed
   */
  public String sanitizeText(String input) {
    if (input == null) {
      return null;
    }

    // Remove all HTML tags
    return Jsoup.clean(input, Safelist.none());
  }

  /**
   * Sanitizes input to prevent SQL injection attacks.
   *
   * @param input the input string to sanitize
   * @return sanitized string with SQL injection patterns removed
   */
  public String sanitizeSql(String input) {
    if (input == null) {
      return null;
    }

    // Remove common SQL injection patterns
    String sanitized = SQL_INJECTION_PATTERN.matcher(input).replaceAll("");

    // Remove dangerous characters
    sanitized = sanitized.replaceAll("[';\"\\-\\-]", "");

    return sanitized.trim();
  }

  /**
   * Sanitizes input to prevent XSS attacks.
   *
   * @param input the input string to sanitize
   * @return sanitized string with XSS patterns removed
   */
  public String sanitizeXss(String input) {
    if (input == null) {
      return null;
    }

    // Remove XSS patterns
    String sanitized = XSS_PATTERN.matcher(input).replaceAll("");

    // HTML encode dangerous characters
    sanitized =
        sanitized
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
            .replace("/", "&#x2F;");

    return sanitized;
  }

  /**
   * Comprehensive sanitization that applies multiple sanitization methods.
   *
   * @param input the input string to sanitize
   * @return fully sanitized string
   */
  public String sanitizeComprehensive(String input) {
    if (input == null) {
      return null;
    }

    String sanitized = input;

    // Apply all sanitization methods
    sanitized = sanitizeXss(sanitized);
    sanitized = sanitizeSql(sanitized);
    sanitized = sanitizeHtml(sanitized);

    return sanitized.trim();
  }

  /**
   * Validates that input doesn't contain potentially dangerous patterns.
   *
   * @param input the input string to validate
   * @return true if input is safe, false otherwise
   */
  public boolean isSafeInput(String input) {
    if (input == null) {
      return true;
    }

    // Check for SQL injection patterns
    if (SQL_INJECTION_PATTERN.matcher(input).find()) {
      return false;
    }

    // Check for XSS patterns
    if (XSS_PATTERN.matcher(input).find()) {
      return false;
    }

    return true;
  }

  /**
   * Sanitizes file names to prevent directory traversal attacks.
   *
   * @param fileName the file name to sanitize
   * @return sanitized file name
   */
  public String sanitizeFileName(String fileName) {
    if (fileName == null) {
      return null;
    }

    // Remove path traversal patterns
    String sanitized = fileName.replaceAll("\\.\\./", "");
    sanitized = sanitized.replaceAll("\\.\\.\\\\", "");

    // Remove dangerous characters
    sanitized = sanitized.replaceAll("[<>:\"|?*]", "");

    // Limit length
    if (sanitized.length() > 255) {
      sanitized = sanitized.substring(0, 255);
    }

    return sanitized.trim();
  }
}
