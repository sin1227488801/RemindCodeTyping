package com.rct.application.result;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;

/** Result object for typing statistics operations. */
@Data
@AllArgsConstructor
public class TypingStatisticsResult {
  private final Long totalAttempts;
  private final BigDecimal averageAccuracy;
  private final BigDecimal bestAccuracy;
  private final Long totalCharsTyped;
  private final Long totalTimeMs;
  private final Integer currentLoginStreak;
  private final Integer maxLoginStreak;
  private final Integer totalLoginDays;
}
