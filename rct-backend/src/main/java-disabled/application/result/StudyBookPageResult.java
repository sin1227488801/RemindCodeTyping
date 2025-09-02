package com.rct.application.result;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.domain.Page;

/** Result object for paginated study book queries. */
@Data
@AllArgsConstructor
public class StudyBookPageResult {
  private final List<StudyBookResult> content;
  private final int page;
  private final int size;
  private final long totalElements;
  private final int totalPages;
  private final boolean first;
  private final boolean last;

  public static StudyBookPageResult from(Page<StudyBookResult> page) {
    return new StudyBookPageResult(
        page.getContent(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }
}
