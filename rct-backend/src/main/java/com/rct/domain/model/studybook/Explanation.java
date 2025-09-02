package com.rct.domain.model.studybook;

import java.util.Objects;

/**
 * Value object representing an explanation for a study book question. Provides additional context
 * or hints for the coding problem.
 */
public final class Explanation {
  private final String content;

  public Explanation(String content) {
    this.content = content; // Can be null or empty for optional explanations
  }

  /**
   * Validates the explanation content. Business rules: - If present, explanation should not exceed
   * maximum length - No special validation required as explanations are optional
   */
  public void validate() {
    if (content != null && content.length() > 2000) {
      throw new IllegalArgumentException("Explanation cannot exceed 2000 characters");
    }
  }

  /** Checks if the explanation has content. */
  public boolean hasContent() {
    return content != null && !content.trim().isEmpty();
  }

  /** Gets the explanation content, or empty string if null. */
  public String getContent() {
    return content != null ? content : "";
  }

  /** Gets the raw content (can be null). */
  public String getRawContent() {
    return content;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    Explanation that = (Explanation) obj;
    return Objects.equals(content, that.content);
  }

  @Override
  public int hashCode() {
    return Objects.hash(content);
  }

  @Override
  public String toString() {
    return String.format(
        "Explanation{content='%s'}",
        content != null
            ? (content.length() > 50 ? content.substring(0, 50) + "..." : content)
            : "null");
  }
}
