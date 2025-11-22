package com.rct.presentation.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Validation annotation to ensure input is safe from security attacks. */
@Documented
@Constraint(validatedBy = SafeInputValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeInput {

  String message() default "Input contains potentially dangerous content";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  /** Whether to allow HTML content (with sanitization). */
  boolean allowHtml() default false;

  /** Maximum allowed length for the input. */
  int maxLength() default 1000;

  /** Whether to perform strict validation (more restrictive). */
  boolean strict() default true;
}
