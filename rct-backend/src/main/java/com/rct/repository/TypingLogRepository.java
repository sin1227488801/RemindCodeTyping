package com.rct.repository;

import com.rct.entity.TypingLog;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TypingLogRepository extends JpaRepository<TypingLog, UUID> {

  @Query("SELECT COUNT(t) FROM TypingLog t WHERE t.user.id = :userId")
  Long countByUserId(@Param("userId") UUID userId);

  @Query("SELECT AVG(t.accuracy) FROM TypingLog t WHERE t.user.id = :userId")
  BigDecimal findAverageAccuracyByUserId(@Param("userId") UUID userId);

  @Query("SELECT MAX(t.accuracy) FROM TypingLog t WHERE t.user.id = :userId")
  BigDecimal findMaxAccuracyByUserId(@Param("userId") UUID userId);

  @Query("SELECT SUM(t.totalChars) FROM TypingLog t WHERE t.user.id = :userId")
  Long sumTotalCharsByUserId(@Param("userId") UUID userId);

  @Query("SELECT SUM(t.durationMs) FROM TypingLog t WHERE t.user.id = :userId")
  Long sumDurationMsByUserId(@Param("userId") UUID userId);
}
