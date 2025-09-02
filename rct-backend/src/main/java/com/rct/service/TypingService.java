package com.rct.service;

import com.rct.dto.StatsResponse;
import com.rct.dto.TypingLogRequest;
import com.rct.entity.LoginInfo;
import com.rct.entity.StudyBook;
import com.rct.entity.TypingLog;
import com.rct.repository.LoginInfoRepository;
import com.rct.repository.StudyBookRepository;
import com.rct.repository.TypingLogRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TypingService {

  private final TypingLogRepository typingLogRepository;
  private final LoginInfoRepository loginInfoRepository;
  private final StudyBookRepository studyBookRepository;

  @Transactional
  public void saveTypingLog(UUID userId, TypingLogRequest request) {
    LoginInfo user =
        loginInfoRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("ユーザーが見つかりません"));

    StudyBook studyBook =
        studyBookRepository
            .findById(request.getStudyBookId())
            .orElseThrow(() -> new IllegalArgumentException("学習帳が見つかりません"));

    // 正答率計算
    BigDecimal accuracy = BigDecimal.ZERO;
    if (request.getTotalChars() > 0) {
      accuracy =
          BigDecimal.valueOf(request.getCorrectChars())
              .divide(BigDecimal.valueOf(request.getTotalChars()), 4, RoundingMode.HALF_UP)
              .multiply(BigDecimal.valueOf(100))
              .setScale(2, RoundingMode.HALF_UP);
    }

    TypingLog typingLog = new TypingLog();
    typingLog.setUser(user);
    typingLog.setStudyBook(studyBook);
    typingLog.setStartedAt(request.getStartedAt());
    typingLog.setDurationMs(request.getDurationMs());
    typingLog.setTotalChars(request.getTotalChars());
    typingLog.setCorrectChars(request.getCorrectChars());
    typingLog.setAccuracy(accuracy);

    typingLogRepository.save(typingLog);
    log.info("タイピングログ保存: userId={}, accuracy={}%", userId, accuracy);
  }

  @Transactional(readOnly = true)
  public StatsResponse getStats(UUID userId) {
    LoginInfo user =
        loginInfoRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("ユーザーが見つかりません"));

    Long totalAttempts = typingLogRepository.countByUserId(userId);
    BigDecimal averageAccuracy = typingLogRepository.findAverageAccuracyByUserId(userId);
    BigDecimal bestAccuracy = typingLogRepository.findMaxAccuracyByUserId(userId);
    Long totalCharsTyped = typingLogRepository.sumTotalCharsByUserId(userId);
    Long totalTimeMs = typingLogRepository.sumDurationMsByUserId(userId);

    return new StatsResponse(
        totalAttempts != null ? totalAttempts : 0L,
        averageAccuracy != null
            ? averageAccuracy.setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO,
        bestAccuracy != null ? bestAccuracy.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO,
        totalCharsTyped != null ? totalCharsTyped : 0L,
        totalTimeMs != null ? totalTimeMs : 0L,
        user.getLastLoginDays(),
        user.getMaxLoginDays(),
        user.getTotalLoginDays());
  }
}
