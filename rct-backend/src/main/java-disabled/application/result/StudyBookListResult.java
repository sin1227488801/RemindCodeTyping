package com.rct.application.result;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

/** Result object for study book list operations. */
@Data
@AllArgsConstructor
public class StudyBookListResult {
  private final List<StudyBookResult> studyBooks;

  public static StudyBookListResult from(List<StudyBookResult> studyBooks) {
    return new StudyBookListResult(studyBooks);
  }
}
