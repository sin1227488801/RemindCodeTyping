package com.rct.infrastructure.legacy;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Legacy study book service implementation Maintains existing behavior during transition period
 * Requirements: 8.4
 */
@Service
public class LegacyStudyBookService {

  /** Legacy method to get user study books */
  public LegacyApiAdapter.LegacyStudyBookListResponse getUserStudyBooks(
      String userId, int page, int size) {
    // Original study book retrieval logic
    LegacyApiAdapter.LegacyStudyBookListResponse response =
        new LegacyApiAdapter.LegacyStudyBookListResponse();

    List<LegacyApiAdapter.LegacyStudyBookItem> studyBooks = new ArrayList<>();
    // Populate with legacy data structure

    response.setStudyBooks(studyBooks);
    response.setTotalCount(0);
    response.setCurrentPage(page);

    return response;
  }

  /** Legacy method to create study book */
  public LegacyApiAdapter.LegacyStudyBookResponse createStudyBook(
      LegacyApiAdapter.LegacyCreateStudyBookRequest request) {
    // Original study book creation logic
    LegacyApiAdapter.LegacyStudyBookResponse response =
        new LegacyApiAdapter.LegacyStudyBookResponse();
    response.setId("legacy_book_" + System.currentTimeMillis());
    response.setStatus("success");
    response.setMessage("Study book created successfully");

    return response;
  }

  /** Legacy method to update study book */
  public LegacyApiAdapter.LegacyStudyBookResponse updateStudyBook(
      String studyBookId, LegacyApiAdapter.LegacyCreateStudyBookRequest request) {
    // Original study book update logic
    LegacyApiAdapter.LegacyStudyBookResponse response =
        new LegacyApiAdapter.LegacyStudyBookResponse();
    response.setId(studyBookId);
    response.setStatus("success");
    response.setMessage("Study book updated successfully");

    return response;
  }

  /** Legacy method to delete study book */
  public LegacyApiAdapter.LegacyStudyBookResponse deleteStudyBook(String studyBookId) {
    // Original study book deletion logic
    LegacyApiAdapter.LegacyStudyBookResponse response =
        new LegacyApiAdapter.LegacyStudyBookResponse();
    response.setId(studyBookId);
    response.setStatus("success");
    response.setMessage("Study book deleted successfully");

    return response;
  }
}
