package com.rct.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StudyBookRequest {

  @NotBlank(message = "言語は必須です")
  @Size(max = 20, message = "言語は20文字以下で入力してください")
  private String language;

  @NotBlank(message = "問題は必須です")
  @Size(max = 5000, message = "問題は5000文字以下で入力してください")
  private String question;

  @Size(max = 5000, message = "説明は5000文字以下で入力してください")
  private String explanation;
}
