package com.rct.presentation.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Unit tests for InputSanitizer. Tests comprehensive input validation and sanitization. */
class InputSanitizerTest {

  private InputSanitizer inputSanitizer;

  @BeforeEach
  void setUp() {
    inputSanitizer = new InputSanitizer();
  }

  @Test
  @DisplayName("Should sanitize HTML content properly")
  void shouldSanitizeHtmlContentProperly() {
    String input = "<script>alert('xss')</script><p>Safe content</p>";
    String result = inputSanitizer.sanitizeHtml(input);

    assertThat(result).doesNotContain("<script>");
    assertThat(result).contains("Safe content");
  }

  @Test
  @DisplayName("Should remove all HTML tags from text")
  void shouldRemoveAllHtmlTagsFromText() {
    String input = "<div><p>Hello <strong>World</strong></p></div>";
    String result = inputSanitizer.sanitizeText(input);

    assertThat(result).isEqualTo("Hello World");
    assertThat(result).doesNotContain("<");
    assertThat(result).doesNotContain(">");
  }

  @Test
  @DisplayName("Should prevent SQL injection patterns")
  void shouldPreventSqlInjectionPatterns() {
    String input = "'; DROP TABLE users; --";
    String result = inputSanitizer.sanitizeSql(input);

    assertThat(result).doesNotContain("DROP");
    assertThat(result).doesNotContain("'");
    assertThat(result).doesNotContain(";");
    assertThat(result).doesNotContain("--");
  }

  @Test
  @DisplayName("Should prevent XSS attacks")
  void shouldPreventXssAttacks() {
    String input = "<script>alert('xss')</script>javascript:alert('xss')";
    String result = inputSanitizer.sanitizeXss(input);

    assertThat(result).doesNotContain("<script>");
    assertThat(result).doesNotContain("javascript:");
    assertThat(result).contains("&lt;");
    assertThat(result).contains("&gt;");
  }

  @Test
  @DisplayName("Should apply comprehensive sanitization")
  void shouldApplyComprehensiveSanitization() {
    String input = "<script>alert('xss')</script>'; DROP TABLE users; --<p>Safe content</p>";
    String result = inputSanitizer.sanitizeComprehensive(input);

    assertThat(result).doesNotContain("<script>");
    assertThat(result).doesNotContain("DROP");
    assertThat(result).doesNotContain("'");
    assertThat(result).contains("Safe content");
  }

  @Test
  @DisplayName("Should validate safe input correctly")
  void shouldValidateSafeInputCorrectly() {
    String safeInput = "This is safe content";
    String unsafeInput = "<script>alert('xss')</script>";

    assertThat(inputSanitizer.isSafeInput(safeInput)).isTrue();
    assertThat(inputSanitizer.isSafeInput(unsafeInput)).isFalse();
  }

  @Test
  @DisplayName("Should sanitize file names properly")
  void shouldSanitizeFileNamesProperly() {
    String input = "../../../etc/passwd";
    String result = inputSanitizer.sanitizeFileName(input);

    assertThat(result).doesNotContain("../");
    assertThat(result).isEqualTo("etcpasswd");
  }

  @Test
  @DisplayName("Should handle null input gracefully")
  void shouldHandleNullInputGracefully() {
    assertThat(inputSanitizer.sanitizeHtml(null)).isNull();
    assertThat(inputSanitizer.sanitizeText(null)).isNull();
    assertThat(inputSanitizer.sanitizeSql(null)).isNull();
    assertThat(inputSanitizer.sanitizeXss(null)).isNull();
    assertThat(inputSanitizer.sanitizeComprehensive(null)).isNull();
    assertThat(inputSanitizer.sanitizeFileName(null)).isNull();
    assertThat(inputSanitizer.isSafeInput(null)).isTrue();
  }

  @Test
  @DisplayName("Should handle empty input gracefully")
  void shouldHandleEmptyInputGracefully() {
    String empty = "";

    assertThat(inputSanitizer.sanitizeHtml(empty)).isEmpty();
    assertThat(inputSanitizer.sanitizeText(empty)).isEmpty();
    assertThat(inputSanitizer.sanitizeSql(empty)).isEmpty();
    assertThat(inputSanitizer.sanitizeXss(empty)).isEmpty();
    assertThat(inputSanitizer.sanitizeComprehensive(empty)).isEmpty();
    assertThat(inputSanitizer.sanitizeFileName(empty)).isEmpty();
    assertThat(inputSanitizer.isSafeInput(empty)).isTrue();
  }
}
