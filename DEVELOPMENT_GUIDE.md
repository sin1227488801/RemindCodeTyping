# RCT 開発ガイド - 初学者向け詳細解説

## 🎯 このガイドの目的

このガイドは、プログラミング初学者がRemindCodeTyping（RCT）プロジェクトを理解し、
保守・運用・改修を行えるようになることを目的としています。

## 📚 前提知識

### 必要な基礎知識
- **Java**: オブジェクト指向プログラミングの基本
- **JavaScript**: ES6+ の基本文法
- **HTML/CSS**: Web ページの基本構造
- **SQL**: データベースの基本操作
- **Git**: バージョン管理の基本

### 推奨学習リソース
- [Java チュートリアル](https://docs.oracle.com/javase/tutorial/)
- [MDN JavaScript ガイド](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide)
- [Spring Boot 公式ガイド](https://spring.io/guides)

## 🏗️ アーキテクチャの理解

### クリーンアーキテクチャとは？

クリーンアーキテクチャは、ソフトウェアを層に分けて設計する手法です。
各層には明確な責任があり、依存関係の方向が決まっています。

```
外側 → 内側への依存のみ許可

┌─────────────────────────────────────┐
│     プレゼンテーション層              │ ← ユーザーとの接点
│     (UI, API)                      │
├─────────────────────────────────────┤
│     アプリケーション層               │ ← ビジネスフローの制御
│     (ユースケース, サービス)         │
├─────────────────────────────────────┤
│     ドメイン層                      │ ← ビジネスルールの中核
│     (エンティティ, 値オブジェクト)    │
├─────────────────────────────────────┤
│     インフラストラクチャ層           │ ← 技術的な実装詳細
│     (データベース, 外部API)          │
└─────────────────────────────────────┘
```

### なぜこの構造にするのか？

1. **変更の影響を限定**: 一つの層の変更が他の層に影響しにくい
2. **テストしやすい**: 各層を独立してテストできる
3. **理解しやすい**: 責任が明確で、どこに何があるかわかりやすい
4. **再利用しやすい**: ビジネスロジックを他のシステムでも使える

## 🔍 各層の詳細解説

### 1. ドメイン層（Domain Layer）

**役割**: ビジネスの核となるルールとデータを管理

#### エンティティ（Entity）の例
```java
/**
 * ユーザーエンティティ
 * ビジネスルール: ユーザーは一意のIDを持ち、ログイン統計を管理する
 */
public class User {
    private final UserId id;           // 一意識別子（変更不可）
    private final LoginId loginId;     // ログインID（変更不可）
    private LoginStatistics statistics; // ログイン統計（変更可能）
    
    /**
     * ログインを記録する（ビジネスロジック）
     * - 連続ログイン日数を更新
     * - 最大連続日数を記録
     * - 総ログイン日数を増加
     */
    public void recordLogin(LocalDate loginDate) {
        // ビジネスルールをここに実装
        this.statistics = this.statistics.updateForLogin(loginDate);
    }
}
```

#### 値オブジェクト（Value Object）の例
```java
/**
 * ユーザーID値オブジェクト
 * 特徴: 不変（一度作ったら変更できない）
 */
public class UserId {
    private final String value;
    
    private UserId(String value) {
        // 検証ロジック: nullや空文字は許可しない
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("ユーザーIDは空にできません");
        }
        this.value = value;
    }
    
    // ファクトリーメソッド: オブジェクト作成の唯一の方法
    public static UserId of(String value) {
        return new UserId(value);
    }
}
```

### 2. アプリケーション層（Application Layer）

**役割**: ビジネスフローの調整と外部からの要求処理

#### ユースケース（Use Case）の例
```java
/**
 * ユーザー認証ユースケース
 * 目的: ログイン処理の一連の流れを管理
 */
@Service
public class AuthenticateUserUseCase {
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final JwtTokenService tokenService;
    
    /**
     * ユーザー認証を実行
     * 
     * 処理フロー:
     * 1. ログインIDでユーザーを検索
     * 2. パスワードを検証
     * 3. ログインを記録
     * 4. JWTトークンを生成
     * 5. 結果を返却
     */
    public AuthenticationResult authenticate(LoginId loginId, String password) {
        // 1. ユーザー検索
        User user = userRepository.findByLoginId(loginId)
            .orElseThrow(() -> new AuthenticationException("ユーザーが見つかりません"));
        
        // 2. パスワード検証
        if (!passwordService.matches(password, user.getPasswordHash())) {
            throw new AuthenticationException("パスワードが正しくありません");
        }
        
        // 3. ログイン記録（ドメインロジック呼び出し）
        user.recordLogin(LocalDate.now());
        userRepository.save(user);
        
        // 4. トークン生成
        String token = tokenService.generateToken(user);
        
        // 5. 結果返却
        return AuthenticationResult.success(user, token);
    }
}
```

#### アプリケーションサービス（Application Service）の例
```java
/**
 * 認証アプリケーションサービス
 * 目的: 複数のユースケースを組み合わせた高レベル処理
 */
@Service
public class AuthenticationApplicationService {
    private final AuthenticateUserUseCase authenticateUseCase;
    private final RegisterUserUseCase registerUseCase;
    
    /**
     * ログイン処理
     * フロントエンドからの要求を受けて、適切なユースケースを呼び出す
     */
    public AuthenticationResult login(String loginId, String password) {
        try {
            return authenticateUseCase.authenticate(
                LoginId.of(loginId), 
                password
            );
        } catch (Exception e) {
            // エラーログ出力
            log.error("ログイン処理でエラーが発生しました: {}", e.getMessage());
            throw e;
        }
    }
}
```

### 3. インフラストラクチャ層（Infrastructure Layer）

**役割**: 技術的な実装詳細（データベース、外部API等）

#### リポジトリ実装の例
```java
/**
 * JPA を使ったユーザーリポジトリの実装
 * 目的: ドメイン層のUserRepositoryインターフェースを実装
 */
@Repository
public class JpaUserRepositoryImpl implements UserRepository {
    private final JpaUserEntityRepository jpaRepository;
    private final UserMapper mapper;
    
    /**
     * ログインIDでユーザーを検索
     * 
     * 処理の流れ:
     * 1. JPA でデータベースから検索
     * 2. エンティティをドメインオブジェクトに変換
     * 3. Optional で結果を返却
     */
    @Override
    public Optional<User> findByLoginId(LoginId loginId) {
        return jpaRepository.findByLoginId(loginId.getValue())
            .map(mapper::toDomain);  // エンティティ → ドメインオブジェクト変換
    }
    
    /**
     * ユーザーを保存
     * 
     * 処理の流れ:
     * 1. ドメインオブジェクトをエンティティに変換
     * 2. JPA でデータベースに保存
     * 3. 保存結果をドメインオブジェクトに変換して返却
     */
    @Override
    public User save(User user) {
        UserEntity entity = mapper.toEntity(user);  // ドメイン → エンティティ変換
        UserEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);  // エンティティ → ドメイン変換
    }
}
```

#### マッパー（Mapper）の例
```java
/**
 * ユーザーマッパー
 * 目的: ドメインオブジェクトとJPAエンティティの相互変換
 */
@Component
public class UserMapper {
    
    /**
     * JPAエンティティからドメインオブジェクトに変換
     * 
     * 注意点:
     * - エンティティの各フィールドを適切なドメインオブジェクトに変換
     * - null チェックを忘れずに行う
     * - ビジネスルールに従った変換を行う
     */
    public User toDomain(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return User.reconstruct(
            UserId.of(entity.getId()),
            LoginId.of(entity.getLoginId()),
            PasswordHash.of(entity.getPasswordHash()),
            Role.valueOf(entity.getRole()),
            LoginStatistics.of(
                entity.getLastLoginDate(),
                entity.getConsecutiveDays(),
                entity.getMaxConsecutiveDays(),
                entity.getTotalDays()
            ),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
    
    /**
     * ドメインオブジェクトからJPAエンティティに変換
     */
    public UserEntity toEntity(User user) {
        if (user == null) {
            return null;
        }
        
        UserEntity entity = new UserEntity();
        entity.setId(user.getId().getValue());
        entity.setLoginId(user.getLoginId().getValue());
        entity.setPasswordHash(user.getPasswordHash().getValue());
        entity.setRole(user.getRole().name());
        
        LoginStatistics stats = user.getLoginStatistics();
        entity.setLastLoginDate(stats.getLastLoginDate());
        entity.setConsecutiveDays(stats.getConsecutiveDays());
        entity.setMaxConsecutiveDays(stats.getMaxConsecutiveDays());
        entity.setTotalDays(stats.getTotalDays());
        
        entity.setCreatedAt(user.getCreatedAt());
        entity.setUpdatedAt(user.getUpdatedAt());
        
        return entity;
    }
}
```

### 4. プレゼンテーション層（Presentation Layer）

**役割**: 外部とのインターフェース（REST API、Web UI）

#### REST コントローラーの例
```java
/**
 * 認証コントローラー
 * 目的: 認証関連のHTTPエンドポイントを提供
 */
@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
    private final AuthenticationApplicationService authService;
    private final AuthenticationDtoMapper mapper;
    
    /**
     * ログインエンドポイント
     * 
     * 処理の流れ:
     * 1. リクエストの検証
     * 2. アプリケーションサービスの呼び出し
     * 3. レスポンスの生成
     * 4. エラーハンドリング
     */
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(
            @Valid @RequestBody LoginRequest request) {
        
        try {
            // アプリケーションサービス呼び出し
            AuthenticationResult result = authService.login(
                request.getLoginId(),
                request.getPassword()
            );
            
            // レスポンス生成
            AuthenticationResponse response = mapper.toResponse(result);
            
            return ResponseEntity.ok(response);
            
        } catch (AuthenticationException e) {
            // 認証エラーの場合は401を返却
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, 
                e.getMessage()
            );
        }
    }
}
```

#### フロントエンド コントローラーの例
```javascript
/**
 * 認証コントローラー（フロントエンド）
 * 目的: 認証関連のUI操作とビジネスロジックを調整
 */
class AuthController {
    constructor(authService, userRepository, errorHandler) {
        this.authService = authService;      // 認証サービス
        this.userRepository = userRepository; // ユーザー状態管理
        this.errorHandler = errorHandler;     // エラーハンドリング
    }
    
    /**
     * ログインフォーム送信処理
     * 
     * 処理の流れ:
     * 1. フォームデータの取得と検証
     * 2. ローディング状態の表示
     * 3. 認証サービスの呼び出し
     * 4. 成功時の処理（ユーザー保存、リダイレクト）
     * 5. エラー時の処理（エラーメッセージ表示）
     */
    async handleLogin(event) {
        event.preventDefault();
        
        try {
            // 1. フォームデータ取得
            const formData = new FormData(event.target);
            const credentials = {
                loginId: formData.get('loginId')?.trim(),
                password: formData.get('password')
            };
            
            // 2. 入力検証
            const validationResult = this.validateLoginCredentials(credentials);
            if (!validationResult.isValid) {
                this.displayValidationErrors(validationResult.errors);
                return;
            }
            
            // 3. ローディング状態表示
            this.setLoadingState(true);
            
            // 4. 認証サービス呼び出し
            const result = await this.authService.login(
                credentials.loginId, 
                credentials.password
            );
            
            if (result.success) {
                // 5. 成功時処理
                this.userRepository.setCurrentUser(result.user);
                this.onLoginSuccess(result.user);
            } else {
                // 6. 失敗時処理
                this.displayError(result.error || 'ログインに失敗しました');
            }
            
        } catch (error) {
            // 7. 例外処理
            this.errorHandler.handle(error, { context: 'login' });
        } finally {
            // 8. 後処理（ローディング状態解除）
            this.setLoadingState(false);
        }
    }
    
    /**
     * 入力検証
     * 目的: ユーザー入力の妥当性をチェック
     */
    validateLoginCredentials(credentials) {
        const errors = [];
        
        // ログインID検証
        if (!credentials.loginId) {
            errors.push(ValidationError.required('loginId'));
        } else if (credentials.loginId.length < 3) {
            errors.push(ValidationError.invalidLength('loginId', 3, null, credentials.loginId));
        }
        
        // パスワード検証
        if (!credentials.password) {
            errors.push(ValidationError.required('password'));
        } else if (credentials.password.length < 6) {
            errors.push(ValidationError.invalidLength('password', 6, null, credentials.password));
        }
        
        return errors.length > 0 
            ? ValidationResult.failure(errors) 
            : ValidationResult.success();
    }
}
```

## 🔧 開発作業の進め方

### 新機能追加の手順

#### 1. 要件の理解
```
例: 「学習帳にタグ機能を追加したい」

質問すべきこと:
- タグはどのような情報を持つか？（名前、色、説明など）
- 一つの学習帳に複数のタグを付けられるか？
- タグで学習帳を検索できるようにするか？
- 誰がタグを作成・管理するか？
```

#### 2. ドメインモデルの設計
```java
/**
 * タグ値オブジェクト
 * ビジネスルール: タグは名前と色を持つ不変オブジェクト
 */
public class Tag {
    private final String name;    // タグ名（必須、1-20文字）
    private final String color;   // 色コード（必須、#RRGGBB形式）
    
    private Tag(String name, String color) {
        validateName(name);
        validateColor(color);
        this.name = name;
        this.color = color;
    }
    
    public static Tag of(String name, String color) {
        return new Tag(name, color);
    }
    
    private void validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("タグ名は必須です");
        }
        if (name.length() > 20) {
            throw new IllegalArgumentException("タグ名は20文字以内で入力してください");
        }
    }
    
    private void validateColor(String color) {
        if (color == null || !color.matches("^#[0-9A-Fa-f]{6}$")) {
            throw new IllegalArgumentException("色は#RRGGBB形式で入力してください");
        }
    }
}
```

#### 3. エンティティの更新
```java
/**
 * StudyBook エンティティにタグ機能を追加
 */
public final class StudyBook {
    // 既存のフィールド
    private final StudyBookId id;
    private final UserId userId;
    private final Language language;
    private final Question question;
    private final Explanation explanation;
    
    // 新規追加: タグのセット
    private final Set<Tag> tags;
    
    /**
     * タグを追加する
     * ビジネスルール: 一つの学習帳に最大5個までタグを付けられる
     */
    public StudyBook addTag(Tag tag) {
        if (tags.size() >= 5) {
            throw new IllegalStateException("タグは最大5個まで追加できます");
        }
        
        Set<Tag> newTags = new HashSet<>(this.tags);
        newTags.add(tag);
        
        return new StudyBook(
            id, userId, language, question, explanation, 
            newTags,  // 新しいタグセット
            isSystemProblem, createdAt, LocalDateTime.now()
        );
    }
    
    /**
     * 指定されたタグを持っているかチェック
     */
    public boolean hasTag(Tag tag) {
        return tags.contains(tag);
    }
}
```

#### 4. ユースケースの実装
```java
/**
 * 学習帳にタグを追加するユースケース
 */
@Service
public class AddTagToStudyBookUseCase {
    private final StudyBookRepository studyBookRepository;
    
    /**
     * 学習帳にタグを追加
     * 
     * 処理フロー:
     * 1. 学習帳の存在確認
     * 2. 権限チェック（自分の学習帳かどうか）
     * 3. タグ追加（ドメインロジック呼び出し）
     * 4. 保存
     */
    public StudyBook addTag(StudyBookId studyBookId, UserId userId, Tag tag) {
        // 1. 学習帳取得
        StudyBook studyBook = studyBookRepository.findById(studyBookId)
            .orElseThrow(() -> new StudyBookNotFoundException("学習帳が見つかりません"));
        
        // 2. 権限チェック
        if (!studyBook.belongsToUser(userId)) {
            throw new UnauthorizedException("この学習帳を編集する権限がありません");
        }
        
        // 3. タグ追加（ドメインロジック）
        StudyBook updatedStudyBook = studyBook.addTag(tag);
        
        // 4. 保存
        return studyBookRepository.save(updatedStudyBook);
    }
}
```

#### 5. API エンドポイントの追加
```java
/**
 * 学習帳コントローラーにタグ関連エンドポイントを追加
 */
@RestController
@RequestMapping("/api/studybooks")
public class StudyBookController {
    
    /**
     * 学習帳にタグを追加
     * POST /api/studybooks/{id}/tags
     */
    @PostMapping("/{id}/tags")
    public ResponseEntity<StudyBookResponse> addTag(
            @PathVariable String id,
            @RequestBody AddTagRequest request,
            @RequestHeader("X-User-Id") String userId) {
        
        try {
            // リクエスト検証
            if (request.getName() == null || request.getColor() == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // ユースケース呼び出し
            StudyBook result = addTagUseCase.addTag(
                StudyBookId.of(id),
                UserId.of(userId),
                Tag.of(request.getName(), request.getColor())
            );
            
            // レスポンス生成
            StudyBookResponse response = mapper.toResponse(result);
            return ResponseEntity.ok(response);
            
        } catch (StudyBookNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                .body(ErrorResponse.of(e.getMessage()));
        }
    }
}
```

#### 6. フロントエンドの実装
```javascript
/**
 * タグ追加機能のフロントエンド実装
 */
class StudyBookController {
    
    /**
     * タグ追加フォームの送信処理
     */
    async handleAddTag(studyBookId, tagData) {
        try {
            // 入力検証
            const validationResult = this.validateTagData(tagData);
            if (!validationResult.isValid) {
                this.displayValidationErrors(validationResult.errors);
                return;
            }
            
            // API 呼び出し
            const result = await this.studyBookApiService.addTag(studyBookId, tagData);
            
            if (result.success) {
                // 成功時の処理
                this.displaySuccessMessage('タグが追加されました');
                this.refreshStudyBookList();
            } else {
                this.displayError(result.error);
            }
            
        } catch (error) {
            this.errorHandler.handle(error, { context: 'add_tag' });
        }
    }
    
    /**
     * タグデータの検証
     */
    validateTagData(tagData) {
        const errors = [];
        
        // タグ名検証
        if (!tagData.name || tagData.name.trim().length === 0) {
            errors.push(ValidationError.required('name'));
        } else if (tagData.name.length > 20) {
            errors.push(ValidationError.invalidLength('name', 1, 20, tagData.name));
        }
        
        // 色検証
        if (!tagData.color || !/^#[0-9A-Fa-f]{6}$/.test(tagData.color)) {
            errors.push(ValidationError.invalidFormat('color', '#RRGGBB形式', tagData.color));
        }
        
        return errors.length > 0 
            ? ValidationResult.failure(errors) 
            : ValidationResult.success();
    }
}
```

### バグ修正の手順

#### 1. 問題の特定
```
例: 「ログイン後にユーザー名が表示されない」

調査手順:
1. ブラウザの開発者ツールでエラーを確認
2. ネットワークタブでAPI通信を確認
3. バックエンドのログを確認
4. データベースの状態を確認
```

#### 2. 原因の分析
```javascript
// 問題のあるコード例
class AuthController {
    async handleLogin(event) {
        const result = await this.authService.login(loginId, password);
        
        if (result.success) {
            // 問題: ユーザー情報を保存していない
            this.redirectToMainPage();  // ← ここが問題
        }
    }
}
```

#### 3. 修正の実装
```javascript
// 修正後のコード
class AuthController {
    async handleLogin(event) {
        const result = await this.authService.login(loginId, password);
        
        if (result.success) {
            // 修正: ユーザー情報を保存してからリダイレクト
            this.userRepository.setCurrentUser(result.user);  // ← 追加
            this.redirectToMainPage();
        }
    }
}
```

#### 4. テストの追加
```javascript
// テストケースの追加
describe('AuthController', () => {
    test('ログイン成功時にユーザー情報が保存されること', async () => {
        // Arrange
        const mockAuthService = {
            login: jest.fn().mockResolvedValue({
                success: true,
                user: new User('123', 'testuser', false, 'token')
            })
        };
        const mockUserRepository = {
            setCurrentUser: jest.fn()
        };
        
        const controller = new AuthController(mockAuthService, mockUserRepository);
        
        // Act
        await controller.handleLogin(mockEvent);
        
        // Assert
        expect(mockUserRepository.setCurrentUser).toHaveBeenCalledWith(
            expect.objectContaining({ loginId: 'testuser' })
        );
    });
});
```

## 🧪 テストの書き方

### ユニットテストの基本

#### ドメインオブジェクトのテスト
```java
/**
 * User エンティティのテスト
 * 目的: ビジネスロジックが正しく動作することを確認
 */
class UserTest {
    
    @Test
    @DisplayName("ログイン記録時に統計が正しく更新されること")
    void recordLogin_ShouldUpdateStatistics() {
        // Arrange（準備）
        User user = User.create(
            UserId.of("user123"),
            LoginId.of("testuser"),
            PasswordHash.of("hashedPassword")
        );
        LocalDate loginDate = LocalDate.of(2024, 1, 15);
        
        // Act（実行）
        user.recordLogin(loginDate);
        
        // Assert（検証）
        assertThat(user.getTotalLoginDays()).isEqualTo(1);
        assertThat(user.getCurrentLoginStreak()).isEqualTo(1);
        assertThat(user.getLoginStatistics().getLastLoginDate()).isEqualTo(loginDate);
    }
    
    @Test
    @DisplayName("連続ログイン時にストリークが増加すること")
    void recordLogin_ConsecutiveDays_ShouldIncreaseStreak() {
        // Arrange
        User user = User.create(
            UserId.of("user123"),
            LoginId.of("testuser"),
            PasswordHash.of("hashedPassword")
        );
        
        // Act: 3日連続でログイン
        user.recordLogin(LocalDate.of(2024, 1, 13));
        user.recordLogin(LocalDate.of(2024, 1, 14));
        user.recordLogin(LocalDate.of(2024, 1, 15));
        
        // Assert
        assertThat(user.getCurrentLoginStreak()).isEqualTo(3);
        assertThat(user.getTotalLoginDays()).isEqualTo(3);
    }
    
    @Test
    @DisplayName("ログイン日をスキップした場合にストリークがリセットされること")
    void recordLogin_SkipDay_ShouldResetStreak() {
        // Arrange
        User user = User.create(
            UserId.of("user123"),
            LoginId.of("testuser"),
            PasswordHash.of("hashedPassword")
        );
        
        // Act: 1日目、3日目にログイン（2日目をスキップ）
        user.recordLogin(LocalDate.of(2024, 1, 13));
        user.recordLogin(LocalDate.of(2024, 1, 15));  // 1日スキップ
        
        // Assert
        assertThat(user.getCurrentLoginStreak()).isEqualTo(1);  // リセットされて1
        assertThat(user.getTotalLoginDays()).isEqualTo(2);      // 総日数は2
    }
}
```

#### ユースケースのテスト
```java
/**
 * 認証ユースケースのテスト
 * 目的: ビジネスフローが正しく動作することを確認
 */
class AuthenticateUserUseCaseTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordService passwordService;
    
    @Mock
    private JwtTokenService tokenService;
    
    @InjectMocks
    private AuthenticateUserUseCase useCase;
    
    @Test
    @DisplayName("正しい認証情報でログインが成功すること")
    void authenticate_ValidCredentials_ShouldSucceed() {
        // Arrange
        LoginId loginId = LoginId.of("testuser");
        String password = "password123";
        User user = createTestUser();
        String expectedToken = "jwt.token.here";
        
        when(userRepository.findByLoginId(loginId)).thenReturn(Optional.of(user));
        when(passwordService.matches(password, user.getPasswordHash())).thenReturn(true);
        when(tokenService.generateToken(user)).thenReturn(expectedToken);
        
        // Act
        AuthenticationResult result = useCase.authenticate(loginId, password);
        
        // Assert
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getUser()).isEqualTo(user);
        assertThat(result.getToken()).isEqualTo(expectedToken);
        
        // ユーザーが保存されることを確認
        verify(userRepository).save(user);
    }
    
    @Test
    @DisplayName("存在しないユーザーでログインが失敗すること")
    void authenticate_UserNotFound_ShouldThrowException() {
        // Arrange
        LoginId loginId = LoginId.of("nonexistent");
        String password = "password123";
        
        when(userRepository.findByLoginId(loginId)).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThatThrownBy(() -> useCase.authenticate(loginId, password))
            .isInstanceOf(AuthenticationException.class)
            .hasMessage("ユーザーが見つかりません");
    }
    
    @Test
    @DisplayName("間違ったパスワードでログインが失敗すること")
    void authenticate_WrongPassword_ShouldThrowException() {
        // Arrange
        LoginId loginId = LoginId.of("testuser");
        String wrongPassword = "wrongpassword";
        User user = createTestUser();
        
        when(userRepository.findByLoginId(loginId)).thenReturn(Optional.of(user));
        when(passwordService.matches(wrongPassword, user.getPasswordHash())).thenReturn(false);
        
        // Act & Assert
        assertThatThrownBy(() -> useCase.authenticate(loginId, wrongPassword))
            .isInstanceOf(AuthenticationException.class)
            .hasMessage("パスワードが正しくありません");
    }
    
    private User createTestUser() {
        return User.create(
            UserId.of("user123"),
            LoginId.of("testuser"),
            PasswordHash.of("hashedPassword")
        );
    }
}
```

#### フロントエンドのテスト
```javascript
/**
 * AuthController のテスト
 * 目的: UI制御ロジックが正しく動作することを確認
 */
describe('AuthController', () => {
    let authController;
    let mockAuthService;
    let mockUserRepository;
    let mockErrorHandler;
    
    beforeEach(() => {
        // モックオブジェクトの準備
        mockAuthService = {
            login: jest.fn()
        };
        mockUserRepository = {
            setCurrentUser: jest.fn()
        };
        mockErrorHandler = {
            handle: jest.fn()
        };
        
        authController = new AuthController(
            mockAuthService,
            mockUserRepository,
            mockErrorHandler
        );
    });
    
    test('正しい認証情報でログインが成功すること', async () => {
        // Arrange
        const mockUser = new User('123', 'testuser', false, 'token');
        mockAuthService.login.mockResolvedValue({
            success: true,
            user: mockUser
        });
        
        const mockEvent = {
            preventDefault: jest.fn(),
            target: createMockForm({
                loginId: 'testuser',
                password: 'password123'
            })
        };
        
        // Act
        await authController.handleLogin(mockEvent);
        
        // Assert
        expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
        expect(mockUserRepository.setCurrentUser).toHaveBeenCalledWith(mockUser);
    });
    
    test('入力検証エラー時にエラーメッセージが表示されること', async () => {
        // Arrange
        const mockEvent = {
            preventDefault: jest.fn(),
            target: createMockForm({
                loginId: '',  // 空のログインID
                password: 'password123'
            })
        };
        
        // displayValidationErrors メソッドをスパイ
        const displayErrorsSpy = jest.spyOn(authController, 'displayValidationErrors');
        
        // Act
        await authController.handleLogin(mockEvent);
        
        // Assert
        expect(displayErrorsSpy).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    field: 'loginId',
                    code: 'REQUIRED'
                })
            ])
        );
        
        // API は呼び出されないことを確認
        expect(mockAuthService.login).not.toHaveBeenCalled();
    });
    
    function createMockForm(data) {
        return {
            elements: Object.entries(data).map(([name, value]) => ({
                name,
                value
            }))
        };
    }
});
```

### 統合テストの書き方

#### API 統合テスト
```java
/**
 * 認証コントローラーの統合テスト
 * 目的: HTTP エンドポイントが正しく動作することを確認
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AuthControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordService passwordService;
    
    @Test
    @DisplayName("POST /api/auth/login - 正常なログイン")
    void login_ValidCredentials_ShouldReturnToken() {
        // Arrange: テストユーザーを作成
        User testUser = User.create(
            UserId.generate(),
            LoginId.of("testuser"),
            passwordService.hash("password123")
        );
        userRepository.save(testUser);
        
        LoginRequest request = new LoginRequest("testuser", "password123");
        
        // Act: API 呼び出し
        ResponseEntity<AuthenticationResponse> response = restTemplate.postForEntity(
            "/api/auth/login",
            request,
            AuthenticationResponse.class
        );
        
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUser().getLoginId()).isEqualTo("testuser");
        assertThat(response.getBody().getToken()).isNotBlank();
    }
    
    @Test
    @DisplayName("POST /api/auth/login - 存在しないユーザー")
    void login_UserNotFound_ShouldReturn401() {
        // Arrange
        LoginRequest request = new LoginRequest("nonexistent", "password123");
        
        // Act
        ResponseEntity<ErrorResponse> response = restTemplate.postForEntity(
            "/api/auth/login",
            request,
            ErrorResponse.class
        );
        
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().getMessage()).contains("ユーザーが見つかりません");
    }
    
    @Test
    @DisplayName("POST /api/auth/login - 不正なリクエスト形式")
    void login_InvalidRequest_ShouldReturn400() {
        // Arrange: 不正なリクエスト（ログインIDが空）
        LoginRequest request = new LoginRequest("", "password123");
        
        // Act
        ResponseEntity<ErrorResponse> response = restTemplate.postForEntity(
            "/api/auth/login",
            request,
            ErrorResponse.class
        );
        
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
```

## 🚨 よくある問題と解決方法

### 1. NullPointerException
```java
// 問題のあるコード
public User findUser(String loginId) {
    UserEntity entity = repository.findByLoginId(loginId);
    return mapper.toDomain(entity);  // entity が null の場合に NPE
}

// 修正後のコード
public Optional<User> findUser(String loginId) {
    UserEntity entity = repository.findByLoginId(loginId);
    return entity != null ? Optional.of(mapper.toDomain(entity)) : Optional.empty();
}

// さらに良い修正（Optional を活用）
public Optional<User> findUser(String loginId) {
    return repository.findByLoginId(loginId)
        .map(mapper::toDomain);
}
```

### 2. 循環依存
```java
// 問題: AがBに依存し、BがAに依存している
@Service
public class UserService {
    @Autowired
    private StudyBookService studyBookService;  // B に依存
}

@Service
public class StudyBookService {
    @Autowired
    private UserService userService;  // A に依存 ← 循環依存
}

// 解決方法1: 共通のサービスを作成
@Service
public class UserStudyBookService {
    private final UserRepository userRepository;
    private final StudyBookRepository studyBookRepository;
    
    // 両方の機能を提供
}

// 解決方法2: イベント駆動にする
@Service
public class UserService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void updateUser(User user) {
        userRepository.save(user);
        eventPublisher.publishEvent(new UserUpdatedEvent(user));  // イベント発行
    }
}

@Service
public class StudyBookService {
    @EventListener
    public void handleUserUpdated(UserUpdatedEvent event) {
        // ユーザー更新時の処理
    }
}
```

### 3. データベース接続エラー
```yaml
# application.yml の設定確認
spring:
  datasource:
    url: jdbc:h2:mem:testdb  # H2 インメモリDB
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  
  jpa:
    hibernate:
      ddl-auto: create-drop  # 開発時のみ使用
    show-sql: true  # SQL ログ出力
    
  h2:
    console:
      enabled: true  # H2 コンソール有効化
```

### 4. CORS エラー
```java
// CorsConfig.java
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 許可するオリジン
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        
        // 許可するHTTPメソッド
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // 許可するヘッダー
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // 認証情報の送信を許可
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}
```

### 5. フロントエンドのエラーハンドリング
```javascript
// エラーハンドリングの統一
class ErrorHandlerService {
    
    /**
     * エラーを適切に処理し、ユーザーに分かりやすいメッセージを表示
     */
    handle(error, context = {}) {
        console.error('エラーが発生しました:', error, context);
        
        let userMessage;
        
        if (error instanceof NetworkError) {
            userMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
        } else if (error instanceof AuthenticationError) {
            userMessage = 'ログインが必要です。再度ログインしてください。';
            this.redirectToLogin();
        } else if (error instanceof ValidationError) {
            userMessage = `入力エラー: ${error.message}`;
        } else {
            userMessage = '予期しないエラーが発生しました。しばらく待ってから再試行してください。';
        }
        
        this.displayErrorMessage(userMessage);
        
        // エラー報告（本番環境では外部サービスに送信）
        this.reportError(error, context);
    }
    
    displayErrorMessage(message) {
        // 通知サービスを使用してユーザーにメッセージを表示
        this.notificationService.showError(message);
    }
    
    redirectToLogin() {
        window.location.href = '/login.html';
    }
    
    reportError(error, context) {
        // 開発環境ではコンソールに出力
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 エラーレポート');
            console.error('エラー:', error);
            console.log('コンテキスト:', context);
            console.log('スタックトレース:', error.stack);
            console.groupEnd();
        }
        
        // 本番環境では外部エラー監視サービスに送信
        // 例: Sentry, Rollbar, Bugsnag など
    }
}
```

## 📈 パフォーマンス最適化

### データベースクエリの最適化
```java
// 問題: N+1 クエリ
@Entity
public class StudyBookEntity {
    @ManyToOne(fetch = FetchType.LAZY)  // LAZY ローディング
    @JoinColumn(name = "user_id")
    private UserEntity user;
}

// 解決方法1: JOIN FETCH を使用
@Query("SELECT sb FROM StudyBookEntity sb JOIN FETCH sb.user WHERE sb.userId = :userId")
List<StudyBookEntity> findByUserIdWithUser(@Param("userId") String userId);

// 解決方法2: @EntityGraph を使用
@EntityGraph(attributePaths = {"user"})
@Query("SELECT sb FROM StudyBookEntity sb WHERE sb.userId = :userId")
List<StudyBookEntity> findByUserIdWithUserGraph(@Param("userId") String userId);
```

### キャッシュの活用
```java
// Spring Cache を使用
@Service
public class StudyBookService {
    
    @Cacheable(value = "studybooks", key = "#userId")
    public List<StudyBook> getStudyBooksByUser(UserId userId) {
        return studyBookRepository.findByUserId(userId);
    }
    
    @CacheEvict(value = "studybooks", key = "#studyBook.userId")
    public StudyBook save(StudyBook studyBook) {
        return studyBookRepository.save(studyBook);
    }
}
```

### フロントエンドの最適化
```javascript
// 遅延読み込み（Lazy Loading）
class LazyLoader {
    
    /**
     * 画面に表示される直前にコンポーネントを読み込み
     */
    async loadComponent(componentName) {
        const componentCache = this.componentCache || new Map();
        
        if (componentCache.has(componentName)) {
            return componentCache.get(componentName);
        }
        
        const component = await import(`./components/${componentName}.js`);
        componentCache.set(componentName, component);
        
        return component;
    }
}

// 仮想スクロール（大量データの表示）
class VirtualScrollList {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.visibleItems = [];
    }
    
    /**
     * 表示領域に含まれるアイテムのみをレンダリング
     */
    render(allItems) {
        const containerHeight = this.container.clientHeight;
        const scrollTop = this.container.scrollTop;
        
        const startIndex = Math.floor(scrollTop / this.itemHeight);
        const endIndex = Math.min(
            startIndex + Math.ceil(containerHeight / this.itemHeight) + 1,
            allItems.length
        );
        
        const visibleItems = allItems.slice(startIndex, endIndex);
        
        // DOM を更新
        this.container.innerHTML = '';
        visibleItems.forEach((item, index) => {
            const element = this.renderItem(item, startIndex + index);
            element.style.position = 'absolute';
            element.style.top = `${(startIndex + index) * this.itemHeight}px`;
            this.container.appendChild(element);
        });
        
        // スクロール領域の高さを設定
        this.container.style.height = `${allItems.length * this.itemHeight}px`;
    }
}
```

## 🔒 セキュリティ対策

### 入力検証
```java
// バックエンドでの入力検証
@RestController
public class StudyBookController {
    
    @PostMapping("/studybooks")
    public ResponseEntity<StudyBookResponse> create(
            @Valid @RequestBody CreateStudyBookRequest request) {  // @Valid で検証
        
        // 追加の検証
        if (request.getQuestion().length() > 10000) {
            throw new ValidationException("問題文は10000文字以内で入力してください");
        }
        
        // XSS 対策: HTML タグをエスケープ
        String sanitizedQuestion = HtmlUtils.htmlEscape(request.getQuestion());
        
        // SQL インジェクション対策: パラメータ化クエリを使用（JPA が自動で対応）
        StudyBook studyBook = createStudyBookUseCase.create(
            UserId.of(getCurrentUserId()),
            Language.of(request.getLanguage()),
            Question.of(sanitizedQuestion),
            Explanation.of(request.getExplanation())
        );
        
        return ResponseEntity.ok(mapper.toResponse(studyBook));
    }
}
```

### 認証・認可
```java
// JWT トークンの検証
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        String token = extractToken(request);
        
        if (token != null && jwtTokenService.validateToken(token)) {
            // トークンが有効な場合、認証情報を設定
            String userId = jwtTokenService.getUserIdFromToken(token);
            
            // セキュリティコンテキストに認証情報を設定
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### フロントエンドのセキュリティ
```javascript
// XSS 対策
class SecurityUtils {
    
    /**
     * HTML エスケープ
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 安全な innerHTML 設定
     */
    static setSafeInnerHTML(element, html) {
        // DOMPurify などのライブラリを使用して HTML をサニタイズ
        const cleanHtml = DOMPurify.sanitize(html);
        element.innerHTML = cleanHtml;
    }
}

// CSRF 対策
class ApiClient {
    
    async request(url, options = {}) {
        // CSRF トークンを取得
        const csrfToken = this.getCsrfToken();
        
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            ...options.headers
        };
        
        return fetch(url, {
            ...options,
            headers,
            credentials: 'same-origin'  // Cookie を送信
        });
    }
    
    getCsrfToken() {
        // メタタグから CSRF トークンを取得
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.getAttribute('content') : '';
    }
}
```

## 📊 監視とログ

### ログ出力
```java
// 構造化ログの出力
@Service
public class AuthenticationApplicationService {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationApplicationService.class);
    
    public AuthenticationResult login(String loginId, String password) {
        // 開始ログ
        logger.info("ログイン処理開始: loginId={}", loginId);
        
        try {
            AuthenticationResult result = authenticateUseCase.authenticate(
                LoginId.of(loginId), 
                password
            );
            
            // 成功ログ
            logger.info("ログイン成功: loginId={}, userId={}", 
                loginId, result.getUser().getId());
            
            return result;
            
        } catch (AuthenticationException e) {
            // エラーログ
            logger.warn("ログイン失敗: loginId={}, reason={}", 
                loginId, e.getMessage());
            throw e;
            
        } catch (Exception e) {
            // 予期しないエラー
            logger.error("ログイン処理でシステムエラー: loginId={}", 
                loginId, e);
            throw new SystemException("システムエラーが発生しました", e);
        }
    }
}
```

### メトリクス収集
```java
// Micrometer を使用したメトリクス
@Service
public class StudyBookApplicationService {
    private final Counter studyBookCreatedCounter;
    private final Timer studyBookCreationTimer;
    
    public StudyBookApplicationService(MeterRegistry meterRegistry) {
        this.studyBookCreatedCounter = Counter.builder("studybook.created")
            .description("作成された学習帳の数")
            .register(meterRegistry);
            
        this.studyBookCreationTimer = Timer.builder("studybook.creation.time")
            .description("学習帳作成にかかった時間")
            .register(meterRegistry);
    }
    
    public StudyBook create(CreateStudyBookCommand command) {
        return studyBookCreationTimer.recordCallable(() -> {
            StudyBook studyBook = createStudyBookUseCase.create(command);
            studyBookCreatedCounter.increment();
            return studyBook;
        });
    }
}
```

## 🚀 デプロイメント

### Docker を使用した環境構築
```dockerfile
# Dockerfile.backend
FROM openjdk:17-jre-slim

# アプリケーションユーザーを作成
RUN addgroup --system app && adduser --system --group app

# 作業ディレクトリを設定
WORKDIR /app

# JAR ファイルをコピー
COPY build/libs/rct-backend-*.jar app.jar

# ユーザーを変更
USER app

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# アプリケーション起動
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./rct-backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/rctdb
      - SPRING_DATASOURCE_USERNAME=rctuser
      - SPRING_DATASOURCE_PASSWORD=rctpass
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=rctdb
      - POSTGRES_USER=rctuser
      - POSTGRES_PASSWORD=rctpass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### CI/CD パイプライン
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Cache Gradle packages
      uses: actions/cache@v3
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
    
    - name: Run backend tests
      run: |
        cd rct-backend
        ./gradlew test
    
    - name: Run frontend tests
      run: |
        npm ci
        npm test
    
    - name: Generate test report
      uses: dorny/test-reporter@v1
      if: success() || failure()
      with:
        name: Test Results
        path: '**/build/test-results/test/TEST-*.xml'
        reporter: java-junit

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build backend
      run: |
        cd rct-backend
        ./gradlew bootJar
    
    - name: Build frontend
      run: |
        npm ci
        npm run build
    
    - name: Build Docker images
      run: |
        docker build -t rct-backend:${{ github.sha }} ./rct-backend
        docker build -t rct-frontend:${{ github.sha }} .
    
    - name: Deploy to staging
      if: github.ref == 'refs/heads/main'
      run: |
        # デプロイスクリプトを実行
        ./deploy.sh staging ${{ github.sha }}
```

---

このガイドを参考に、段階的にプロジェクトの理解を深めていってください。
わからないことがあれば、まずはテストを書いて動作を確認し、
ログを出力して処理の流れを追跡することから始めましょう。