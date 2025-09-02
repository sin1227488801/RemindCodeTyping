package com.rct.infrastructure.security;

import com.rct.domain.model.user.PasswordHash;
import com.rct.infrastructure.config.ApplicationProperties;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service for password hashing and validation. Uses BCrypt for secure password hashing with
 * configurable strength.
 */
@Service
@Slf4j
public class PasswordService {

  private final BCryptPasswordEncoder encoder;
  private final ApplicationProperties.SecurityProperties securityProperties;
  private final Pattern strongPasswordPattern;

  public PasswordService(ApplicationProperties applicationProperties) {
    this.encoder = new BCryptPasswordEncoder(12); // Strong work factor
    this.securityProperties = applicationProperties.security();
    // Pattern for strong password: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit
    this.strongPasswordPattern =
        Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{"
                + securityProperties.passwordMinLength()
                + ",}$");
  }

  /**
   * Encodes a raw password using BCrypt.
   *
   * @param rawPassword the raw password to encode
   * @return PasswordHash containing the encoded password
   * @throws WeakPasswordException if password doesn't meet strength requirements
   */
  public PasswordHash encode(String rawPassword) {
    validatePasswordStrength(rawPassword);
    String encoded = encoder.encode(rawPassword);
    log.debug("Password encoded successfully");
    return PasswordHash.of(encoded);
  }

  /**
   * Checks if a raw password matches the encoded password hash.
   *
   * @param rawPassword the raw password to check
   * @param passwordHash the encoded password hash to match against
   * @return true if passwords match, false otherwise
   */
  public boolean matches(String rawPassword, PasswordHash passwordHash) {
    if (rawPassword == null || passwordHash == null || passwordHash.getValue() == null) {
      return false;
    }
    return encoder.matches(rawPassword, passwordHash.getValue());
  }

  /**
   * Validates password strength according to security requirements.
   *
   * @param password the password to validate
   * @throws WeakPasswordException if password doesn't meet requirements
   */
  private void validatePasswordStrength(String password) {
    if (password == null || password.length() < securityProperties.passwordMinLength()) {
      throw new WeakPasswordException(
          String.format(
              "Password must be at least %d characters long",
              securityProperties.passwordMinLength()));
    }

    if (password.length() > securityProperties.passwordMaxLength()) {
      throw new WeakPasswordException(
          String.format(
              "Password must not exceed %d characters", securityProperties.passwordMaxLength()));
    }

    if (securityProperties.requireStrongPassword()
        && !strongPasswordPattern.matcher(password).matches()) {
      throw new WeakPasswordException(
          "Password must contain at least one uppercase letter, "
              + "one lowercase letter, and one digit");
    }

    // Check for common weak passwords
    if (isCommonWeakPassword(password)) {
      throw new WeakPasswordException("Password is too common and easily guessable");
    }
  }

  /**
   * Checks if password is in list of commonly used weak passwords.
   *
   * @param password the password to check
   * @return true if password is weak/common, false otherwise
   */
  private boolean isCommonWeakPassword(String password) {
    String lowerPassword = password.toLowerCase();
    return lowerPassword.equals("password")
        || lowerPassword.equals("12345678")
        || lowerPassword.equals("password123")
        || lowerPassword.equals("admin123")
        || lowerPassword.equals("qwerty123")
        || lowerPassword.contains("password")
        || lowerPassword.matches("\\d{8,}"); // All digits
  }

  /**
   * Checks if a password hash needs to be rehashed (e.g., due to updated security requirements).
   *
   * @param passwordHash the password hash to check
   * @return true if rehashing is recommended, false otherwise
   */
  public boolean needsRehashing(PasswordHash passwordHash) {
    // BCrypt hashes include the work factor, so we can check if it's outdated
    String hash = passwordHash.getValue();
    if (hash == null || !hash.startsWith("$2")) {
      return true; // Not a BCrypt hash or invalid format
    }

    // Extract work factor from hash (format: $2a$12$...)
    try {
      String[] parts = hash.split("\\$");
      if (parts.length >= 3) {
        int workFactor = Integer.parseInt(parts[2]);
        return workFactor < 12; // Rehash if work factor is less than current standard
      }
    } catch (NumberFormatException e) {
      log.warn("Could not parse work factor from password hash", e);
      return true;
    }

    return false;
  }

  /** Exception thrown when a password doesn't meet strength requirements. */
  public static class WeakPasswordException extends RuntimeException {
    public WeakPasswordException(String message) {
      super(message);
    }
  }
}
