package com.rct.util;

import com.rct.domain.model.studybook.Explanation;
import com.rct.domain.model.studybook.Language;
import com.rct.domain.model.studybook.Question;
import com.rct.domain.model.studybook.StudyBook;
import com.rct.domain.model.studybook.StudyBookId;
import com.rct.domain.model.typingsession.Duration;
import com.rct.domain.model.typingsession.TypingResult;
import com.rct.domain.model.typingsession.TypingSessionId;
import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.LoginStatistics;
import com.rct.domain.model.user.PasswordHash;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserId;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Test data builder utility class for creating test entities. Provides fluent API for building test
 * data with sensible defaults.
 */
public final class TestDataBuilder {

  private TestDataBuilder() {
    // Utility class
  }

  /**
   * Creates a UserBuilder for building test User entities.
   *
   * @return A new UserBuilder instance
   */
  public static UserBuilder user() {
    return new UserBuilder();
  }

  /**
   * Creates a StudyBookBuilder for building test StudyBook entities.
   *
   * @return A new StudyBookBuilder instance
   */
  public static StudyBookBuilder studyBook() {
    return new StudyBookBuilder();
  }

  // Domain Model Factory Methods

  /** Creates a test UserId. */
  public static UserId createUserId() {
    return new UserId(UUID.randomUUID());
  }

  /** Creates a test LoginId. */
  public static LoginId createLoginId() {
    return new LoginId("testuser" + System.currentTimeMillis());
  }

  /** Creates a test PasswordHash. */
  public static PasswordHash createPasswordHash() {
    return new PasswordHash("$2a$10$test.hash.value");
  }

  /** Creates a test LoginStatistics. */
  public static LoginStatistics createLoginStatistics() {
    return new LoginStatistics(LocalDate.now(), 5, 10, 25);
  }

  /** Creates a test User domain model. */
  public static com.rct.domain.model.user.User createUser() {
    return com.rct.domain.model.user.User.createNew(
        createUserId(), createLoginId(), createPasswordHash(), createLoginStatistics());
  }

  /** Creates a test User domain model with specific UserId. */
  public static com.rct.domain.model.user.User createUserWithId(UserId userId) {
    return com.rct.domain.model.user.User.createNew(
        userId, createLoginId(), createPasswordHash(), createLoginStatistics());
  }

  /** Creates a test StudyBookId. */
  public static StudyBookId createStudyBookId() {
    return new StudyBookId(UUID.randomUUID());
  }

  /** Creates a test Language. */
  public static Language createLanguage() {
    return new Language("Java");
  }

  /** Creates a test Question. */
  public static Question createQuestion() {
    return new Question("Write a function to calculate factorial of a number");
  }

  /** Creates a test Explanation. */
  public static Explanation createExplanation() {
    return new Explanation("Use recursion or iteration to solve this problem");
  }

  /** Creates a test user StudyBook domain model. */
  public static com.rct.domain.model.studybook.StudyBook createUserStudyBook() {
    return com.rct.domain.model.studybook.StudyBook.createUserProblem(
        createStudyBookId(),
        createUserId(),
        createLanguage(),
        createQuestion(),
        createExplanation());
  }

  /** Creates a test user StudyBook domain model with specific StudyBookId. */
  public static com.rct.domain.model.studybook.StudyBook createUserStudyBookWithId(StudyBookId id) {
    return com.rct.domain.model.studybook.StudyBook.createUserProblem(
        id, createUserId(), createLanguage(), createQuestion(), createExplanation());
  }

  /** Creates a test user StudyBook domain model for specific user. */
  public static com.rct.domain.model.studybook.StudyBook createUserStudyBookForUser(UserId userId) {
    return com.rct.domain.model.studybook.StudyBook.createUserProblem(
        createStudyBookId(), userId, createLanguage(), createQuestion(), createExplanation());
  }

  /** Creates a test system StudyBook domain model. */
  public static com.rct.domain.model.studybook.StudyBook createSystemStudyBook() {
    return com.rct.domain.model.studybook.StudyBook.createSystemProblem(
        createStudyBookId(), createLanguage(), createQuestion(), createExplanation());
  }

  /** Creates a test TypingSessionId. */
  public static TypingSessionId createTypingSessionId() {
    return new TypingSessionId(UUID.randomUUID());
  }

  /** Creates a test Duration. */
  public static Duration createDuration() {
    return new Duration(30000); // 30 seconds
  }

  /** Creates a test TypingResult. */
  public static TypingResult createTypingResult() {
    return new TypingResult(100, 95, createDuration());
  }

  /** Creates a test TypingSession domain model. */
  public static com.rct.domain.model.typingsession.TypingSession createTypingSession() {
    return com.rct.domain.model.typingsession.TypingSession.start(
        createTypingSessionId(), createUserId(), createStudyBookId(), LocalDateTime.now());
  }

  /** Builder class for User entities. */
  public static class UserBuilder {
    private Long id;
    private String loginId = "testuser";
    private String password = "password123";
    private LocalDate lastLoginDate = LocalDate.now();
    private Integer consecutiveLoginDays = 1;
    private Integer maxConsecutiveLoginDays = 5;
    private Integer totalLoginDays = 10;

    public UserBuilder withId(Long id) {
      this.id = id;
      return this;
    }

    public UserBuilder withLoginId(String loginId) {
      this.loginId = loginId;
      return this;
    }

    public UserBuilder withPassword(String password) {
      this.password = password;
      return this;
    }

    public UserBuilder withLastLoginDate(LocalDate lastLoginDate) {
      this.lastLoginDate = lastLoginDate;
      return this;
    }

    public UserBuilder withConsecutiveLoginDays(Integer consecutiveLoginDays) {
      this.consecutiveLoginDays = consecutiveLoginDays;
      return this;
    }

    public UserBuilder withMaxConsecutiveLoginDays(Integer maxConsecutiveLoginDays) {
      this.maxConsecutiveLoginDays = maxConsecutiveLoginDays;
      return this;
    }

    public UserBuilder withTotalLoginDays(Integer totalLoginDays) {
      this.totalLoginDays = totalLoginDays;
      return this;
    }

    public User build() {
      User user = new User();
      user.setId(id);
      user.setLoginId(loginId);
      user.setPassword(password);
      user.setLastLoginDate(lastLoginDate);
      user.setConsecutiveLoginDays(consecutiveLoginDays);
      user.setMaxConsecutiveLoginDays(maxConsecutiveLoginDays);
      user.setTotalLoginDays(totalLoginDays);
      return user;
    }
  }

  /** Builder class for StudyBook entities. */
  public static class StudyBookBuilder {
    private Long id;
    private Long userId = 1L;
    private String language = "Java";
    private String question = "System.out.println(\"Hello World\");";
    private String explanation = "Basic Java print statement";
    private Boolean isSystemProblem = false;

    public StudyBookBuilder withId(Long id) {
      this.id = id;
      return this;
    }

    public StudyBookBuilder withUserId(Long userId) {
      this.userId = userId;
      return this;
    }

    public StudyBookBuilder withLanguage(String language) {
      this.language = language;
      return this;
    }

    public StudyBookBuilder withQuestion(String question) {
      this.question = question;
      return this;
    }

    public StudyBookBuilder withExplanation(String explanation) {
      this.explanation = explanation;
      return this;
    }

    public StudyBookBuilder withIsSystemProblem(Boolean isSystemProblem) {
      this.isSystemProblem = isSystemProblem;
      return this;
    }

    public StudyBookBuilder asSystemProblem() {
      this.isSystemProblem = true;
      return this;
    }

    public StudyBookBuilder asUserProblem() {
      this.isSystemProblem = false;
      return this;
    }

    public StudyBook build() {
      StudyBook studyBook = new StudyBook();
      studyBook.setId(id);
      studyBook.setUserId(userId);
      studyBook.setLanguage(language);
      studyBook.setQuestion(question);
      studyBook.setExplanation(explanation);
      studyBook.setIsSystemProblem(isSystemProblem);
      return studyBook;
    }
  }
}
