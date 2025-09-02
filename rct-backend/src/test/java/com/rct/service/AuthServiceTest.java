package com.rct.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

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

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock private LoginInfoRepository loginInfoRepository;

  @Mock private PasswordService passwordService;

  @InjectMocks private AuthService authService;

  @Test
  void register_ShouldCreateNewUser_WhenValidRequest() {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("newuser");
    request.setPassword("password123");

    LoginInfo savedUser = createTestLoginInfo("newuser", "hashedpassword");

    when(loginInfoRepository.existsByLoginId("newuser")).thenReturn(false);
    when(passwordService.encode("password123")).thenReturn("hashedpassword");
    when(loginInfoRepository.save(any(LoginInfo.class))).thenReturn(savedUser);

    // When
    AuthResponse response = authService.register(request);

    // Then
    assertNotNull(response);
    assertEquals("newuser", response.getLoginId());
    assertEquals(savedUser.getId(), response.getUserId());
    assertFalse(response.isGuest());
    assertTrue(response.getToken().startsWith("simple-token-"));

    verify(loginInfoRepository).existsByLoginId("newuser");
    verify(passwordService).encode("password123");
    verify(loginInfoRepository).save(any(LoginInfo.class));
  }

  @Test
  void register_ShouldThrowException_WhenLoginIdAlreadyExists() {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("existinguser");
    request.setPassword("password123");

    when(loginInfoRepository.existsByLoginId("existinguser")).thenReturn(true);

    // When & Then
    IllegalArgumentException exception =
        assertThrows(IllegalArgumentException.class, () -> authService.register(request));

    assertEquals("このログインIDは既に使用されています", exception.getMessage());
    verify(loginInfoRepository).existsByLoginId("existinguser");
    verify(passwordService, never()).encode(anyString());
    verify(loginInfoRepository, never()).save(any(LoginInfo.class));
  }

  @Test
  void login_ShouldReturnAuthResponse_WhenValidCredentials() {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("testuser");
    request.setPassword("password123");

    LoginInfo existingUser = createTestLoginInfo("testuser", "hashedpassword");
    existingUser.setLastLoginDate(LocalDate.now().minusDays(1));

    when(loginInfoRepository.findByLoginId("testuser")).thenReturn(Optional.of(existingUser));
    when(passwordService.matches("password123", "hashedpassword")).thenReturn(true);
    when(loginInfoRepository.save(any(LoginInfo.class))).thenReturn(existingUser);

    // When
    AuthResponse response = authService.login(request);

    // Then
    assertNotNull(response);
    assertEquals("testuser", response.getLoginId());
    assertEquals(existingUser.getId(), response.getUserId());
    assertFalse(response.isGuest());
    assertTrue(response.getToken().startsWith("simple-token-"));

    verify(loginInfoRepository).findByLoginId("testuser");
    verify(passwordService).matches("password123", "hashedpassword");
    verify(loginInfoRepository).save(any(LoginInfo.class));
  }

  @Test
  void login_ShouldThrowException_WhenUserNotFound() {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("nonexistent");
    request.setPassword("password123");

    when(loginInfoRepository.findByLoginId("nonexistent")).thenReturn(Optional.empty());

    // When & Then
    IllegalArgumentException exception =
        assertThrows(IllegalArgumentException.class, () -> authService.login(request));

    assertEquals("ログインIDまたはパスワードが正しくありません", exception.getMessage());
    verify(loginInfoRepository).findByLoginId("nonexistent");
    verify(passwordService, never()).matches(anyString(), anyString());
    verify(loginInfoRepository, never()).save(any(LoginInfo.class));
  }

  @Test
  void login_ShouldThrowException_WhenPasswordIncorrect() {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("testuser");
    request.setPassword("wrongpassword");

    LoginInfo existingUser = createTestLoginInfo("testuser", "hashedpassword");

    when(loginInfoRepository.findByLoginId("testuser")).thenReturn(Optional.of(existingUser));
    when(passwordService.matches("wrongpassword", "hashedpassword")).thenReturn(false);

    // When & Then
    IllegalArgumentException exception =
        assertThrows(IllegalArgumentException.class, () -> authService.login(request));

    assertEquals("ログインIDまたはパスワードが正しくありません", exception.getMessage());
    verify(loginInfoRepository).findByLoginId("testuser");
    verify(passwordService).matches("wrongpassword", "hashedpassword");
    verify(loginInfoRepository, never()).save(any(LoginInfo.class));
  }

  @Test
  void guestLogin_ShouldReturnGuestUser_WhenGuestExists() {
    // Given
    LoginInfo guestUser = createTestLoginInfo("guest", "guesthashedpassword");

    when(loginInfoRepository.findByLoginId("guest")).thenReturn(Optional.of(guestUser));

    // When
    AuthResponse response = authService.guestLogin();

    // Then
    assertNotNull(response);
    assertEquals("guest", response.getLoginId());
    assertEquals(guestUser.getId(), response.getUserId());
    assertTrue(response.isGuest());
    assertTrue(response.getToken().startsWith("guest-token-"));

    verify(loginInfoRepository).findByLoginId("guest");
    verify(loginInfoRepository, never()).save(any(LoginInfo.class));
  }

  @Test
  void guestLogin_ShouldCreateGuestUser_WhenGuestNotExists() {
    // Given
    LoginInfo newGuestUser = createTestLoginInfo("guest", "guesthashedpassword");

    when(loginInfoRepository.findByLoginId("guest")).thenReturn(Optional.empty());
    when(passwordService.encode("guest123")).thenReturn("guesthashedpassword");
    when(loginInfoRepository.save(any(LoginInfo.class))).thenReturn(newGuestUser);

    // When
    AuthResponse response = authService.guestLogin();

    // Then
    assertNotNull(response);
    assertEquals("guest", response.getLoginId());
    assertEquals(newGuestUser.getId(), response.getUserId());
    assertTrue(response.isGuest());
    assertTrue(response.getToken().startsWith("guest-token-"));

    verify(loginInfoRepository).findByLoginId("guest");
    verify(passwordService).encode("guest123");
    verify(loginInfoRepository).save(any(LoginInfo.class));
  }

  @Test
  void login_ShouldUpdateLoginStats_WhenConsecutiveLogin() {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("testuser");
    request.setPassword("password123");

    LoginInfo existingUser = createTestLoginInfo("testuser", "hashedpassword");
    existingUser.setLastLoginDate(LocalDate.now().minusDays(1)); // 昨日ログイン
    existingUser.setLastLoginDays(5);
    existingUser.setMaxLoginDays(10);
    existingUser.setTotalLoginDays(20);

    when(loginInfoRepository.findByLoginId("testuser")).thenReturn(Optional.of(existingUser));
    when(passwordService.matches("password123", "hashedpassword")).thenReturn(true);
    when(loginInfoRepository.save(any(LoginInfo.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    // When
    authService.login(request);

    // Then
    verify(loginInfoRepository)
        .save(
            argThat(
                loginInfo -> {
                  assertEquals(LocalDate.now(), loginInfo.getLastLoginDate());
                  assertEquals(6, loginInfo.getLastLoginDays()); // 連続ログイン日数が増加
                  assertEquals(10, loginInfo.getMaxLoginDays()); // 最大連続日数は変わらず
                  assertEquals(21, loginInfo.getTotalLoginDays()); // 総ログイン日数が増加
                  return true;
                }));
  }

  @Test
  void login_ShouldResetLoginStreak_WhenNonConsecutiveLogin() {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("testuser");
    request.setPassword("password123");

    LoginInfo existingUser = createTestLoginInfo("testuser", "hashedpassword");
    existingUser.setLastLoginDate(LocalDate.now().minusDays(3)); // 3日前にログイン
    existingUser.setLastLoginDays(5);
    existingUser.setMaxLoginDays(10);
    existingUser.setTotalLoginDays(20);

    when(loginInfoRepository.findByLoginId("testuser")).thenReturn(Optional.of(existingUser));
    when(passwordService.matches("password123", "hashedpassword")).thenReturn(true);
    when(loginInfoRepository.save(any(LoginInfo.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    // When
    authService.login(request);

    // Then
    verify(loginInfoRepository)
        .save(
            argThat(
                loginInfo -> {
                  assertEquals(LocalDate.now(), loginInfo.getLastLoginDate());
                  assertEquals(1, loginInfo.getLastLoginDays()); // 連続ログイン日数がリセット
                  assertEquals(10, loginInfo.getMaxLoginDays()); // 最大連続日数は変わらず
                  assertEquals(21, loginInfo.getTotalLoginDays()); // 総ログイン日数が増加
                  return true;
                }));
  }

  @Test
  void login_ShouldUpdateMaxLoginDays_WhenNewRecord() {
    // Given
    AuthRequest request = new AuthRequest();
    request.setLoginId("testuser");
    request.setPassword("password123");

    LoginInfo existingUser = createTestLoginInfo("testuser", "hashedpassword");
    existingUser.setLastLoginDate(LocalDate.now().minusDays(1)); // 昨日ログイン
    existingUser.setLastLoginDays(9);
    existingUser.setMaxLoginDays(9);
    existingUser.setTotalLoginDays(20);

    when(loginInfoRepository.findByLoginId("testuser")).thenReturn(Optional.of(existingUser));
    when(passwordService.matches("password123", "hashedpassword")).thenReturn(true);
    when(loginInfoRepository.save(any(LoginInfo.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    // When
    authService.login(request);

    // Then
    verify(loginInfoRepository)
        .save(
            argThat(
                loginInfo -> {
                  assertEquals(LocalDate.now(), loginInfo.getLastLoginDate());
                  assertEquals(10, loginInfo.getLastLoginDays()); // 連続ログイン日数が増加
                  assertEquals(10, loginInfo.getMaxLoginDays()); // 最大連続日数が更新
                  assertEquals(21, loginInfo.getTotalLoginDays()); // 総ログイン日数が増加
                  return true;
                }));
  }

  private LoginInfo createTestLoginInfo(String loginId, String passwordHash) {
    LoginInfo loginInfo = new LoginInfo();
    loginInfo.setId(UUID.randomUUID());
    loginInfo.setLoginId(loginId);
    loginInfo.setPasswordHash(passwordHash);
    loginInfo.setLastLoginDate(LocalDate.now());
    loginInfo.setLastLoginDays(1);
    loginInfo.setMaxLoginDays(1);
    loginInfo.setTotalLoginDays(1);
    return loginInfo;
  }
}
