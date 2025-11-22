package com.rct.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StatsResponse {
  private Long totalAttempts;
  private BigDecimal averageAccuracy;
  private BigDecimal bestAccuracy;
  private Long totalCharsTyped;
  private Long totalTimeMs;
  private Integer currentLoginStreak;
  private Integer maxLoginStreak;
  private Integer totalLoginDays;
}
