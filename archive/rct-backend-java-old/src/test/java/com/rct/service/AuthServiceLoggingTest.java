package com.rct.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.rct.dto.AuthRequest;
import com.rct.dto.AuthResponse;
import com.rct.entity.LoginInfo;
import com.rct.repository.LoginInfoRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith({MockitoExtension.class, OutputCaptureExtension.class})
class AuthServiceLoggingTest {

  @Mock private LoginInfoRepository loginInfoRepository;

  @Mock private PasswordService passwordService;

  @InjectMocks private AuthService authService;

  @Test
  void shouldNotLogSensitiveInformationDuringRegistration(CapturedOutput output) {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("testuser");
    request.setPassword("testpassword123");

    LoginInfo savedUser = new LoginInfo();
    savedUser.setId(UUID.randomUUID());
    savedUser.setLoginId("testuser");
    savedUser.setPasswordHash("hashedpassword");
    savedUser.setLastLoginDate(LocalDate.now());
    savedUser.setLastLoginDays(1);
    savedUser.setMaxLoginDays(1);
    savedUser.setTotalLoginDays(1);

    when(loginInfoRepository.existsByLoginId(anyString())).thenReturn(false);
    when(passwordService.encode(anyString())).thenReturn("hashedpassword");
    when(loginInfoRepository.save(any(LoginInfo.class))).thenReturn(savedUser);

    // When
    AuthResponse response = authService.register(request);

    // Then
    assertNotNull(response);
    assertEquals("testuser", response.getLoginId());

    // Verify that sensitive information is not logged
    String logOutput = output.getOut();
    assertFalse(logOutput.contains("testpassword123"), "Raw password should not be logged");
    assertFalse(logOutput.contains("hashedpassword"), "Password hash should not be logged");
    assertTrue(
        logOutput.contains("新規ユーザー登録: testuser"),
        "Should log user registration without sensitive info");
  }

  @Test
  void shouldNotLogSensitiveInformationDuringLogin(CapturedOutput output) {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("testuser");
    request.setPassword("testpassword123");

    LoginInfo existingUser = new LoginInfo();
    existingUser.setId(UUID.randomUUID());
    existingUser.setLoginId("testuser");
    existingUser.setPasswordHash("hashedpassword");
    existingUser.setLastLoginDate(LocalDate.now().minusDays(1));
    existingUser.setLastLoginDays(1);
    existingUser.setMaxLoginDays(1);
    existingUser.setTotalLoginDays(1);

    when(loginInfoRepository.findByLoginId(anyString())).thenReturn(Optional.of(existingUser));
    when(passwordService.matches(anyString(), anyString())).thenReturn(true);
    when(loginInfoRepository.save(any(LoginInfo.class))).thenReturn(existingUser);

    // When
    AuthResponse response = authService.login(request);

    // Then
    assertNotNull(response);
    assertEquals("testuser", response.getLoginId());

    // Verify that sensitive information is not logged
    String logOutput = output.getOut();
    assertFalse(logOutput.contains("testpassword123"), "Raw password should not be logged");
    assertFalse(logOutput.contains("hashedpassword"), "Password hash should not be logged");
    assertTrue(
        logOutput.contains("ユーザーログイン: testuser"), "Should log user login without sensitive info");
  }
}
