package com.rct.presentation.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Validation annotation for programming language names. */
@Documented
@Constraint(validatedBy = ValidLanguageValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidLanguage {

  String message() default "Invalid programming language";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
