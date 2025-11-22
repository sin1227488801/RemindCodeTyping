package com.rct.application.result;

import com.rct.domain.model.studybook.StudyBook;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;

/** Result object for study book operations. */
@Data
@AllArgsConstructor
public class StudyBookResult {
  private final UUID id;
  private final String language;
  private final String question;
  private final String explanation;
  private final LocalDateTime createdAt;
  private final LocalDateTime updatedAt;

  public static StudyBookResult from(StudyBook studyBook) {
    return new StudyBookResult(
        studyBook.getId().getValue(),
        studyBook.getLanguage().getValue(),
        studyBook.getQuestion().getContent(),
        studyBook.getExplanation() != null ? studyBook.getExplanation().getContent() : null,
        studyBook.getCreatedAt(),
        studyBook.getUpdatedAt());
  }
}
