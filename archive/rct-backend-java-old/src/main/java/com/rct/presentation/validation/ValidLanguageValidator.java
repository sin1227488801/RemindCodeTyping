package com.rct.presentation.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Validator for the @ValidLanguage annotation. */
@Component
@RequiredArgsConstructor
public class ValidLanguageValidator implements ConstraintValidator<ValidLanguage, String> {

  private final SecurityValidator securityValidator;

  private static final Set<String> VALID_LANGUAGES =
      Set.of(
          "JavaScript",
          "Java",
          "Python",
          "C++",
          "C#",
          "C",
          "Go",
          "Rust",
          "TypeScript",
          "PHP",
          "Ruby",
          "Swift",
          "Kotlin",
          "Scala",
          "HTML",
          "CSS",
          "SQL",
          "Shell",
          "PowerShell",
          "Bash",
          "R",
          "MATLAB",
          "Perl",
          "Lua",
          "Dart",
          "Elixir",
          "Haskell",
          "Clojure",
          "F#",
          "VB.NET",
          "Assembly",
          "COBOL",
          "Fortran",
          "Pascal",
          "Delphi",
          "Objective-C",
          "Groovy",
          "Julia",
          "Erlang");

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (value == null || value.trim().isEmpty()) {
      return true; // Let @NotNull/@NotBlank handle null/empty validation
    }

    // First check for security issues
    if (!securityValidator.isSafeInput(value)) {
      context.disableDefaultConstraintViolation();
      context
          .buildConstraintViolationWithTemplate(
              "Language name contains potentially dangerous content")
          .addConstraintViolation();
      return false;
    }

    // Check length
    if (value.length() > 50) {
      context.disableDefaultConstraintViolation();
      context
          .buildConstraintViolationWithTemplate("Language name is too long")
          .addConstraintViolation();
      return false;
    }

    // Check if the language is in our predefined list
    boolean isValid = VALID_LANGUAGES.contains(value);

    if (!isValid) {
      context.disableDefaultConstraintViolation();
      context
          .buildConstraintViolationWithTemplate(
              "Programming language '"
                  + value
                  + "' is not supported. "
                  + "Supported languages: "
                  + String.join(", ", VALID_LANGUAGES))
          .addConstraintViolation();
    }

    return isValid;
  }
}
