package com.rct.presentation.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Unit tests for SecurityValidator. */
class SecurityValidatorTest {

  private SecurityValidator securityValidator;

  @BeforeEach
  void setUp() {
    securityValidator = new SecurityValidator();
  }

  @Test
  void shouldDetectSqlInjectionPatterns() {
    // SQL injection attempts
    assertThat(securityValidator.containsSqlInjection("'; DROP TABLE users; --")).isTrue();
    assertThat(securityValidator.containsSqlInjection("1' OR '1'='1")).isTrue();
    assertThat(securityValidator.containsSqlInjection("UNION SELECT * FROM passwords")).isTrue();
    assertThat(securityValidator.containsSqlInjection("admin'--")).isTrue();
    assertThat(securityValidator.containsSqlInjection("' OR 1=1 --")).isTrue();

    // Safe inputs
    assertThat(securityValidator.containsSqlInjection("normal text")).isFalse();
    assertThat(securityValidator.containsSqlInjection("user123")).isFalse();
    assertThat(securityValidator.containsSqlInjection("")).isFalse();
    assertThat(securityValidator.containsSqlInjection(null)).isFalse();
  }

  @Test
  void shouldDetectXssPatterns() {
    // XSS attempts
    assertThat(securityValidator.containsXss("<script>alert('xss')</script>")).isTrue();
    assertThat(securityValidator.containsXss("javascript:alert('xss')")).isTrue();
    assertThat(securityValidator.containsXss("<img src=x onerror=alert('xss')>")).isTrue();
    assertThat(securityValidator.containsXss("onload=alert('xss')")).isTrue();
    assertThat(securityValidator.containsXss("<iframe src='javascript:alert(1)'></iframe>"))
        .isTrue();

    // Safe inputs
    assertThat(securityValidator.containsXss("normal text")).isFalse();
    assertThat(securityValidator.containsXss("Hello <b>world</b>"))
        .isFalse(); // Basic HTML is not flagged
    assertThat(securityValidator.containsXss("")).isFalse();
    assertThat(securityValidator.containsXss(null)).isFalse();
  }

  @Test
  void shouldDetectPathTraversalPatterns() {
    // Path traversal attempts
    assertThat(securityValidator.containsPathTraversal("../../../etc/passwd")).isTrue();
    assertThat(securityValidator.containsPathTraversal("..\\..\\windows\\system32")).isTrue();
    assertThat(securityValidator.containsPathTraversal("%2e%2e%2f")).isTrue();
    assertThat(securityValidator.containsPathTraversal("....//")).isTrue();

    // Safe paths
    assertThat(securityValidator.containsPathTraversal("/api/users")).isFalse();
    assertThat(securityValidator.containsPathTraversal("normal/path")).isFalse();
    assertThat(securityValidator.containsPathTraversal("")).isFalse();
    assertThat(securityValidator.containsPathTraversal(null)).isFalse();
  }

  @Test
  void shouldDetectCommandInjectionPatterns() {
    // Command injection attempts
    assertThat(securityValidator.containsCommandInjection("; rm -rf /")).isTrue();
    assertThat(securityValidator.containsCommandInjection("| cat /etc/passwd")).isTrue();
    assertThat(securityValidator.containsCommandInjection("$(whoami)")).isTrue();
    assertThat(securityValidator.containsCommandInjection("&& echo 'hacked'")).isTrue();
    assertThat(securityValidator.containsCommandInjection("`id`")).isTrue();

    // Safe inputs
    assertThat(securityValidator.containsCommandInjection("normal text")).isFalse();
    assertThat(securityValidator.containsCommandInjection("user@domain.com")).isFalse();
    assertThat(securityValidator.containsCommandInjection("")).isFalse();
    assertThat(securityValidator.containsCommandInjection(null)).isFalse();
  }

  @Test
  void shouldDetectLdapInjectionPatterns() {
    // LDAP injection attempts
    assertThat(securityValidator.containsLdapInjection("*)(uid=*))(|(uid=*")).isTrue();
    assertThat(securityValidator.containsLdapInjection("admin)(&(password=*))")).isTrue();
    assertThat(securityValidator.containsLdapInjection("*")).isTrue();

    // Safe inputs
    assertThat(securityValidator.containsLdapInjection("normal text")).isFalse();
    assertThat(securityValidator.containsLdapInjection("user123")).isFalse();
    assertThat(securityValidator.containsLdapInjection("")).isFalse();
    assertThat(securityValidator.containsLdapInjection(null)).isFalse();
  }

  @Test
  void shouldDetectNoSqlInjectionPatterns() {
    // NoSQL injection attempts
    assertThat(securityValidator.containsNoSqlInjection("$where: function() { return true; }"))
        .isTrue();
    assertThat(securityValidator.containsNoSqlInjection("{$ne: null}")).isTrue();
    assertThat(securityValidator.containsNoSqlInjection("$regex")).isTrue();
    assertThat(securityValidator.containsNoSqlInjection("javascript:")).isTrue();

    // Safe inputs
    assertThat(securityValidator.containsNoSqlInjection("normal text")).isFalse();
    assertThat(securityValidator.containsNoSqlInjection("user123")).isFalse();
    assertThat(securityValidator.containsNoSqlInjection("")).isFalse();
    assertThat(securityValidator.containsNoSqlInjection(null)).isFalse();
  }

  @Test
  void shouldValidateSafeInputComprehensively() {
    // Safe inputs
    assertThat(securityValidator.isSafeInput("normal text")).isTrue();
    assertThat(securityValidator.isSafeInput("user123")).isTrue();
    assertThat(securityValidator.isSafeInput("Hello World!")).isTrue();
    assertThat(securityValidator.isSafeInput("")).isTrue();
    assertThat(securityValidator.isSafeInput(null)).isTrue();

    // Unsafe inputs
    assertThat(securityValidator.isSafeInput("'; DROP TABLE users; --")).isFalse();
    assertThat(securityValidator.isSafeInput("<script>alert('xss')</script>")).isFalse();
    assertThat(securityValidator.isSafeInput("../../../etc/passwd")).isFalse();
    assertThat(securityValidator.isSafeInput("; rm -rf /")).isFalse();
  }

  @ParameterizedTest
  @ValueSource(strings = {"user@example.com", "test.email+tag@domain.co.uk", "simple@test.org"})
  void shouldValidateValidEmails(String email) {
    assertThat(securityValidator.isValidEmail(email)).isTrue();
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "invalid-email",
        "@domain.com",
        "user@",
        "user@domain",
        "javascript:alert('xss')@domain.com",
        "<script>@domain.com"
      })
  void shouldRejectInvalidEmails(String email) {
    assertThat(securityValidator.isValidEmail(email)).isFalse();
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "https://example.com",
        "http://test.org/path",
        "https://subdomain.example.com/path/to/resource"
      })
  void shouldValidateValidUrls(String url) {
    assertThat(securityValidator.isValidUrl(url)).isTrue();
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "ftp://example.com",
        "javascript:alert('xss')",
        "data:text/html,<script>alert('xss')</script>",
        "http://",
        "not-a-url"
      })
  void shouldRejectInvalidUrls(String url) {
    assertThat(securityValidator.isValidUrl(url)).isFalse();
  }

  @Test
  void shouldValidateInputLength() {
    assertThat(securityValidator.isValidLength("short", 10)).isTrue();
    assertThat(securityValidator.isValidLength("exactly10!", 10)).isTrue();
    assertThat(securityValidator.isValidLength("this is too long", 10)).isFalse();
    assertThat(securityValidator.isValidLength(null, 10)).isTrue();
    assertThat(securityValidator.isValidLength("", 10)).isTrue();
  }
}
