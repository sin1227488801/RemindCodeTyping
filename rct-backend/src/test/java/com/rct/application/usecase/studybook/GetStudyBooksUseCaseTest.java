package com.rct.application.usecase.studybook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.studybook.GetStudyBooksUseCase.GetStudyBooksCommand;
import com.rct.application.usecase.studybook.GetStudyBooksUseCase.GetStudyBooksResult;
import com.rct.application.usecase.studybook.GetStudyBooksUseCase.StudyBookRetrievalException;
import com.rct.domain.model.studybook.Language;
import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookRepository;
import com.rct.domain.model.user.UserId;
import com.rct.util.TestDataBuilder;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetStudyBooksUseCase Tests")
class GetStudyBooksUseCaseTest {

  @Mock private StudyBookRepository studyBookRepository;

  private GetStudyBooksUseCase useCase;

  @BeforeEach
  void setUp() {
    useCase = new GetStudyBooksUseCase(studyBookRepository);
  }

  @Test
  @DisplayName("Should get study books by user successfully")
  void shouldGetStudyBooksByUserSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    GetStudyBooksCommand command = new GetStudyBooksCommand(userId, null, 0, 10);

    List<StudyBook> studyBooks =
        Arrays.asList(TestDataBuilder.createUserStudyBook(), TestDataBuilder.createUserStudyBook());
    Page<StudyBook> studyBookPage = new PageImpl<>(studyBooks, PageRequest.of(0, 10), 2);

    when(studyBookRepository.findByUserId(any(UserId.class), any(Pageable.class)))
        .thenReturn(studyBookPage);

    // When
    GetStudyBooksResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBooks()).hasSize(2);
    assertThat(result.getTotalElements()).isEqualTo(2);
    assertThat(result.getTotalPages()).isEqualTo(1);
    assertThat(result.getErrorMessage()).isNull();
    verify(studyBookRepository).findByUserId(any(UserId.class), any(Pageable.class));
  }

  @Test
  @DisplayName("Should get study books by user and language successfully")
  void shouldGetStudyBooksByUserAndLanguageSuccessfully() {
    // Given
    UUID userId = UUID.randomUUID();
    GetStudyBooksCommand command = new GetStudyBooksCommand(userId, "Java", 0, 10);

    List<StudyBook> studyBooks = Arrays.asList(TestDataBuilder.createUserStudyBook());
    Page<StudyBook> studyBookPage = new PageImpl<>(studyBooks, PageRequest.of(0, 10), 1);

    when(studyBookRepository.findByUserIdAndLanguage(
            any(UserId.class), any(Language.class), any(Pageable.class)))
        .thenReturn(studyBookPage);

    // When
    GetStudyBooksResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBooks()).hasSize(1);
    assertThat(result.getTotalElements()).isEqualTo(1);
    assertThat(result.getTotalPages()).isEqualTo(1);
    verify(studyBookRepository)
        .findByUserIdAndLanguage(any(UserId.class), any(Language.class), any(Pageable.class));
  }

  @Test
  @DisplayName("Should get random study books by language successfully")
  void shouldGetRandomStudyBooksByLanguageSuccessfully() {
    // Given
    GetStudyBooksCommand command = new GetStudyBooksCommand(null, "JavaScript", 0, 5);

    List<StudyBook> studyBooks =
        Arrays.asList(
            TestDataBuilder.createSystemStudyBook(),
            TestDataBuilder.createSystemStudyBook(),
            TestDataBuilder.createSystemStudyBook());

    when(studyBookRepository.findRandomByLanguage(any(Language.class), eq(5)))
        .thenReturn(studyBooks);

    // When
    GetStudyBooksResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBooks()).hasSize(3);
    verify(studyBookRepository).findRandomByLanguage(any(Language.class), eq(5));
  }

  @Test
  @DisplayName("Should return empty result when no study books found")
  void shouldReturnEmptyResultWhenNoStudyBooksFound() {
    // Given
    UUID userId = UUID.randomUUID();
    GetStudyBooksCommand command = new GetStudyBooksCommand(userId, null, 0, 10);

    Page<StudyBook> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
    when(studyBookRepository.findByUserId(any(UserId.class), any(Pageable.class)))
        .thenReturn(emptyPage);

    // When
    GetStudyBooksResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getStudyBooks()).isEmpty();
    assertThat(result.getTotalElements()).isEqualTo(0);
    assertThat(result.getTotalPages()).isEqualTo(0);
  }

  @Test
  @DisplayName("Should throw exception when command is null")
  void shouldThrowExceptionWhenCommandIsNull() {
    // When & Then
    assertThatThrownBy(() -> useCase.execute(null))
        .isInstanceOf(NullPointerException.class)
        .hasMessage("Get study books command cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when repository fails")
  void shouldThrowExceptionWhenRepositoryFails() {
    // Given
    UUID userId = UUID.randomUUID();
    GetStudyBooksCommand command = new GetStudyBooksCommand(userId, null, 0, 10);

    when(studyBookRepository.findByUserId(any(UserId.class), any(Pageable.class)))
        .thenThrow(new RuntimeException("Database error"));

    // When & Then
    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(StudyBookRetrievalException.class)
        .hasMessageContaining("Failed to retrieve study books");
  }

  @Test
  @DisplayName("Should use default pagination when page and size are negative")
  void shouldUseDefaultPaginationWhenPageAndSizeAreNegative() {
    // Given
    UUID userId = UUID.randomUUID();
    GetStudyBooksCommand command = new GetStudyBooksCommand(userId, null, -1, -1);

    List<StudyBook> studyBooks = Arrays.asList(TestDataBuilder.createUserStudyBook());
    Page<StudyBook> studyBookPage = new PageImpl<>(studyBooks, PageRequest.of(0, 20), 1);

    when(studyBookRepository.findByUserId(any(UserId.class), any(Pageable.class)))
        .thenReturn(studyBookPage);

    // When
    GetStudyBooksResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    verify(studyBookRepository).findByUserId(any(UserId.class), any(Pageable.class));
  }

  @Test
  @DisplayName("Should handle large page size by limiting to maximum")
  void shouldHandleLargePageSizeByLimitingToMaximum() {
    // Given
    UUID userId = UUID.randomUUID();
    GetStudyBooksCommand command = new GetStudyBooksCommand(userId, null, 0, 1000);

    List<StudyBook> studyBooks = Arrays.asList(TestDataBuilder.createUserStudyBook());
    Page<StudyBook> studyBookPage = new PageImpl<>(studyBooks, PageRequest.of(0, 100), 1);

    when(studyBookRepository.findByUserId(any(UserId.class), any(Pageable.class)))
        .thenReturn(studyBookPage);

    // When
    GetStudyBooksResult result = useCase.execute(command);

    // Then
    assertThat(result.isSuccess()).isTrue();
    verify(studyBookRepository).findByUserId(any(UserId.class), any(Pageable.class));
  }
}
