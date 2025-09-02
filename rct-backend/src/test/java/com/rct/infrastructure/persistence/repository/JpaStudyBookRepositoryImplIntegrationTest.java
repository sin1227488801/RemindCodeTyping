package com.rct.infrastructure.persistence.repository;

import static org.assertj.core.api.Assertions.*;

import com.rct.domain.model.studybook.*;
import com.rct.domain.model.user.UserId;
import com.rct.infrastructure.persistence.BaseRepositoryIntegrationTest;
import com.rct.infrastructure.persistence.mapper.StudyBookMapper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

/**
 * Integration tests for JpaStudyBookRepositoryImpl using TestContainers with PostgreSQL. These
 * tests verify the repository implementation against a real database.
 */
@Import({JpaStudyBookRepositoryImpl.class, StudyBookMapper.class})
@DisplayName("JpaStudyBookRepositoryImpl Integration Tests")
class JpaStudyBookRepositoryImplIntegrationTest extends BaseRepositoryIntegrationTest {

  @Autowired private TestEntityManager entityManager;

  @Autowired private JpaStudyBookEntityRepository jpaStudyBookEntityRepository;

  @Autowired private JpaStudyBookRepositoryImpl studyBookRepository;

  private UserId testUserId;
  private StudyBook testUserStudyBook;
  private StudyBook testSystemStudyBook;

  @BeforeEach
  void setUpTestData() {
    testUserId = new UserId(UUID.randomUUID());

    testUserStudyBook =
        StudyBook.createUserProblem(
            new StudyBookId(UUID.randomUUID()),
            testUserId,
            new Language("Java"),
            new Question("System.out.println(\"Hello World\");"),
            new Explanation("This prints Hello World to the console"));

    testSystemStudyBook =
        StudyBook.createSystemProblem(
            new StudyBookId(UUID.randomUUID()),
            new Language("JavaScript"),
            new Question("console.log(\"Hello World\");"),
            new Explanation("This prints Hello World to the console"));
  }

  @Test
  @DisplayName("Should save new study book and generate ID")
  void shouldSaveNewStudyBookAndGenerateId() {
    // Given
    StudyBook newStudyBook =
        StudyBook.createUserProblem(
            new StudyBookId(null),
            testUserId,
            new Language("Python"),
            new Question("print('Hello World')"),
            new Explanation("Python print statement"));

    // When
    StudyBook savedStudyBook = studyBookRepository.save(newStudyBook);

    // Then
    assertThat(savedStudyBook).isNotNull();
    assertThat(savedStudyBook.getId().getValue()).isNotNull();
    assertThat(savedStudyBook.getUserId()).isEqualTo(testUserId);
    assertThat(savedStudyBook.getLanguage().getValue()).isEqualTo("Python");
    assertThat(savedStudyBook.getQuestion().getContent()).isEqualTo("print('Hello World')");
    assertThat(savedStudyBook.isUserProblem()).isTrue();

    // Verify in database
    entityManager.flush();
    entityManager.clear();

    Optional<StudyBook> foundStudyBook = studyBookRepository.findById(savedStudyBook.getId());
    assertThat(foundStudyBook).isPresent();
    assertThat(foundStudyBook.get().getLanguage().getValue()).isEqualTo("Python");
  }

  @Test
  @DisplayName("Should find study books by user ID")
  void shouldFindStudyBooksByUserId() {
    // Given
    StudyBook savedUserBook = studyBookRepository.save(testUserStudyBook);
    StudyBook savedSystemBook = studyBookRepository.save(testSystemStudyBook);
    entityManager.flush();
    entityManager.clear();

    // When
    List<StudyBook> userStudyBooks = studyBookRepository.findByUserId(testUserId);

    // Then
    assertThat(userStudyBooks).hasSize(1);
    assertThat(userStudyBooks.get(0).getId()).isEqualTo(savedUserBook.getId());
    assertThat(userStudyBooks.get(0).belongsToUser(testUserId)).isTrue();
  }

  @Test
  @DisplayName("Should find study books by user ID and language")
  void shouldFindStudyBooksByUserIdAndLanguage() {
    // Given
    studyBookRepository.save(testUserStudyBook);

    StudyBook anotherJavaBook =
        StudyBook.createUserProblem(
            new StudyBookId(UUID.randomUUID()),
            testUserId,
            new Language("Java"),
            new Question("int x = 5;"),
            new Explanation("Variable declaration"));
    studyBookRepository.save(anotherJavaBook);

    StudyBook pythonBook =
        StudyBook.createUserProblem(
            new StudyBookId(UUID.randomUUID()),
            testUserId,
            new Language("Python"),
            new Question("x = 5"),
            new Explanation("Variable assignment"));
    studyBookRepository.save(pythonBook);

    entityManager.flush();
    entityManager.clear();

    // When
    List<StudyBook> javaBooks = studyBookRepository.findByUserIdAndLanguage(testUserId, "Java");

    // Then
    assertThat(javaBooks).hasSize(2);
    assertThat(javaBooks).allMatch(book -> book.getLanguage().getValue().equals("Java"));
    assertThat(javaBooks).allMatch(book -> book.belongsToUser(testUserId));
  }

  @Test
  @DisplayName("Should find random study books by language")
  void shouldFindRandomStudyBooksByLanguage() {
    // Given
    for (int i = 0; i < 5; i++) {
      StudyBook book =
          StudyBook.createSystemProblem(
              new StudyBookId(UUID.randomUUID()),
              new Language("JavaScript"),
              new Question("console.log(" + i + ");"),
              new Explanation("Print number " + i));
      studyBookRepository.save(book);
    }
    entityManager.flush();
    entityManager.clear();

    // When
    List<StudyBook> randomBooks = studyBookRepository.findRandomByLanguage("JavaScript", 3);

    // Then
    assertThat(randomBooks).hasSize(3);
    assertThat(randomBooks).allMatch(book -> book.getLanguage().getValue().equals("JavaScript"));
  }

  @Test
  @DisplayName("Should find system problems by language")
  void shouldFindSystemProblemsByLanguage() {
    // Given
    studyBookRepository.save(testUserStudyBook); // User problem
    studyBookRepository.save(testSystemStudyBook); // System problem

    StudyBook anotherSystemBook =
        StudyBook.createSystemProblem(
            new StudyBookId(UUID.randomUUID()),
            new Language("JavaScript"),
            new Question("let x = 10;"),
            new Explanation("Variable declaration"));
    studyBookRepository.save(anotherSystemBook);

    entityManager.flush();
    entityManager.clear();

    // When
    List<StudyBook> systemBooks = studyBookRepository.findSystemProblemsByLanguage("JavaScript");

    // Then
    assertThat(systemBooks).hasSize(2);
    assertThat(systemBooks).allMatch(StudyBook::isSystemProblem);
    assertThat(systemBooks).allMatch(book -> book.getLanguage().getValue().equals("JavaScript"));
  }

  @Test
  @DisplayName("Should find study book by ID")
  void shouldFindStudyBookById() {
    // Given
    StudyBook savedBook = studyBookRepository.save(testUserStudyBook);
    entityManager.flush();
    entityManager.clear();

    // When
    Optional<StudyBook> foundBook = studyBookRepository.findById(savedBook.getId());

    // Then
    assertThat(foundBook).isPresent();
    assertThat(foundBook.get().getId()).isEqualTo(savedBook.getId());
    assertThat(foundBook.get().getQuestion().getContent())
        .isEqualTo("System.out.println(\"Hello World\");");
  }

  @Test
  @DisplayName("Should update existing study book")
  void shouldUpdateExistingStudyBook() {
    // Given
    StudyBook savedBook = studyBookRepository.save(testUserStudyBook);
    entityManager.flush();
    entityManager.clear();

    Question newQuestion = new Question("System.out.println(\"Updated Hello World\");");
    Explanation newExplanation = new Explanation("Updated explanation");
    StudyBook updatedBook = savedBook.updateContent(newQuestion, newExplanation);

    // When
    StudyBook result = studyBookRepository.save(updatedBook);

    // Then
    assertThat(result.getId()).isEqualTo(savedBook.getId());
    assertThat(result.getQuestion().getContent())
        .isEqualTo("System.out.println(\"Updated Hello World\");");
    assertThat(result.getExplanation().getContent()).isEqualTo("Updated explanation");

    // Verify in database
    entityManager.flush();
    entityManager.clear();

    Optional<StudyBook> foundBook = studyBookRepository.findById(savedBook.getId());
    assertThat(foundBook).isPresent();
    assertThat(foundBook.get().getQuestion().getContent())
        .isEqualTo("System.out.println(\"Updated Hello World\");");
  }

  @Test
  @DisplayName("Should delete study book by ID")
  void shouldDeleteStudyBookById() {
    // Given
    StudyBook savedBook = studyBookRepository.save(testUserStudyBook);
    entityManager.flush();

    assertThat(studyBookRepository.findById(savedBook.getId())).isPresent();

    // When
    studyBookRepository.deleteById(savedBook.getId());
    entityManager.flush();

    // Then
    assertThat(studyBookRepository.findById(savedBook.getId())).isEmpty();
  }

  @Test
  @DisplayName("Should find all distinct languages")
  void shouldFindAllDistinctLanguages() {
    // Given
    studyBookRepository.save(testUserStudyBook); // Java
    studyBookRepository.save(testSystemStudyBook); // JavaScript

    StudyBook pythonBook =
        StudyBook.createSystemProblem(
            new StudyBookId(UUID.randomUUID()),
            new Language("Python"),
            new Question("print('Hello')"),
            null);
    studyBookRepository.save(pythonBook);

    entityManager.flush();

    // When
    List<String> languages = studyBookRepository.findAllLanguages();

    // Then
    assertThat(languages).containsExactlyInAnyOrder("Java", "JavaScript", "Python");
  }

  @Test
  @DisplayName("Should find system problem languages")
  void shouldFindSystemProblemLanguages() {
    // Given
    studyBookRepository.save(testUserStudyBook); // Java (user problem)
    studyBookRepository.save(testSystemStudyBook); // JavaScript (system problem)

    StudyBook systemPythonBook =
        StudyBook.createSystemProblem(
            new StudyBookId(UUID.randomUUID()),
            new Language("Python"),
            new Question("print('Hello')"),
            null);
    studyBookRepository.save(systemPythonBook);

    entityManager.flush();

    // When
    List<String> systemLanguages = studyBookRepository.findSystemProblemLanguages();

    // Then
    assertThat(systemLanguages).containsExactlyInAnyOrder("JavaScript", "Python");
    assertThat(systemLanguages).doesNotContain("Java"); // Java is only user problem
  }

  @Test
  @DisplayName("Should find user problem languages")
  void shouldFindUserProblemLanguages() {
    // Given
    studyBookRepository.save(testUserStudyBook); // Java (user problem)
    studyBookRepository.save(testSystemStudyBook); // JavaScript (system problem)

    StudyBook userPythonBook =
        StudyBook.createUserProblem(
            new StudyBookId(UUID.randomUUID()),
            testUserId,
            new Language("Python"),
            new Question("x = 5"),
            null);
    studyBookRepository.save(userPythonBook);

    entityManager.flush();

    // When
    List<String> userLanguages = studyBookRepository.findUserProblemLanguages(testUserId);

    // Then
    assertThat(userLanguages).containsExactlyInAnyOrder("Java", "Python");
    assertThat(userLanguages).doesNotContain("JavaScript"); // JavaScript is only system problem
  }

  @Test
  @DisplayName("Should throw exception when saving null study book")
  void shouldThrowExceptionWhenSavingNullStudyBook() {
    // When & Then
    assertThatThrownBy(() -> studyBookRepository.save(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("StudyBook cannot be null");
  }

  @Test
  @DisplayName("Should throw exception when finding by null user ID")
  void shouldThrowExceptionWhenFindingByNullUserId() {
    // When & Then
    assertThatThrownBy(() -> studyBookRepository.findByUserId(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("UserId cannot be null");
  }
}
