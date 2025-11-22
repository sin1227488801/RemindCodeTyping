package com.rct.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuthRequest {

  @NotBlank(message = "ログインIDは必須です")
  @Size(min = 4, max = 50, message = "ログインIDは4文字以上50文字以下で入力してください")
  private String loginId;

  @NotBlank(message = "パスワードは必須です")
  @Size(min = 8, max = 100, message = "パスワードは8文字以上100文字以下で入力してください")
  @Pattern(
      regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
      message = "パスワードは英大文字・小文字・数字・記号を含む必要があります")
  private String password;
}
