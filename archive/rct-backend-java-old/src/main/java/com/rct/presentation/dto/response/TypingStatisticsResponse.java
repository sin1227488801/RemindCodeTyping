package com.rct.presentation.dto.response;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for typing statistics. */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TypingStatisticsResponse {

  private Long totalAttempts;

  private BigDecimal averageAccuracy;

  private BigDecimal bestAccuracy;

  private Long totalCharsTyped;

  private Long totalTimeMs;

  private Integer currentLoginStreak;

  private Integer maxLoginStreak;

  private Integer totalLoginDays;
}
