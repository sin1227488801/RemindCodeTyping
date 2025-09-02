package com.rct.domain.model.studybook;

import java.util.Objects;

/**
 * Value object representing a coding question or problem statement. Contains the actual content
 * that users need to type.
 */
public final class Question {
  private final String content;

  public Question(String content) {
    if (content == null || content.trim().isEmpty()) {
      throw new IllegalArgumentException("Question content cannot be null or empty");
    }
    this.content = content;
    validate();
  }

  /**
   * Validates the question content. Business rules: - Content must be at least 10 characters long -
   * Content cannot exceed 5000 characters
   */
  public void validate() {
    if (content.length() < 10) {
      throw new IllegalArgumentException("Question content must be at least 10 characters long");
    }
    if (content.length() > 5000) {
      throw new IllegalArgumentException("Question content cannot exceed 5000 characters");
    }
  }

  /** Returns the question content. */
  public String getContent() {
    return content;
  }

  /** Returns the length of the question content. */
  public int getLength() {
    return content.length();
  }

  /** Checks if the question contains code patterns. */
  public boolean containsCode() {
    return content.contains("{")
        || content.contains("}")
        || content.contains("function")
        || content.contains("class")
        || content.contains("public")
        || content.contains("private")
        || content.contains("if (")
        || content.contains("for (")
        || content.contains("import ")
        || content.contains("const ")
        || content.contains("var ")
        || content.contains("let ");
  }

  /** Checks if the question spans multiple lines. */
  public boolean isMultiline() {
    return content.contains("\n");
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    Question question = (Question) obj;
    return Objects.equals(content, question.content);
  }

  @Override
  public int hashCode() {
    return Objects.hash(content);
  }

  @Override
  public String toString() {
    String displayContent = content.length() > 100 ? content.substring(0, 100) + "..." : content;
    return String.format("Question{content='%s'}", displayContent);
  }
}
