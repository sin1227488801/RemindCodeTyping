package com.rct.domain.model.user;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * RemindCodeTypingシステムのユーザーを表すドメインエンティティ
 *
 * <p>このエンティティはユーザー関連のすべてのビジネスロジックをカプセル化し、ドメイン不変条件を維持します。
 * ドメイン駆動設計の原則に従い、ビジネスルールをエンティティ内に保持し、適切なカプセル化によってデータの整合性を保証します。
 *
 * <p>主な責務:
 *
 * <ul>
 *   <li>ユーザーのアイデンティティと認証情報の管理
 *   <li>ログイン統計と連続ログイン日数の追跡
 *   <li>ユーザーロールベースの権限制御
 *   <li>監査情報（作成・更新タイムスタンプ）の維持
 * </ul>
 *
 * <p>ビジネスルール:
 *
 * <ul>
 *   <li>ユーザーIDは一意かつ不変でなければならない
 *   <li>ログインIDはシステム全体で一意でなければならない
 *   <li>パスワードは保存前に適切にハッシュ化されなければならない
 *   <li>ログイン統計は認証成功時に自動更新される
 *   <li>ユーザーは権限を決定するロールを持つ
 * </ul>
 *
 * <p>使用例:
 *
 * <pre>{@code
 * // 新しいユーザーを作成
 * User user = User.create(
 *     UserId.generate(),
 *     LoginId.of("john_doe"),
 *     PasswordHash.of("hashed_password")
 * );
 *
 * // ログインを記録
 * user.recordLogin(LocalDate.now());
 *
 * // 権限をチェック
 * if (user.hasPermission("CREATE_STUDY_BOOK")) {
 *     // 操作を許可
 * }
 * }</pre>
 *
 * @author RCT開発チーム
 * @since 1.0.0
 * @see UserId
 * @see LoginId
 * @see PasswordHash
 * @see LoginStatistics
 * @see Role
 */
public class User {
  private final UserId id;
  private final LoginId loginId;
  private final PasswordHash passwordHash;
  private final Role role;
  private LoginStatistics loginStatistics;
  private final LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  private User(
      UserId id,
      LoginId loginId,
      PasswordHash passwordHash,
      Role role,
      LoginStatistics loginStatistics,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    this.id = Objects.requireNonNull(id, "User ID cannot be null");
    this.loginId = Objects.requireNonNull(loginId, "Login ID cannot be null");
    this.passwordHash = Objects.requireNonNull(passwordHash, "Password hash cannot be null");
    this.role = Objects.requireNonNull(role, "Role cannot be null");
    this.loginStatistics =
        Objects.requireNonNull(loginStatistics, "Login statistics cannot be null");
    this.createdAt = Objects.requireNonNull(createdAt, "Created at cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "Updated at cannot be null");
  }

  /**
   * 初期ログイン統計とデフォルトのUSERロールで新しいユーザーを作成します
   *
   * <p>このファクトリメソッドは以下の設定で新しいユーザーインスタンスを作成します:
   *
   * <ul>
   *   <li>標準権限を持つデフォルトのUSERロール
   *   <li>初期ログイン統計（ログイン日数と連続日数はゼロ）
   *   <li>作成・更新時刻の現在タイムスタンプ
   * </ul>
   *
   * @param id 一意のユーザー識別子、nullであってはならない
   * @param loginId 一意のログイン識別子、nullであってはならない
   * @param passwordHash ハッシュ化されたパスワード、nullであってはならない
   * @return デフォルト設定の新しいUserインスタンス
   * @throws NullPointerException いずれかのパラメータがnullの場合
   * @since 1.0.0
   */
  public static User create(UserId id, LoginId loginId, PasswordHash passwordHash) {
    LocalDateTime now = LocalDateTime.now();
    return new User(id, loginId, passwordHash, Role.user(), LoginStatistics.initial(), now, now);
  }

  /**
   * 指定されたロールで新しいユーザーを作成します
   *
   * <p>このファクトリメソッドはADMINやGUESTなどのカスタムロールでユーザーを作成できます。
   * ユーザーは初期ログイン統計と現在のタイムスタンプを持ちます。
   *
   * @param id 一意のユーザー識別子、nullであってはならない
   * @param loginId 一意のログイン識別子、nullであってはならない
   * @param passwordHash ハッシュ化されたパスワード、nullであってはならない
   * @param role 権限を決定するユーザーロール、nullであってはならない
   * @return 指定されたロールの新しいUserインスタンス
   * @throws NullPointerException いずれかのパラメータがnullの場合
   * @since 1.0.0
   */
  public static User create(UserId id, LoginId loginId, PasswordHash passwordHash, Role role) {
    LocalDateTime now = LocalDateTime.now();
    return new User(id, loginId, passwordHash, role, LoginStatistics.initial(), now, now);
  }

  /** 永続化からユーザーを再構築します（リポジトリ実装用） */
  public static User reconstruct(
      UserId id,
      LoginId loginId,
      PasswordHash passwordHash,
      Role role,
      LoginStatistics loginStatistics,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {
    return new User(id, loginId, passwordHash, role, loginStatistics, createdAt, updatedAt);
  }

  /**
   * ログイン成功を記録し、ログイン統計を更新します
   *
   * <p>このメソッドはユーザーエンゲージメント追跡のコアビジネスロジックを実装します:
   *
   * <ul>
   *   <li>連続ログイン日数（ストリーク）の更新
   *   <li>達成した最大連続日数の追跡
   *   <li>総ログイン日数の増加
   *   <li>最終ログイン日の更新
   *   <li>更新タイムスタンプを現在時刻に設定
   * </ul>
   *
   * <p>ビジネスルール:
   *
   * <ul>
   *   <li>ユーザーが連続してログインした場合、ストリークが増加
   *   <li>ユーザーが1日スキップした場合、ストリークは1にリセット
   *   <li>最大ストリークはゲーミフィケーションのために保持
   *   <li>総日数は一意のログイン日をカウント
   * </ul>
   *
   * @param loginDate ログインの日付、nullであってはならない
   * @throws NullPointerException loginDateがnullの場合
   * @since 1.0.0
   */
  public void recordLogin(LocalDate loginDate) {
    Objects.requireNonNull(loginDate, "Login date cannot be null");
    this.loginStatistics = this.loginStatistics.updateForLogin(loginDate);
    this.updatedAt = LocalDateTime.now();
  }

  /** ユーザーが今日ログインしたかどうかをチェックします */
  public boolean hasLoggedInToday() {
    return loginStatistics.hasLoggedInToday();
  }

  /** 現在のログインストリークを取得します */
  public int getCurrentLoginStreak() {
    return loginStatistics.getConsecutiveDays();
  }

  /** 達成した最大ログインストリークを取得します */
  public int getMaxLoginStreak() {
    return loginStatistics.getMaxConsecutiveDays();
  }

  /** 総ログイン日数を取得します */
  public int getTotalLoginDays() {
    return loginStatistics.getTotalDays();
  }

  /** このユーザーが指定されたログインIDと一致するかチェックします */
  public boolean hasLoginId(LoginId loginId) {
    return this.loginId.equals(loginId);
  }

  /** ユーザーが指定された権限を持っているかチェックします */
  public boolean hasPermission(String permission) {
    return role.hasPermission(permission);
  }

  /** ユーザーが管理者かどうかチェックします */
  public boolean isAdmin() {
    return role.isAdmin();
  }

  /** ユーザーがゲストかどうかチェックします */
  public boolean isGuest() {
    return role.isGuest();
  }

  // Getters
  public UserId getId() {
    return id;
  }

  public LoginId getLoginId() {
    return loginId;
  }

  public PasswordHash getPasswordHash() {
    return passwordHash;
  }

  public Role getRole() {
    return role;
  }

  public LoginStatistics getLoginStatistics() {
    return loginStatistics;
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
    User user = (User) obj;
    return Objects.equals(id, user.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }

  @Override
  public String toString() {
    return "User{"
        + "id="
        + id
        + ", loginId="
        + loginId
        + ", loginStatistics="
        + loginStatistics
        + ", createdAt="
        + createdAt
        + ", updatedAt="
        + updatedAt
        + '}';
  }
}
