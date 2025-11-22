package com.rct.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class TypingLogRequest {

  @NotNull(message = "学習帳IDは必須です")
  private UUID studyBookId;

  @NotNull(message = "開始時刻は必須です")
  private LocalDateTime startedAt;

  @NotNull(message = "実行時間は必須です")
  @Min(value = 1, message = "実行時間は1ms以上である必要があります")
  private Long durationMs;

  @NotNull(message = "総文字数は必須です")
  @Min(value = 0, message = "総文字数は0以上である必要があります")
  private Integer totalChars;

  @NotNull(message = "正解文字数は必須です")
  @Min(value = 0, message = "正解文字数は0以上である必要があります")
  private Integer correctChars;
}
