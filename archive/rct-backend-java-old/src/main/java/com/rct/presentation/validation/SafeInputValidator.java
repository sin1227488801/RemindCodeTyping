package com.rct.presentation.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Validator for the @SafeInput annotation. */
@Component
@RequiredArgsConstructor
@Slf4j
public class SafeInputValidator implements ConstraintValidator<SafeInput, String> {

  private final InputSanitizer inputSanitizer;
  private final SecurityValidator securityValidator;
  private boolean allowHtml;
  private int maxLength;
  private boolean strict;

  @Override
  public void initialize(SafeInput constraintAnnotation) {
    this.allowHtml = constraintAnnotation.allowHtml();
    this.maxLength = constraintAnnotation.maxLength();
    this.strict = constraintAnnotation.strict();
  }

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (value == null || value.trim().isEmpty()) {
      return true; // Allow null/empty values, use @NotNull/@NotBlank for required fields
    }

    // Check length
    if (!securityValidator.isValidLength(value, maxLength)) {
      addViolation(context, "Input exceeds maximum length of " + maxLength + " characters");
      return false;
    }

    // Perform security validation
    if (strict) {
      if (!securityValidator.isSafeInput(value)) {
        addViolation(context, "Input contains potentially dangerous content");
        return false;
      }
    } else {
      // Less strict validation - only check for the most dangerous patterns
      if (securityValidator.containsSqlInjection(value) || securityValidator.containsXss(value)) {
        addViolation(context, "Input contains dangerous security patterns");
        return false;
      }
    }

    // Additional HTML validation if HTML is not allowed
    if (!allowHtml && containsHtml(value)) {
      addViolation(context, "HTML content is not allowed");
      return false;
    }

    return true;
  }

  private void addViolation(ConstraintValidatorContext context, String message) {
    context.disableDefaultConstraintViolation();
    context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
  }

  private boolean containsHtml(String value) {
    return value.contains("<") && value.contains(">");
  }
}
