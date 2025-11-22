package com.rct.presentation.mapper;

import com.rct.application.command.*;
import com.rct.application.result.StudyBookListResult;
import com.rct.application.result.StudyBookPageResult;
import com.rct.application.result.StudyBookResult;
import com.rct.presentation.dto.request.CreateStudyBookRequest;
import com.rct.presentation.dto.request.GetStudyBooksRequest;
import com.rct.presentation.dto.request.UpdateStudyBookRequest;
import com.rct.presentation.dto.response.StudyBookResponse;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between presentation DTOs and application layer objects for study books.
 */
@Component
public class StudyBookDtoMapper {

  /** Converts CreateStudyBookRequest to CreateStudyBookCommand. */
  public CreateStudyBookCommand toCreateStudyBookCommand(
      UUID userId, CreateStudyBookRequest request) {
    return new CreateStudyBookCommand(
        userId, request.getLanguage(), request.getQuestion(), request.getExplanation());
  }

  /** Converts UpdateStudyBookRequest to UpdateStudyBookCommand. */
  public UpdateStudyBookCommand toUpdateStudyBookCommand(
      UUID userId, UUID studyBookId, UpdateStudyBookRequest request) {
    return new UpdateStudyBookCommand(
        userId,
        studyBookId,
        request.getLanguage(),
        request.getQuestion(),
        request.getExplanation());
  }

  /** Converts parameters to DeleteStudyBookCommand. */
  public DeleteStudyBookCommand toDeleteStudyBookCommand(UUID userId, UUID studyBookId) {
    return new DeleteStudyBookCommand(userId, studyBookId);
  }

  /** Converts GetStudyBooksRequest to GetStudyBooksCommand. */
  public GetStudyBooksCommand toGetStudyBooksCommand(GetStudyBooksRequest request) {
    return new GetStudyBooksCommand(
        request.getUserId(),
        request.getLanguage(),
        request.getQuery(),
        request.getPage(),
        request.getSize());
  }

  /** Converts parameters to GetRandomStudyBooksCommand. */
  public GetRandomStudyBooksCommand toGetRandomStudyBooksCommand(
      UUID userId, String language, int limit) {
    return new GetRandomStudyBooksCommand(userId, language, limit);
  }

  /** Converts parameters to GetLanguagesCommand. */
  public GetLanguagesCommand toGetLanguagesCommand(UUID userId) {
    return new GetLanguagesCommand(userId);
  }

  /** Converts StudyBookResult to StudyBookResponse. */
  public StudyBookResponse toStudyBookResponse(StudyBookResult result) {
    return new StudyBookResponse(
        result.getId(),
        result.getLanguage(),
        result.getQuestion(),
        result.getExplanation(),
        result.getCreatedAt(),
        result.getUpdatedAt());
  }

  /** Converts StudyBookPageResult to Page<StudyBookResponse>. */
  public Page<StudyBookResponse> toStudyBookPageResponse(StudyBookPageResult result) {
    List<StudyBookResponse> content =
        result.getContent().stream().map(this::toStudyBookResponse).collect(Collectors.toList());

    PageRequest pageRequest = PageRequest.of(result.getPage(), result.getSize());
    return new PageImpl<>(content, pageRequest, result.getTotalElements());
  }

  /** Converts StudyBookListResult to List<StudyBookResponse>. */
  public List<StudyBookResponse> toStudyBookListResponse(StudyBookListResult result) {
    return result.getStudyBooks().stream()
        .map(this::toStudyBookResponse)
        .collect(Collectors.toList());
  }
}
