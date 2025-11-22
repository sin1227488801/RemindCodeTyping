package com.rct.presentation.validation;

import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Security-focused validator for detecting and preventing various attack patterns. */
@Component
@Slf4j
public class SecurityValidator {

  // SQL Injection patterns
  private static final Pattern SQL_INJECTION_PATTERN =
      Pattern.compile(
          "(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute|truncate|"
              + "grant|revoke|declare|cast|convert|char|nchar|varchar|nvarchar|substring|"
              + "ascii|len|replace|reverse|stuff|patindex|charindex|quotename|"
              + "sp_executesql|xp_cmdshell|sp_configure|openrowset|opendatasource)",
          Pattern.CASE_INSENSITIVE);

  // XSS patterns
  private static final Pattern XSS_PATTERN =
      Pattern.compile(
          "(?i)(<script[^>]*>.*?</script>|javascript:|vbscript:|data:|"
              + "onload=|onerror=|onclick=|onmouseover=|onmouseout=|onfocus=|onblur=|"
              + "onchange=|onsubmit=|onreset=|onselect=|onunload=|onabort=|onkeydown=|"
              + "onkeypress=|onkeyup=|onmousedown=|onmouseup=|onmousemove=|"
              + "expression\\s*\\(|url\\s*\\(|@import|<iframe|<object|<embed|<applet|"
              + "<meta|<link|<style|<base|<form|<input|<textarea|<select|<option)",
          Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

  // Path traversal patterns
  private static final Pattern PATH_TRAVERSAL_PATTERN =
      Pattern.compile(
          "(\\.\\./|\\.\\.\\\\/|%2e%2e%2f|%2e%2e%5c|%252e%252e%252f|%252e%252e%255c|"
              + "\\.\\.%2f|\\.\\.%5c|%2e%2e/|%2e%2e\\\\)",
          Pattern.CASE_INSENSITIVE);

  // Command injection patterns
  private static final Pattern COMMAND_INJECTION_PATTERN =
      Pattern.compile(
          "(?i)(;|\\||&|`|\\$\\(|\\$\\{|<\\(|>\\(|\\|\\||&&|"
              + "cmd|command|exec|system|shell|bash|sh|powershell|"
              + "nc|netcat|wget|curl|ping|nslookup|dig|telnet|ssh)",
          Pattern.CASE_INSENSITIVE);

  // LDAP injection patterns
  private static final Pattern LDAP_INJECTION_PATTERN =
      Pattern.compile("[\\(\\)\\*\\\\\\x00/]", Pattern.CASE_INSENSITIVE);

  // NoSQL injection patterns
  private static final Pattern NOSQL_INJECTION_PATTERN =
      Pattern.compile(
          "(?i)(\\$where|\\$ne|\\$in|\\$nin|\\$gt|\\$gte|\\$lt|\\$lte|\\$regex|"
              + "\\$exists|\\$type|\\$mod|\\$all|\\$size|\\$elemMatch|"
              + "javascript|function\\s*\\(|eval\\s*\\()",
          Pattern.CASE_INSENSITIVE);

  /** Validates input against SQL injection patterns. */
  public boolean containsSqlInjection(String input) {
    if (input == null || input.trim().isEmpty()) {
      return false;
    }

    boolean detected = SQL_INJECTION_PATTERN.matcher(input).find();
    if (detected) {
      log.warn("SQL injection pattern detected in input: {}", sanitizeForLogging(input));
    }
    return detected;
  }

  /** Validates input against XSS patterns. */
  public boolean containsXss(String input) {
    if (input == null || input.trim().isEmpty()) {
      return false;
    }

    boolean detected = XSS_PATTERN.matcher(input).find();
    if (detected) {
      log.warn("XSS pattern detected in input: {}", sanitizeForLogging(input));
    }
    return detected;
  }

  /** Validates input against path traversal patterns. */
  public boolean containsPathTraversal(String input) {
    if (input == null || input.trim().isEmpty()) {
      return false;
    }

    boolean detected = PATH_TRAVERSAL_PATTERN.matcher(input).find();
    if (detected) {
      log.warn("Path traversal pattern detected in input: {}", sanitizeForLogging(input));
    }
    return detected;
  }

  /** Validates input against command injection patterns. */
  public boolean containsCommandInjection(String input) {
    if (input == null || input.trim().isEmpty()) {
      return false;
    }

    boolean detected = COMMAND_INJECTION_PATTERN.matcher(input).find();
    if (detected) {
      log.warn("Command injection pattern detected in input: {}", sanitizeForLogging(input));
    }
    return detected;
  }

  /** Validates input against LDAP injection patterns. */
  public boolean containsLdapInjection(String input) {
    if (input == null || input.trim().isEmpty()) {
      return false;
    }

    boolean detected = LDAP_INJECTION_PATTERN.matcher(input).find();
    if (detected) {
      log.warn("LDAP injection pattern detected in input: {}", sanitizeForLogging(input));
    }
    return detected;
  }

  /** Validates input against NoSQL injection patterns. */
  public boolean containsNoSqlInjection(String input) {
    if (input == null || input.trim().isEmpty()) {
      return false;
    }

    boolean detected = NOSQL_INJECTION_PATTERN.matcher(input).find();
    if (detected) {
      log.warn("NoSQL injection pattern detected in input: {}", sanitizeForLogging(input));
    }
    return detected;
  }

  /** Comprehensive security validation that checks for all known attack patterns. */
  public boolean isSafeInput(String input) {
    if (input == null || input.trim().isEmpty()) {
      return true;
    }

    return !containsSqlInjection(input)
        && !containsXss(input)
        && !containsPathTraversal(input)
        && !containsCommandInjection(input)
        && !containsLdapInjection(input)
        && !containsNoSqlInjection(input);
  }

  /** Validates that input length is within acceptable bounds. */
  public boolean isValidLength(String input, int maxLength) {
    if (input == null) {
      return true;
    }
    return input.length() <= maxLength;
  }

  /** Validates that input contains only allowed characters. */
  public boolean containsOnlyAllowedCharacters(String input, Pattern allowedPattern) {
    if (input == null || input.trim().isEmpty()) {
      return true;
    }
    return allowedPattern.matcher(input).matches();
  }

  /** Validates email format with security considerations. */
  public boolean isValidEmail(String email) {
    if (email == null || email.trim().isEmpty()) {
      return false;
    }

    // Basic email pattern that prevents common injection attempts
    Pattern emailPattern = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    return emailPattern.matcher(email).matches()
        && email.length() <= 254
        && // RFC 5321 limit
        isSafeInput(email);
  }

  /** Validates URL format with security considerations. */
  public boolean isValidUrl(String url) {
    if (url == null || url.trim().isEmpty()) {
      return false;
    }

    // Only allow HTTP and HTTPS protocols
    Pattern urlPattern = Pattern.compile("^https?://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(/.*)?$");

    return urlPattern.matcher(url).matches()
        && url.length() <= 2048
        && // Common URL length limit
        isSafeInput(url);
  }

  /** Sanitizes input for safe logging (prevents log injection). */
  private String sanitizeForLogging(String input) {
    if (input == null) {
      return "null";
    }

    // Truncate long inputs and remove line breaks to prevent log injection
    String sanitized = input.length() > 100 ? input.substring(0, 100) + "..." : input;
    return sanitized.replaceAll("[\r\n\t]", "_");
  }
}
