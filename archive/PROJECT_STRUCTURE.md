# RCT プロジェクト構造ガイド

## 📁 プロジェクト概要

RemindCodeTyping（RCT）は、プログラマー向けの学習支援型タイピング練習アプリケーションです。
クリーンアーキテクチャとドメイン駆動設計（DDD）の原則に基づいて設計されています。

## 🏗️ アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    プレゼンテーション層                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   HTML/CSS      │  │  JavaScript UI  │  │  REST API       │ │
│  │   (フロント)     │  │  (コンポーネント) │  │  (バックエンド)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    アプリケーション層                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  コントローラー   │  │   サービス      │  │  ユースケース    │ │
│  │  (UI制御)       │  │  (ビジネス処理)  │  │  (業務フロー)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      ドメイン層                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   エンティティ   │  │  値オブジェクト  │  │  リポジトリIF   │ │
│  │  (ビジネス実体)  │  │  (不変データ)   │  │  (データ抽象化)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   インフラストラクチャ層                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  データベース    │  │   外部API       │  │   設定・監視     │ │
│  │  (永続化)       │  │  (外部連携)     │  │  (横断的関心事)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📂 ディレクトリ構造

### ルートディレクトリ
```
RemindCodeTyping/
├── README.md                    # プロジェクト概要・セットアップガイド
├── PROJECT_STRUCTURE.md         # このファイル（構造説明）
├── package.json                 # フロントエンド依存関係
├── webpack.config.js            # バンドル設定
├── docker-compose.yml           # 開発環境構築
├── nginx.conf                   # Webサーバー設定
├── build.sh / build.bat         # ビルドスクリプト
├── quality-check.sh             # 品質チェックスクリプト
└── deploy.sh                    # デプロイスクリプト
```

### フロントエンド構造
```
Rct/                            # フロントエンドアプリケーション
├── main.html                   # メインアプリケーション画面
├── login-new.html              # ログイン画面
├── debug-test.html             # デバッグ・テスト用画面
├── css/                        # スタイルシート
│   ├── components/             # コンポーネント別CSS
│   │   ├── auth.css           # 認証関連スタイル
│   │   ├── studybook.css      # 学習帳関連スタイル
│   │   └── typing.css         # タイピング関連スタイル
│   └── main.css               # 共通スタイル
└── js/                        # JavaScript アプリケーション
    ├── domain/                # ドメイン層
    │   ├── models/            # ドメインモデル
    │   │   ├── User.js        # ユーザーエンティティ
    │   │   ├── StudyBook.js   # 学習帳エンティティ
    │   │   └── TypingSession.js # タイピングセッション
    │   └── valueObjects/      # 値オブジェクト
    │       └── ValidationError.js # 検証エラー
    ├── application/           # アプリケーション層
    │   ├── controllers/       # UIコントローラー
    │   │   ├── AuthController.js      # 認証制御
    │   │   ├── StudyBookController.js # 学習帳制御
    │   │   └── TypingController.js    # タイピング制御
    │   ├── services/          # アプリケーションサービス
    │   │   ├── AuthService.js         # 認証サービス
    │   │   ├── StudyBookService.js    # 学習帳サービス
    │   │   └── TypingService.js       # タイピングサービス
    │   ├── repositories/      # リポジトリ（状態管理）
    │   │   ├── UserRepository.js      # ユーザー状態管理
    │   │   ├── StudyBookRepository.js # 学習帳状態管理
    │   │   └── SessionRepository.js   # セッション状態管理
    │   ├── state/             # 状態管理
    │   │   └── StateManager.js        # 全体状態管理
    │   ├── events/            # イベント管理
    │   │   └── EventBus.js            # イベントバス
    │   └── validation/        # 検証ロジック
    │       └── ValidationResult.js    # 検証結果
    ├── infrastructure/        # インフラストラクチャ層
    │   ├── http/              # HTTP通信
    │   │   └── ApiClient.js           # API クライアント
    │   ├── auth/              # 認証基盤
    │   │   └── TokenManager.js        # トークン管理
    │   ├── api/               # API サービス
    │   │   ├── AuthApiService.js      # 認証API
    │   │   ├── StudyBookApiService.js # 学習帳API
    │   │   └── TypingApiService.js    # タイピングAPI
    │   ├── errors/            # エラーハンドリング
    │   │   ├── RctError.js            # 基底エラークラス
    │   │   ├── NetworkError.js        # ネットワークエラー
    │   │   ├── AuthenticationError.js # 認証エラー
    │   │   ├── BusinessError.js       # ビジネスエラー
    │   │   ├── SystemError.js         # システムエラー
    │   │   └── ErrorHandlerService.js # エラーハンドラー
    │   ├── logging/           # ログ出力
    │   │   └── Logger.js              # ログ管理
    │   ├── notifications/     # 通知機能
    │   │   └── NotificationService.js # 通知サービス
    │   ├── performance/       # パフォーマンス
    │   │   ├── CacheManager.js        # キャッシュ管理
    │   │   ├── LazyLoader.js          # 遅延読み込み
    │   │   └── PerformanceMonitor.js  # パフォーマンス監視
    │   ├── validation/        # 入力検証
    │   │   └── InputValidator.js      # 入力値検証
    │   ├── ApiClientFactory.js        # APIクライアント工場
    │   └── LegacyApiAdapter.js        # レガシーAPI適応
    └── presentation/          # プレゼンテーション層
        └── components/        # UIコンポーネント
            ├── auth/          # 認証関連UI
            │   ├── LoginForm.js           # ログインフォーム
            │   ├── RegisterForm.js        # 登録フォーム
            │   └── AuthenticationView.js  # 認証ビュー
            ├── studybook/     # 学習帳関連UI
            │   ├── StudyBookForm.js       # 学習帳フォーム
            │   ├── StudyBookList.js       # 学習帳一覧
            │   └── StudyBookManagementView.js # 学習帳管理ビュー
            └── typing/        # タイピング関連UI
                ├── TypingSettingsForm.js     # タイピング設定
                └── TypingPracticeInterface.js # タイピング練習画面
```

### バックエンド構造
```
rct-backend/                    # Spring Boot アプリケーション
├── src/main/java/com/rct/      # メインソースコード
│   ├── controller/             # REST API エンドポイント
│   │   ├── AuthController.java         # 認証API
│   │   ├── StudyBookController.java    # 学習帳API
│   │   └── TypingController.java       # タイピングAPI
│   ├── application/            # アプリケーション層
│   │   ├── service/            # アプリケーションサービス
│   │   │   ├── AuthenticationApplicationService.java # 認証サービス
│   │   │   ├── StudyBookApplicationService.java      # 学習帳サービス
│   │   │   └── TypingSessionApplicationService.java  # タイピングサービス
│   │   ├── usecase/            # ユースケース
│   │   │   ├── auth/           # 認証ユースケース
│   │   │   │   ├── AuthenticateUserUseCase.java      # ユーザー認証
│   │   │   │   ├── RegisterUserUseCase.java          # ユーザー登録
│   │   │   │   └── RefreshTokenUseCase.java          # トークン更新
│   │   │   ├── studybook/      # 学習帳ユースケース
│   │   │   │   ├── CreateStudyBookUseCase.java       # 学習帳作成
│   │   │   │   ├── UpdateStudyBookUseCase.java       # 学習帳更新
│   │   │   │   ├── DeleteStudyBookUseCase.java       # 学習帳削除
│   │   │   │   └── GetStudyBooksUseCase.java         # 学習帳取得
│   │   │   └── typingsession/  # タイピングユースケース
│   │   │       ├── StartTypingSessionUseCase.java    # セッション開始
│   │   │       ├── RecordTypingResultUseCase.java    # 結果記録
│   │   │       └── GetTypingStatisticsUseCase.java   # 統計取得
│   │   ├── command/            # コマンドオブジェクト
│   │   └── result/             # 結果オブジェクト
│   ├── domain/                 # ドメイン層
│   │   └── model/              # ドメインモデル
│   │       ├── user/           # ユーザードメイン
│   │       │   ├── User.java               # ユーザーエンティティ
│   │       │   ├── UserId.java             # ユーザーID値オブジェクト
│   │       │   ├── LoginId.java            # ログインID値オブジェクト
│   │       │   ├── PasswordHash.java       # パスワードハッシュ
│   │       │   ├── LoginStatistics.java    # ログイン統計
│   │       │   ├── Role.java               # ユーザーロール
│   │       │   └── UserRepository.java     # ユーザーリポジトリIF
│   │       ├── studybook/      # 学習帳ドメイン
│   │       │   ├── StudyBook.java          # 学習帳エンティティ
│   │       │   ├── StudyBookId.java        # 学習帳ID
│   │       │   ├── Language.java           # プログラミング言語
│   │       │   ├── Question.java           # 問題文
│   │       │   ├── Explanation.java        # 解説
│   │       │   └── StudyBookRepository.java # 学習帳リポジトリIF
│   │       ├── typingsession/  # タイピングセッションドメイン
│   │       │   ├── TypingSession.java      # タイピングセッション
│   │       │   ├── TypingSessionId.java    # セッションID
│   │       │   ├── TypingResult.java       # タイピング結果
│   │       │   ├── Duration.java           # 実行時間
│   │       │   └── TypingSessionRepository.java # セッションリポジトリIF
│   │       └── auth/           # 認証ドメイン
│   │           ├── RefreshToken.java       # リフレッシュトークン
│   │           └── RefreshTokenId.java     # トークンID
│   ├── infrastructure/         # インフラストラクチャ層
│   │   ├── persistence/        # データ永続化
│   │   │   ├── entity/         # JPAエンティティ
│   │   │   │   ├── UserEntity.java         # ユーザーテーブル
│   │   │   │   ├── StudyBookEntity.java    # 学習帳テーブル
│   │   │   │   └── TypingSessionEntity.java # セッションテーブル
│   │   │   ├── repository/     # リポジトリ実装
│   │   │   │   ├── JpaUserRepositoryImpl.java      # ユーザーリポジトリ
│   │   │   │   ├── JpaStudyBookRepositoryImpl.java # 学習帳リポジトリ
│   │   │   │   └── JpaTypingSessionRepositoryImpl.java # セッションリポジトリ
│   │   │   ├── mapper/         # エンティティマッパー
│   │   │   │   ├── UserMapper.java         # ユーザーマッピング
│   │   │   │   ├── StudyBookMapper.java    # 学習帳マッピング
│   │   │   │   └── TypingSessionMapper.java # セッションマッピング
│   │   │   └── service/        # 永続化サービス
│   │   │       └── CachedQueryService.java # キャッシュ付きクエリ
│   │   ├── security/           # セキュリティ基盤
│   │   │   ├── SecurityConfig.java         # Spring Security設定
│   │   │   ├── JwtTokenService.java        # JWT トークンサービス
│   │   │   ├── JwtAuthenticationFilter.java # JWT認証フィルター
│   │   │   ├── JwtAuthenticationEntryPoint.java # 認証エントリーポイント
│   │   │   ├── PasswordService.java        # パスワードサービス
│   │   │   ├── SecurityUtils.java          # セキュリティユーティリティ
│   │   │   └── SecurityValidationFilter.java # セキュリティ検証フィルター
│   │   ├── config/             # 設定クラス
│   │   │   ├── EnvironmentConfig.java      # 環境設定
│   │   │   ├── SecretManager.java          # 秘密情報管理
│   │   │   ├── ConfigurationValidator.java # 設定検証
│   │   │   ├── CacheConfig.java            # キャッシュ設定
│   │   │   ├── OpenApiConfig.java          # API ドキュメント設定
│   │   │   └── ProfileConfig.java          # プロファイル設定
│   │   ├── monitoring/         # 監視・メトリクス
│   │   │   ├── ApplicationMetrics.java     # アプリケーションメトリクス
│   │   │   ├── CustomHealthIndicators.java # ヘルスチェック
│   │   │   ├── MonitoringConfig.java       # 監視設定
│   │   │   ├── CorrelationIdFilter.java    # 相関ID管理
│   │   │   └── FeatureFlagMonitor.java     # フィーチャーフラグ監視
│   │   ├── logging/            # ログ出力
│   │   │   ├── LoggingConfiguration.java   # ログ設定
│   │   │   └── RequestLoggingFilter.java   # リクエストログ
│   │   └── featureflags/       # フィーチャーフラグ
│   │       ├── FeatureFlag.java            # フィーチャーフラグ
│   │       ├── FeatureFlagService.java     # フラグサービス
│   │       ├── FeatureFlagStatus.java      # フラグ状態
│   │       ├── RolloutStrategy.java        # ロールアウト戦略
│   │       └── DatabaseFeatureFlagRepository.java # フラグリポジトリ
│   ├── presentation/           # プレゼンテーション層
│   │   ├── dto/                # データ転送オブジェクト
│   │   │   ├── request/        # リクエストDTO
│   │   │   │   ├── LoginRequest.java       # ログインリクエスト
│   │   │   │   ├── UpdateStudyBookRequest.java # 学習帳更新リクエスト
│   │   │   │   └── RecordTypingResultRequest.java # タイピング結果リクエスト
│   │   │   └── response/       # レスポンスDTO
│   │   │       ├── StudyBookResponse.java  # 学習帳レスポンス
│   │   │       ├── TypingStatisticsResponse.java # 統計レスポンス
│   │   │       └── ErrorResponse.java      # エラーレスポンス
│   │   ├── mapper/             # DTOマッパー
│   │   │   ├── AuthenticationDtoMapper.java # 認証DTOマッパー
│   │   │   ├── StudyBookDtoMapper.java     # 学習帳DTOマッパー
│   │   │   └── TypingSessionDtoMapper.java # セッションDTOマッパー
│   │   ├── validation/         # 入力検証
│   │   │   ├── SecurityValidator.java      # セキュリティ検証
│   │   │   ├── InputSanitizer.java         # 入力サニタイズ
│   │   │   ├── SafeInputValidator.java     # 安全な入力検証
│   │   │   └── ValidLanguageValidator.java # 言語検証
│   │   └── exception/          # 例外処理
│   │       ├── ErrorCode.java              # エラーコード
│   │       ├── AuthenticationException.java # 認証例外
│   │       ├── ValidationException.java    # 検証例外
│   │       ├── BusinessException.java      # ビジネス例外
│   │       └── SystemException.java        # システム例外
│   ├── exception/              # グローバル例外処理
│   │   └── GlobalExceptionHandler.java     # 例外ハンドラー
│   └── config/                 # Spring設定
│       └── CorsConfig.java                 # CORS設定
├── src/main/resources/         # リソースファイル
│   ├── application.yml         # アプリケーション設定
│   └── db/migration/           # データベースマイグレーション
│       ├── V1__init_schema.sql             # 初期スキーマ
│       ├── V13__normalize_schema_and_optimize.sql # スキーマ正規化
│       ├── V14__normalize_schema_h2_compatible.sql # H2互換性
│       ├── V15__finalize_schema_migration.sql     # 最終マイグレーション
│       ├── V16__performance_optimization.sql      # パフォーマンス最適化
│       └── scripts/            # マイグレーションスクリプト
│           ├── data-migration-master.sql   # データ移行マスター
│           ├── data-validation-checks.sql  # データ検証チェック
│           └── rollback-procedures.sql     # ロールバック手順
├── src/test/java/              # テストコード
│   └── com/rct/                # テストパッケージ
│       ├── domain/model/       # ドメインモデルテスト
│       ├── application/        # アプリケーション層テスト
│       ├── infrastructure/     # インフラ層テスト
│       ├── controller/         # コントローラーテスト
│       ├── integration/        # 統合テスト
│       ├── performance/        # パフォーマンステスト
│       ├── security/           # セキュリティテスト
│       └── util/               # テストユーティリティ
├── build.gradle               # Gradle ビルド設定
├── settings.gradle            # Gradle プロジェクト設定
├── checkstyle.xml             # コードスタイルチェック設定
├── pmd-rules.xml              # 静的解析ルール
├── .env.example               # 環境変数テンプレート
└── Dockerfile                 # Docker イメージ定義
```

### テスト構造
```
tests/                          # フロントエンドテスト
├── setup.js                   # テスト環境セットアップ
├── domain/models/             # ドメインモデルテスト
├── application/               # アプリケーション層テスト
├── infrastructure/            # インフラ層テスト
└── presentation/components/   # UIコンポーネントテスト

cypress/                       # E2Eテスト
├── e2e/                       # エンドツーエンドテスト
├── component/                 # コンポーネントテスト
├── fixtures/                  # テストデータ
└── support/                   # テストサポート
```

### インフラストラクチャ
```
infrastructure/                # インフラ定義
├── terraform/                 # Terraform設定
│   ├── main.tf               # メインインフラ定義
│   ├── variables.tf          # 変数定義
│   ├── outputs.tf            # 出力定義
│   ├── ecs.tf                # ECSサービス定義
│   ├── alb.tf                # ロードバランサー定義
│   └── autoscaling.tf        # オートスケーリング定義
├── scripts/                   # デプロイスクリプト
│   ├── deployment-monitor.sh  # デプロイ監視
│   └── migrate-database.sh   # データベース移行
└── deploy-infrastructure.sh   # インフラデプロイ
```

### ドキュメント
```
docs/                          # プロジェクトドキュメント
├── DEVELOPMENT_SETUP.md       # 開発環境セットアップ
├── BUILD_AND_DEPLOYMENT.md    # ビルド・デプロイガイド
├── TROUBLESHOOTING.md         # トラブルシューティング
├── CONTRIBUTING.md            # コントリビューションガイド
├── MIGRATION_GUIDE.md         # マイグレーションガイド
└── architecture/              # アーキテクチャドキュメント
    ├── ADR-001-Clean-Architecture-Implementation.md # クリーンアーキテクチャ
    └── ADR-002-JWT-Authentication-Strategy.md       # JWT認証戦略
```

## 🔧 主要コンポーネントの役割

### ドメイン層（Domain Layer）
**目的**: ビジネスロジックとルールの中核を担当

- **エンティティ（Entities）**: ビジネスの中心的な概念を表現
  - `User`: ユーザーの認証、権限、ログイン統計を管理
  - `StudyBook`: 学習帳の作成、更新、所有権管理
  - `TypingSession`: タイピング練習セッションの状態管理

- **値オブジェクト（Value Objects）**: 不変のデータ構造
  - `UserId`, `StudyBookId`: 一意識別子
  - `Language`, `Question`, `Explanation`: 学習コンテンツ
  - `Duration`, `TypingResult`: タイピング結果データ

- **リポジトリインターフェース**: データアクセスの抽象化
  - 具体的な実装に依存しない、ドメインの観点からのデータ操作定義

### アプリケーション層（Application Layer）
**目的**: ユースケースの調整とビジネスフローの制御

- **ユースケース（Use Cases）**: 具体的な業務処理フロー
  - 認証: ログイン、登録、トークン更新
  - 学習帳: 作成、更新、削除、検索
  - タイピング: セッション開始、結果記録、統計取得

- **アプリケーションサービス**: 複数のユースケースを組み合わせた高レベル処理
- **コマンド・結果オブジェクト**: 処理の入力と出力を明確に定義

### インフラストラクチャ層（Infrastructure Layer）
**目的**: 外部システムとの連携と技術的な実装詳細

- **永続化（Persistence）**: データベースアクセスの実装
  - JPA エンティティによるO/Rマッピング
  - リポジトリパターンの具体実装
  - キャッシュ機能による性能最適化

- **セキュリティ（Security）**: 認証・認可の実装
  - JWT トークンベース認証
  - パスワードハッシュ化
  - セキュリティフィルター

- **設定・監視（Configuration & Monitoring）**: 運用面のサポート
  - 環境別設定管理
  - ヘルスチェック
  - メトリクス収集

### プレゼンテーション層（Presentation Layer）
**目的**: ユーザーインターフェースと外部APIの提供

- **REST API（バックエンド）**: HTTP エンドポイントの提供
  - リクエスト/レスポンスの変換
  - 入力検証
  - エラーハンドリング

- **UI コンポーネント（フロントエンド）**: ユーザーインターフェース
  - 認証フォーム
  - 学習帳管理画面
  - タイピング練習インターフェース

## 🎯 設計原則

### 1. 依存関係の方向
```
プレゼンテーション → アプリケーション → ドメイン ← インフラストラクチャ
```
- 内側の層は外側の層に依存しない
- インフラストラクチャ層のみがドメイン層のインターフェースを実装

### 2. 単一責任の原則
- 各クラスは一つの責任のみを持つ
- 変更理由が一つになるよう設計

### 3. 開放閉鎖の原則
- 拡張に対して開放的
- 修正に対して閉鎖的
- インターフェースを通じた抽象化

### 4. 依存関係逆転の原則
- 高レベルモジュールは低レベルモジュールに依存しない
- 両方とも抽象に依存する

## 🚀 開発フロー

### 1. 新機能開発の手順
1. **ドメインモデルの設計**: ビジネスルールとエンティティの定義
2. **ユースケースの実装**: アプリケーション層でのフロー定義
3. **インフラストラクチャの実装**: データアクセスや外部連携
4. **プレゼンテーション層の実装**: API やUI の作成
5. **テストの作成**: 各層でのユニット・統合テスト

### 2. 品質保証
- **静的解析**: Checkstyle, PMD, ESLint による品質チェック
- **テスト**: ユニット、統合、E2E テストの実行
- **カバレッジ**: 80% 以上のテストカバレッジを維持
- **セキュリティ**: 脆弱性スキャンとセキュリティテスト

### 3. デプロイメント
- **CI/CD**: GitHub Actions による自動ビルド・テスト・デプロイ
- **コンテナ化**: Docker による環境の標準化
- **インフラ管理**: Terraform による Infrastructure as Code

## 📚 学習リソース

### 初学者向け
1. **クリーンアーキテクチャ**: Robert C. Martin著
2. **ドメイン駆動設計**: Eric Evans著
3. **Spring Boot リファレンス**: 公式ドキュメント
4. **JavaScript モダン開発**: ES6+ の学習

### 実装パターン
1. **リポジトリパターン**: データアクセスの抽象化
2. **ファクトリーパターン**: オブジェクト生成の管理
3. **コマンドパターン**: 処理の要求をオブジェクト化
4. **オブザーバーパターン**: イベント駆動アーキテクチャ

## 🔍 トラブルシューティング

### よくある問題
1. **依存関係の循環**: 層間の依存関係を確認
2. **テスト失敗**: モックとスタブの適切な使用
3. **パフォーマンス問題**: N+1 問題やキャッシュの活用
4. **セキュリティ**: 入力検証と認証・認可の実装

### デバッグ手順
1. **ログの確認**: 各層でのログ出力を確認
2. **テストの実行**: 問題箇所の特定
3. **プロファイリング**: パフォーマンス問題の分析
4. **セキュリティスキャン**: 脆弱性の検出

---

このプロジェクト構造は、保守性、拡張性、テスタビリティを重視して設計されています。
各層の責任を明確に分離することで、変更の影響範囲を限定し、安全な機能追加・修正が可能です。