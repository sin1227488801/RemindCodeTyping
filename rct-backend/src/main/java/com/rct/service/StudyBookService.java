package com.rct.service;

import com.rct.dto.StudyBookRequest;
import com.rct.dto.StudyBookResponse;
import com.rct.entity.LoginInfo;
import com.rct.entity.StudyBook;
import com.rct.repository.LoginInfoRepository;
import com.rct.repository.StudyBookRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudyBookService {

  private final StudyBookRepository studyBookRepository;
  private final LoginInfoRepository loginInfoRepository;

  @Transactional(readOnly = true)
  public Page<StudyBookResponse> getStudyBooks(
      UUID userId, String language, String query, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

    Page<StudyBook> studyBooks;

    if (language != null
        && !language.trim().isEmpty()
        && query != null
        && !query.trim().isEmpty()) {
      studyBooks =
          studyBookRepository
              .findByUserIdAndLanguageContainingIgnoreCaseAndQuestionContainingIgnoreCase(
                  userId, language.trim(), query.trim(), pageable);
    } else if (language != null && !language.trim().isEmpty()) {
      studyBooks =
          studyBookRepository.findByUserIdAndLanguageContainingIgnoreCase(
              userId, language.trim(), pageable);
    } else if (query != null && !query.trim().isEmpty()) {
      studyBooks =
          studyBookRepository.findByUserIdAndQuestionContainingIgnoreCase(
              userId, query.trim(), pageable);
    } else {
      studyBooks = studyBookRepository.findByUserId(userId, pageable);
    }

    return studyBooks.map(this::toResponse);
  }

  @Transactional
  public StudyBookResponse createStudyBook(UUID userId, StudyBookRequest request) {
    LoginInfo user =
        loginInfoRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("ユーザーが見つかりません"));

    StudyBook studyBook = new StudyBook();
    studyBook.setUser(user);
    studyBook.setLanguage(request.getLanguage());
    studyBook.setQuestion(request.getQuestion());
    studyBook.setExplanation(request.getExplanation());

    StudyBook saved = studyBookRepository.save(studyBook);
    log.info("学習帳作成: userId={}, language={}", userId, request.getLanguage());

    return toResponse(saved);
  }

  @Transactional
  public StudyBookResponse updateStudyBook(
      UUID userId, UUID studyBookId, StudyBookRequest request) {
    StudyBook studyBook =
        studyBookRepository
            .findById(studyBookId)
            .orElseThrow(() -> new IllegalArgumentException("学習帳が見つかりません"));

    if (!studyBook.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("この学習帳を編集する権限がありません");
    }

    studyBook.setLanguage(request.getLanguage());
    studyBook.setQuestion(request.getQuestion());
    studyBook.setExplanation(request.getExplanation());

    StudyBook updated = studyBookRepository.save(studyBook);
    log.info("学習帳更新: userId={}, studyBookId={}", userId, studyBookId);

    return toResponse(updated);
  }

  @Transactional
  public void deleteStudyBook(UUID userId, UUID studyBookId) {
    StudyBook studyBook =
        studyBookRepository
            .findById(studyBookId)
            .orElseThrow(() -> new IllegalArgumentException("学習帳が見つかりません"));

    if (!studyBook.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("この学習帳を削除する権限がありません");
    }

    studyBookRepository.delete(studyBook);
    log.info("学習帳削除: userId={}, studyBookId={}", userId, studyBookId);
  }

  @Transactional(readOnly = true)
  public List<StudyBookResponse> getRandomStudyBooks(UUID userId, String language, int limit) {
    List<StudyBook> studyBooks =
        studyBookRepository.findRandomByUserIdAndLanguage(userId, language, limit);
    return studyBooks.stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<StudyBookResponse> getSystemProblemsByLanguage(String language) {
    List<StudyBook> problems = studyBookRepository.findByLanguageAndIsSystemProblem(language, true);
    return problems.stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<StudyBookResponse> getUserProblemsByLanguage(UUID userId, String language) {
    List<StudyBook> problems =
        studyBookRepository.findByUserIdAndLanguageAndIsSystemProblem(userId, language, false);
    return problems.stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<String> getSystemProblemLanguages() {
    List<String> languages = studyBookRepository.findDistinctLanguagesByIsSystemProblem(true);
    return sortLanguagesByPreferredOrder(languages);
  }

  @Transactional(readOnly = true)
  public List<String> getUserProblemLanguages(UUID userId) {
    return studyBookRepository.findDistinctLanguagesByUserIdAndIsSystemProblem(userId, false);
  }

  @Transactional(readOnly = true)
  public List<String> getAllLanguages() {
    List<String> languages = studyBookRepository.findDistinctLanguages();
    return sortLanguagesByPreferredOrder(languages);
  }

  private List<String> sortLanguagesByPreferredOrder(List<String> languages) {
    // 希望の順番を定義
    List<String> preferredOrder =
        List.of(
            "HTML",
            "CSS",
            "JavaScript",
            "PHP",
            "Java",
            "Python3",
            "SQL",
            "Linux (RED Hat)",
            "Linux(Debian)",
            "Git");

    return languages.stream()
        .sorted(
            (a, b) -> {
              int indexA = preferredOrder.indexOf(a);
              int indexB = preferredOrder.indexOf(b);

              // 両方が定義済みの場合は定義順
              if (indexA != -1 && indexB != -1) {
                return Integer.compare(indexA, indexB);
              }
              // 片方が定義済みの場合は定義済みを優先
              if (indexA != -1) return -1;
              if (indexB != -1) return 1;
              // 両方が未定義の場合はアルファベット順
              return a.compareTo(b);
            })
        .collect(Collectors.toList());
  }

  private StudyBookResponse toResponse(StudyBook studyBook) {
    return new StudyBookResponse(
        studyBook.getId(),
        studyBook.getLanguage(),
        studyBook.getQuestion(),
        studyBook.getExplanation(),
        studyBook.getCreatedAt(),
        studyBook.getUpdatedAt());
  }
}
