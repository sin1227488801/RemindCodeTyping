package com.rct.domain.model.studybook;

import com.rct.domain.model.user.UserId;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * タイピング練習用のコーディング問題や質問を表すStudyBookドメインエンティティ
 *
 * <p>このエンティティは学習帳関連のすべてのビジネスロジックをカプセル化し、ドメイン不変条件を維持します。
 * ユーザー作成問題とシステム提供問題の両方をサポートし、それぞれ異なるビジネスルールと制約を持ちます。
 *
 * <p>主な責務:
 *
 * <ul>
 *   <li>コーディング問題と解説の管理
 *   <li>所有権ルールの強制（ユーザー問題 vs システム問題）
 *   <li>ビジネスルールに従ったコンテンツの検証
 *   <li>適切な認可によるコンテンツ更新のサポート
 * </ul>
 *
 * <p>ビジネスルール:
 *
 * <ul>
 *   <li>ユーザー問題は特定のユーザーに属し、変更可能
 *   <li>システム問題はグローバルで作成後は不変
 *   <li>すべての問題はプログラミング言語と問題文を持つ必要がある
 *   <li>解説はオプションだが学習のために推奨
 *   <li>問題文は有効なコードまたはコーディング概念を含む必要がある
 * </ul>
 *
 * <p>使用例:
 *
 * <pre>{@code
 * // ユーザー問題を作成
 * StudyBook userProblem = StudyBook.createUserProblem(
 *     StudyBookId.generate(),
 *     UserId.of("user123"),
 *     Language.of("JavaScript"),
 *     Question.of("console.log('Hello World');"),
 *     Explanation.of("基本的なコンソール出力")
 * );
 *
 * // システム問題を作成
 * StudyBook systemProblem = StudyBook.createSystemProblem(
 *     StudyBookId.generate(),
 *     Language.of("Java"),
 *     Question.of("public static void main(String[] args) {}"),
 *     Explanation.of("Javaのmainメソッドシグネチャ")
 * );
 *
 * // ユーザー問題を更新（システム問題は更新不可）
 * if (studyBook.belongsToUser(currentUserId)) {
 *     StudyBook updated = studyBook.updateContent(newQuestion, newExplanation);
 * }
 * }</pre>
 *
 * @author RCT開発チーム
 * @since 1.0.0
 * @see StudyBookId
 * @see Language
 * @see Question
 * @see Explanation
 * @see UserId
 */
public final class StudyBook {
  private final StudyBookId id;
  private final UserId userId; // null for system problems
  private final Language language;
  private final Question question;
  private final Explanation explanation;
  private final boolean isSystemProblem;
  private final LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  private StudyBook(
      StudyBookId id,
      UserId userId,
      Language language,
      Question question,
      Explanation explanation,
      boolean isSystemProblem,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    this.id = Objects.requireNonNull(id, "StudyBook ID cannot be null");
    this.userId = userId; // Can be null for system problems
    this.language = Objects.requireNonNull(language, "Language cannot be null");
    this.question = Objects.requireNonNull(question, "Question cannot be null");
    this.explanation = explanation; // Can be null
    this.isSystemProblem = isSystemProblem;
    this.createdAt = Objects.requireNonNull(createdAt, "Created at cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "Updated at cannot be null");
  }

  /**
   * 新しいユーザー所有の学習帳問題を作成します
   *
   * <p>ユーザー問題は特定のユーザーが所有し、そのユーザーによって変更可能です。
   * 明示的に共有されない限り、ユーザーのプライベートです。ユーザーはコンテンツを完全に制御でき、
   * 問題を更新または削除できます。
   *
   * @param id 一意の学習帳識別子、nullであってはならない
   * @param userId 所有者のユーザー識別子、ユーザー問題ではnullであってはならない
   * @param language プログラミング言語、nullであってはならない
   * @param question コーディング問題、nullであってはならない
   * @param explanation オプションの解説または解答、nullでも可
   * @return 新しいユーザー所有のStudyBookインスタンス
   * @throws NullPointerException id、userId、language、questionのいずれかがnullの場合
   * @since 1.0.0
   */
  public static StudyBook createUserProblem(
      StudyBookId id,
      UserId userId,
      Language language,
      Question question,
      Explanation explanation) {
    Objects.requireNonNull(userId, "User ID cannot be null for user problems");
    LocalDateTime now = LocalDateTime.now();
    return new StudyBook(id, userId, language, question, explanation, false, now, now);
  }

  /**
   * 新しいシステム提供の学習帳問題を作成します
   *
   * <p>システム問題はアプリケーション管理者によって提供される厳選されたコンテンツです。
   * 作成後は不変で、すべてのユーザーがグローバルに利用でき、通常は練習用の
   * 高品質でよくテストされたコーディング問題を表します。
   *
   * @param id 一意の学習帳識別子、nullであってはならない
   * @param language プログラミング言語、nullであってはならない
   * @param question コーディング問題、nullであってはならない
   * @param explanation オプションの解説または解答、nullでも可
   * @return 新しいシステム所有のStudyBookインスタンス
   * @throws NullPointerException id、language、questionのいずれかがnullの場合
   * @since 1.0.0
   */
  public static StudyBook createSystemProblem(
      StudyBookId id, Language language, Question question, Explanation explanation) {
    LocalDateTime now = LocalDateTime.now();
    return new StudyBook(id, null, language, question, explanation, true, now, now);
  }

  /** 永続化から学習帳を再構築します（リポジトリ実装用） */
  public static StudyBook reconstruct(
      StudyBookId id,
      UserId userId,
      Language language,
      Question question,
      Explanation explanation,
      boolean isSystemProblem,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    return new StudyBook(
        id, userId, language, question, explanation, isSystemProblem, createdAt, updatedAt);
  }

  /**
   * 学習帳のコンテンツを更新します
   * ビジネスルール: ユーザー問題のみ更新可能、システム問題は不変
   */
  public StudyBook updateContent(Question newQuestion, Explanation newExplanation) {
    if (isSystemProblem) {
      throw new IllegalStateException("System problems cannot be updated");
    }

    LocalDateTime now = LocalDateTime.now();
    return new StudyBook(
        id, userId, language, newQuestion, newExplanation, isSystemProblem, createdAt, now);
  }

  /** この学習帳が指定されたユーザーに属するかチェックします */
  public boolean belongsToUser(UserId userId) {
    return Objects.equals(this.userId, userId);
  }

  /** これがシステム問題かどうかチェックします */
  public boolean isSystemProblem() {
    return isSystemProblem;
  }

  /** これがユーザー問題かどうかチェックします */
  public boolean isUserProblem() {
    return !isSystemProblem;
  }

  /** 学習帳のコンテンツを検証します */
  public void validate() {
    language.validate();
    question.validate();
    if (explanation != null) {
      explanation.validate();
    }
  }

  // Getters
  public StudyBookId getId() {
    return id;
  }

  public UserId getUserId() {
    return userId;
  }

  public Language getLanguage() {
    return language;
  }

  public Question getQuestion() {
    return question;
  }

  public Explanation getExplanation() {
    return explanation;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    StudyBook studyBook = (StudyBook) obj;
    return Objects.equals(id, studyBook.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }

  @Override
  public String toString() {
    return String.format(
        "StudyBook{id=%s, userId=%s, language=%s, isSystemProblem=%s}",
        id, userId, language, isSystemProblem);
  }
}
