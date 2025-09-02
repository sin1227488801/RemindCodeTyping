package com.rct.service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class PasswordService {

  private static final String ALGORITHM = "SHA-256";
  private static final int SALT_LENGTH = 16;

  public String encode(String rawPassword) {
    try {
      // Generate salt
      SecureRandom random = new SecureRandom();
      byte[] salt = new byte[SALT_LENGTH];
      random.nextBytes(salt);

      // Hash password with salt
      MessageDigest md = MessageDigest.getInstance(ALGORITHM);
      md.update(salt);
      byte[] hashedPassword = md.digest(rawPassword.getBytes());

      // Combine salt and hash
      byte[] combined = new byte[salt.length + hashedPassword.length];
      System.arraycopy(salt, 0, combined, 0, salt.length);
      System.arraycopy(hashedPassword, 0, combined, salt.length, hashedPassword.length);

      return Base64.getEncoder().encodeToString(combined);
    } catch (NoSuchAlgorithmException e) {
      log.error("パスワードのハッシュ化に失敗しました: {}", e.getMessage());
      throw new RuntimeException("パスワードのハッシュ化に失敗しました", e);
    }
  }

  public boolean matches(String rawPassword, String encodedPassword) {
    try {
      byte[] combined = Base64.getDecoder().decode(encodedPassword);

      // Extract salt
      byte[] salt = new byte[SALT_LENGTH];
      System.arraycopy(combined, 0, salt, 0, SALT_LENGTH);

      // Extract stored hash
      byte[] storedHash = new byte[combined.length - SALT_LENGTH];
      System.arraycopy(combined, SALT_LENGTH, storedHash, 0, storedHash.length);

      // Hash input password with extracted salt
      MessageDigest md = MessageDigest.getInstance(ALGORITHM);
      md.update(salt);
      byte[] inputHash = md.digest(rawPassword.getBytes());

      // Compare hashes
      return MessageDigest.isEqual(storedHash, inputHash);
    } catch (Exception e) {
      log.warn("パスワード照合中にエラーが発生しました: {}", e.getMessage());
      return false;
    }
  }
}
