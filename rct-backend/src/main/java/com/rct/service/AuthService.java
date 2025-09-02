package com.rct.service;

import com.rct.dto.AuthRequest;
import com.rct.dto.AuthResponse;
import com.rct.entity.LoginInfo;
import com.rct.repository.LoginInfoRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private final LoginInfoRepository loginInfoRepository;
  private final PasswordService passwordService;

  @Transactional
  public AuthResponse register(AuthRequest request) {
    if (loginInfoRepository.existsByLoginId(request.getLoginId())) {
      throw new IllegalArgumentException("このログインIDは既に使用されています");
    }

    LoginInfo loginInfo = new LoginInfo();
    loginInfo.setLoginId(request.getLoginId());
    loginInfo.setPasswordHash(passwordService.encode(request.getPassword()));
    loginInfo.setLastLoginDate(LocalDate.now());
    loginInfo.setLastLoginDays(1);
    loginInfo.setMaxLoginDays(1);
    loginInfo.setTotalLoginDays(1);

    LoginInfo saved = loginInfoRepository.save(loginInfo);
    log.info("新規ユーザー登録: {}", saved.getLoginId());

    return new AuthResponse(
        saved.getId(), saved.getLoginId(), "simple-token-" + saved.getId(), false);
  }

  @Transactional
  public AuthResponse login(AuthRequest request) {
    LoginInfo loginInfo =
        loginInfoRepository
            .findByLoginId(request.getLoginId())
            .orElseThrow(() -> new IllegalArgumentException("ログインIDまたはパスワードが正しくありません"));

    if (!passwordService.matches(request.getPassword(), loginInfo.getPasswordHash())) {
      throw new IllegalArgumentException("ログインIDまたはパスワードが正しくありません");
    }

    updateLoginStats(loginInfo);
    LoginInfo updated = loginInfoRepository.save(loginInfo);
    log.info("ユーザーログイン: {}", updated.getLoginId());

    return new AuthResponse(
        updated.getId(), updated.getLoginId(), "simple-token-" + updated.getId(), false);
  }

  @Transactional
  public AuthResponse guestLogin() {
    LoginInfo guestUser =
        loginInfoRepository
            .findByLoginId("guest")
            .orElseGet(
                () -> {
                  LoginInfo guest = new LoginInfo();
                  guest.setLoginId("guest");
                  guest.setPasswordHash(passwordService.encode("guest123"));
                  guest.setLastLoginDate(LocalDate.now());
                  guest.setLastLoginDays(1);
                  guest.setMaxLoginDays(1);
                  guest.setTotalLoginDays(1);
                  return loginInfoRepository.save(guest);
                });

    log.info("ゲストユーザーログイン");

    return new AuthResponse(
        guestUser.getId(), guestUser.getLoginId(), "guest-token-" + guestUser.getId(), true);
  }

  private void updateLoginStats(LoginInfo loginInfo) {
    LocalDate today = LocalDate.now();
    LocalDate lastLogin = loginInfo.getLastLoginDate();

    if (lastLogin == null || !lastLogin.equals(today)) {
      if (lastLogin != null && lastLogin.equals(today.minusDays(1))) {
        // 連続ログイン
        loginInfo.setLastLoginDays(loginInfo.getLastLoginDays() + 1);
        loginInfo.setMaxLoginDays(
            Math.max(loginInfo.getMaxLoginDays(), loginInfo.getLastLoginDays()));
      } else {
        // 連続ログイン途切れ
        loginInfo.setLastLoginDays(1);
      }

      loginInfo.setLastLoginDate(today);
      loginInfo.setTotalLoginDays(loginInfo.getTotalLoginDays() + 1);
    }
  }
}
