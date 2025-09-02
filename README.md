# RCT - Remind Code Typing

学習支援型タイピングアプリケーション / Learning-focused typing practice application for programmers

### 📦 ディレクトリ概要

**メインディレクトリ**:
- `Rct/` - フロントエンド
- `rct-backend/` - バックエンド  
- `tests/` - テスト

**⚙️ 必要時のみ使用**:
- `opt/` - 設定ファイル・スクリプト ([opt/README.md](opt/README.md))
- `data/` - サンプルデータ・テストデータ ([data/README.md](data/README.md))
- `archive/` - 高度な機能 ([archive/README.md](archive/README.md))

## 🚀 クイックスタート / Quick Start

### 前提条件 / Prerequisites
- Java 17以上 / Java 17 or higher
- Node.js 18以上 (フロントエンド開発用) / Node.js 18+ (for frontend development)
- Docker (統合テスト用) / Docker (for integration tests)
- Git

### 完全ガイド：ゼロから開発環境構築

#### 📋 Step 1: 事前準備（環境構築）

**Windows の場合:**
```powershell
# 1. Chocolatey（パッケージマネージャー）をインストール
# PowerShellを管理者権限で開いて実行
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. 必要なソフトウェアをインストール
choco install git nodejs openjdk17 docker-desktop -y

# 3. インストール確認
git --version
node --version
java --version
docker --version
```

**macOS の場合:**
```bash
# 1. Homebrewをインストール（既にある場合はスキップ）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 必要なソフトウェアをインストール
brew install git node@18 openjdk@17
brew install --cask docker

# 3. Java環境変数を設定
echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17"' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 4. インストール確認
git --version
node --version
java --version
docker --version
```

**Ubuntu/Debian の場合:**
```bash
# 1. システムを更新
sudo apt update && sudo apt upgrade -y

# 2. 必要なパッケージをインストール
sudo apt install -y curl wget gnupg lsb-release

# 3. Node.js 18をインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Java 17をインストール
sudo apt install -y openjdk-17-jdk

# 5. Dockerをインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 6. Gitをインストール（通常は既にインストール済み）
sudo apt install -y git

# 7. インストール確認
git --version
node --version
java --version
docker --version

# 8. 再ログインしてDockerグループを有効化
echo "再ログインまたは 'newgrp docker' を実行してください"
```

#### 📥 Step 2: プロジェクトのクローンと初期設定

```bash
# 1. プロジェクトをクローン
git clone https://github.com/sin1227488801/RemindCodeTyping.git
cd RemindCodeTyping

# 2. プロジェクト構造を確認
ls -la
# 以下が表示されることを確認:
# README.md, package.json, build.sh, Rct/, rct-backend/, tests/, opt/, data/, archive/

# 3. フロントエンド依存関係をインストール
npm install

# 4. インストール確認
npm list --depth=0
```

#### ⚡ Step 3: 最速起動（H2データベース使用）

```bash
# 1. バックエンドディレクトリに移動
cd rct-backend

# 2. Gradleラッパーに実行権限を付与（Linux/macOSのみ）
chmod +x gradlew

# 3. アプリケーションを起動
# Windows の場合:
gradlew.bat bootRun

# Linux/macOS の場合:
./gradlew bootRun

# 4. 起動完了まで待機（約30-60秒）
# "Started RctBackendApplication" のメッセージが表示されるまで待つ
```

#### 🌐 Step 4: 動作確認

**ターミナルを新しく開いて以下を実行:**

```bash
# 1. API サーバーの動作確認
curl http://localhost:8080/actuator/health
# 期待する結果: {"status":"UP"}

# 2. Swagger UI でAPI仕様を確認
# ブラウザで以下のURLを開く:
# http://localhost:8080/swagger-ui.html

# 3. H2 データベースコンソールを確認
# ブラウザで以下のURLを開く:
# http://localhost:8080/h2-console
# 設定値:
# - JDBC URL: jdbc:h2:mem:rctdb
# - User Name: sa
# - Password: (空白)

# 4. デモログインをテスト
curl -X POST http://localhost:8080/api/auth/demo
# 期待する結果: {"userId":"demo-user-uuid-0000-000000000001","message":"Demo login successful"}

# 5. ランダム問題取得をテスト
curl -H "X-User-Id: demo-user-uuid-0000-000000000001" \
     "http://localhost:8080/api/studybooks/random?limit=3"
# 期待する結果: JSON形式の学習帳データ
```

#### 🎨 Step 5: フロントエンド起動

**別のターミナルを開いて:**

```bash
# 1. プロジェクトルートに移動
cd RemindCodeTyping

# 2. フロントエンドを起動
# 開発サーバーを起動（オプション）
npm run dev

# または、静的ファイルとして確認
# ブラウザで以下のファイルを開く:
# file:///path/to/RemindCodeTyping/Rct/main.html
# file:///path/to/RemindCodeTyping/Rct/login-new.html
```

#### 🧪 Step 6: テスト実行

```bash
# 1. バックエンドテストを実行
cd rct-backend
./gradlew test

# 2. フロントエンドテストを実行
cd ..
npm test

# 3. 統合ビルドを実行
./build.sh  # Linux/macOS
# または
build.bat   # Windows
```

#### 🔧 Step 7: 開発環境のカスタマイズ（オプション）

```bash
# 1. 環境変数ファイルを作成
cp data/examples/.env.example .env

# 2. 必要に応じて .env ファイルを編集
# エディタで .env を開いて設定を調整

# 3. Docker環境を使用する場合
cp opt/config/docker-compose.yml ./
docker-compose up -d

# 4. コード品質チェックを実行する場合
cp opt/scripts/quality-check.sh ./
./quality-check.sh
```

#### 🎯 Step 8: 開発開始

```bash
# 開発環境が正常に動作していることを確認
echo "✅ 開発環境構築完了！"
echo "🌐 API Server: http://localhost:8080"
echo "📚 Swagger UI: http://localhost:8080/swagger-ui.html"
echo "🗄️ H2 Console: http://localhost:8080/h2-console"
echo "🎨 Frontend: file:///$(pwd)/Rct/main.html"
echo ""
echo "🚀 開発を開始できます！"
```

#### ❗ トラブルシューティング

**よくある問題と解決方法:**

```bash
# Java バージョンエラーの場合
java --version
# Java 17以上であることを確認

# ポート8080が使用中の場合
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID番号> /F

# Linux/macOS:
lsof -ti:8080 | xargs kill -9

# Gradleラッパーの権限エラー（Linux/macOS）
chmod +x rct-backend/gradlew

# Node.js依存関係のエラー
rm -rf node_modules package-lock.json
npm install

# Docker起動エラー
docker --version
# Dockerが起動していることを確認
```

**サポートが必要な場合:**
1. エラーメッセージをコピー
2. 実行したコマンドを記録
3. 環境情報（OS、Javaバージョン等）を確認
4. GitHubのIssuesで質問

## アーキテクチャ概要

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

## 📂 プロジェクト構造

### コア構造
```
RemindCodeTyping/
├── README.md                    # プロジェクト概要・セットアップガイド
├── PROJECT_STRUCTURE.md         # 詳細構造説明
├── DEVELOPMENT_GUIDE.md         # 初学者向け開発ガイド
├── package.json                 # フロントエンド依存関係
├── build.sh / build.bat         # 必須ビルドスクリプト
├── Rct/                        # フロントエンドアプリケーション
│   ├── main.html               # メインアプリケーション画面
│   ├── login-new.html          # ログイン画面
│   ├── debug-test.html         # デバッグ・テスト用画面
│   ├── css/                    # スタイルシート
│   └── js/                     # JavaScript アプリケーション
│       ├── domain/             # ドメイン層（ビジネスロジック）
│       ├── application/        # アプリケーション層（UI制御）
│       ├── infrastructure/     # インフラ層（API通信等）
│       └── presentation/       # プレゼンテーション層（UIコンポーネント）
├── rct-backend/                # Spring Boot バックエンド
│   ├── src/main/java/com/rct/  # メインソースコード
│   │   ├── controller/         # REST API エンドポイント
│   │   ├── application/        # アプリケーション層
│   │   ├── domain/             # ドメイン層
│   │   ├── infrastructure/     # インフラストラクチャ層
│   │   └── presentation/       # プレゼンテーション層
│   ├── src/test/java/          # テストコード
│   ├── src/main/resources/     # 設定ファイル・マイグレーション
│   ├── build.gradle            # ビルド設定
│   ├── settings.gradle         # Gradle設定
│   └── gradlew / gradlew.bat   # Gradleラッパー
├── tests/                      # フロントエンドテスト
├── opt/                        # オプション設定・スクリプト
│   ├── config/                 # Docker, ESLint, Prettier等の設定
│   ├── scripts/                # 品質チェック・テストスクリプト
│   └── backend-config/         # バックエンド品質管理設定
├── data/                       # サンプルデータ・テストデータ
│   ├── examples/               # 環境変数例・API仕様書
│   └── fixtures/               # E2Eテスト・テストデータ
├── Document/                   # 開発用資料
│   ├── 1.企画/                 # 企画書
│   ├── 2.要件定義書/           # 要件定義書
│   └── 3.設計/                 # 設計データ
└── archive/                    # 高度な機能（初学者は無視）
    ├── deployment-tools/       # 本番デプロイメント関連
    ├── advanced-testing/       # 高度なテスト機能
    ├── security-tools/         # セキュリティツール
    ├── monitoring/             # システム監視機能
    ├── performance/            # パフォーマンス最適化
    ├── migration/              # データマイグレーション
    ├── documentation/          # 詳細ドキュメント
    └── legacy-features/        # レガシー互換機能
```

詳細な構造説明は [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) を参照してください。
初学者向けの開発ガイドは [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) を参照してください。

## 🔧 品質保証 / Quality Assurance

このプロジェクトには包括的な品質ゲートとテストインフラが含まれています：
This project includes comprehensive quality gates and testing infrastructure:

### バックエンド品質ツール / Backend Quality Tools
- **Spotless**: Google Java Formatによるコード整形 / Code formatting
- **Checkstyle**: コードスタイル強制 / Code style enforcement  
- **PMD**: 静的コード解析 / Static code analysis
- **JaCoCo**: コードカバレッジ (最低80%) / Code coverage (80% minimum)
- **TestContainers**: 実データベースでの統合テスト / Integration testing

### フロントエンド品質ツール / Frontend Quality Tools
- **ESLint**: JavaScriptリンティング / JavaScript linting
- **Prettier**: コード整形 / Code formatting
- **Jest**: ユニットテスト (80%カバレッジ要求) / Unit testing (80% coverage)

### 品質チェック実行 / Running Quality Checks

**全品質チェック / All Quality Checks:**
```bash
# Unix/Linux/Mac
./quality-check.sh

# Windows
quality-check.bat
```

**個別チェック / Individual Checks:**
```bash
# Backend
cd rct-backend
./mvnw spotless:check    # Format check
./mvnw checkstyle:check  # Style check  
./mvnw pmd:check         # Static analysis
./mvnw test              # Unit tests
./mvnw verify            # Integration tests

# Frontend
npm run lint:check       # ESLint check
npm run format:check     # Prettier check
npm test                 # Jest tests
```

**自動修正 / Auto-fix Issues:**
```bash
# Backend
cd rct-backend
./mvnw spotless:apply    # Fix formatting

# Frontend  
npm run lint             # Fix ESLint issues
npm run format           # Fix formatting
```

### ローカル起動（H2データベース）
```bash
# リポジトリクローン
git clone <repository-url>
cd RemindCodeTyping/rct-backend

# 即座に起動（H2インメモリDB使用）
./gradlew bootRun

# または Windows の場合
gradlew.bat bootRun
```

起動後、以下のURLでアクセス可能：
- **API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **H2 Console**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:rctdb`
  - Username: `sa`
  - Password: (空白)

### 動作確認
```bash
# デモログイン
curl -X POST http://localhost:8080/api/auth/demo

# ランダム問題取得（X-User-IdはデモログインのレスポンスのuserIdを使用）
curl -H "X-User-Id: demo-user-uuid-0000-000000000001" \
     http://localhost:8080/api/studybooks/random?limit=3
```

## 📋 技術スタック

### バックエンド
- **Java 17** + **Spring Boot 3.2.0**
- **Spring Data JPA** (データアクセス)
- **Spring Validation** (入力検証)
- **Flyway** (DBマイグレーション)
- **Gradle** (ビルドツール)

### データベース
- **開発環境**: H2 (インメモリ)
- **本番環境**: PostgreSQL (Azure Database for PostgreSQL Flexible Server)

### ドキュメント・監視
- **OpenAPI 3.0** + **Swagger UI**
- **Spring Boot Actuator** (ヘルスチェック)

### 選定理由
- **Gradle**: Mavenより高速なビルド、依存関係管理の柔軟性
- **H2**: 開発時の即座起動、設定不要
- **PostgreSQL**: 本番での安定性、Azure/AWSでの標準サポート

## アーキテクチャ

### パッケージ構成
```
com.rct/
├── controller/     # REST API エンドポイント
├── service/        # ビジネスロジック
├── repository/     # データアクセス層
├── entity/         # JPA エンティティ
├── dto/           # データ転送オブジェクト
├── config/        # 設定クラス
└── exception/     # 例外ハンドリング
```

### データベース設計
```sql
login_info (ユーザー情報)
├── id (UUID, PK)
├── login_id (ユニーク)
├── password_hash
├── last_login_date
├── last_login_days (連続ログイン日数)
├── max_login_days (最大連続ログイン日数)
└── total_login_days (累計ログイン日数)

study_book (学習帳)
├── id (UUID, PK)
├── user_id (FK -> login_info)
├── language (プログラミング言語)
├── question (問題文)
└── explanation (解説)

typing_log (タイピング記録)
├── id (UUID, PK)
├── user_id (FK -> login_info)
├── study_book_id (FK -> study_book)
├── started_at (開始時刻)
├── duration_ms (実行時間)
├── total_chars (総文字数)
├── correct_chars (正解文字数)
└── accuracy (正答率)
```

## 🔌 API エンドポイント

### 認証 API
```http
POST /api/auth/register     # 新規登録
POST /api/auth/login        # ログイン
POST /api/auth/demo         # デモログイン
```

### 学習帳 API
```http
GET    /api/studybooks              # 学習帳一覧
POST   /api/studybooks              # 学習帳作成
PUT    /api/studybooks/{id}         # 学習帳更新
DELETE /api/studybooks/{id}         # 学習帳削除
GET    /api/studybooks/random       # ランダム問題取得
```

### タイピング API
```http
POST /api/typing/logs       # タイピング結果記録
GET  /api/typing/stats      # 統計情報取得
```

### 認証方式
現在は簡易トークン認証（`X-User-Id`ヘッダー）。将来JWT認証に移行予定。

## 🐳 Docker での起動

### PostgreSQL + アプリケーション
```bash
# Docker Compose で起動
docker-compose up -d

# ログ確認
docker-compose logs -f rct-backend

# 停止
docker-compose down
```

## ☁️ Azure へのデプロイ

### 前提条件
- Azure CLI インストール済み
- Azure サブスクリプション

### 1. リソース作成
```bash
# Azure にログイン
az login

# リソースグループ作成
az group create --name rct-rg --location japaneast

# PostgreSQL Flexible Server 作成
az postgres flexible-server create \
  --resource-group rct-rg \
  --name rct-postgres-server \
  --location japaneast \
  --admin-user rctadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0 \
  --storage-size 32

# データベース作成
az postgres flexible-server db create \
  --resource-group rct-rg \
  --server-name rct-postgres-server \
  --database-name rctdb
```

### 2. App Service 作成・デプロイ
```bash
# App Service Plan 作成
az appservice plan create \
  --resource-group rct-rg \
  --name rct-plan \
  --location japaneast \
  --sku B1 \
  --is-linux

# Web App 作成
az webapp create \
  --resource-group rct-rg \
  --plan rct-plan \
  --name rct-backend-app \
  --runtime "JAVA:17-java17"

# アプリケーション設定
az webapp config appsettings set \
  --resource-group rct-rg \
  --name rct-backend-app \
  --settings \
    SPRING_PROFILES_ACTIVE=azure \
    SPRING_DATASOURCE_URL="jdbc:postgresql://rct-postgres-server.postgres.database.azure.com:5432/rctdb?sslmode=require" \
    SPRING_DATASOURCE_USERNAME=rctadmin \
    SPRING_DATASOURCE_PASSWORD='YourSecurePassword123!' \
    SPRING_CORS_ORIGINS="https://your-frontend-domain.com"

# JAR ファイルをビルド
./gradlew bootJar

# デプロイ
az webapp deploy \
  --resource-group rct-rg \
  --name rct-backend-app \
  --src-path build/libs/rct-backend-0.0.1-SNAPSHOT.jar \
  --type jar
```

### 3. 動作確認
```bash
# アプリケーションURL取得
az webapp show --resource-group rct-rg --name rct-backend-app --query defaultHostName -o tsv

# ヘルスチェック
curl https://rct-backend-app.azurewebsites.net/actuator/health
```

## 🔧 開発・運用

### 環境変数設定
`.env.example` をコピーして `.env` を作成し、必要に応じて値を変更：

```bash
cp .env.example .env
```

### プロファイル
- `dev`: 開発環境（H2）
- `azure`: Azure本番環境（PostgreSQL）
- `docker`: Docker環境（PostgreSQL）

### ログレベル
```yaml
logging:
  level:
    com.rct: DEBUG          # 開発時
    com.rct: INFO           # 本番時
```

### データベースマイグレーション
Flywayが自動実行：
- `V1__init_schema.sql`: テーブル作成
- `V2__seed_data.sql`: デモデータ投入

### 監視・ヘルスチェック
```bash
# ヘルスチェック
curl http://localhost:8080/actuator/health

# メトリクス
curl http://localhost:8080/actuator/metrics
```

## 🚀 AWS への移行

将来AWSに移行する際の変更点：

### データベース
```bash
# RDS for PostgreSQL 作成
aws rds create-db-instance \
  --db-instance-identifier rct-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username rctadmin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20
```

### ホスティング
- **App Runner**: `apprunner.yaml` 設定
- **ECS Fargate**: タスク定義 + サービス
- **Elastic Beanstalk**: `.ebextensions` 設定

### 設定変更
```bash
# 環境変数のみ変更
SPRING_DATASOURCE_URL=jdbc:postgresql://rct-postgres.xxxxx.ap-northeast-1.rds.amazonaws.com:5432/rctdb
```

## 🧪 テスト

### 単体テスト
```bash
./gradlew test
```

### API テスト（Postman）
`postman/` フォルダ内のコレクションをインポート

### 負荷テスト
```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:8080/api/auth/demo
```

## 🔒 セキュリティ

### 現在の実装
- パスワードハッシュ化（SHA-256 + Salt）
- 入力値バリデーション
- CORS設定

### 今後の改善
- JWT認証の実装
- Rate Limiting
- HTTPS強制

## 📚 参考資料

- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Azure App Service Java](https://docs.microsoft.com/azure/app-service/quickstart-java)
- [PostgreSQL on Azure](https://docs.microsoft.com/azure/postgresql/flexible-server/)

## 🤝 開発参加
※現在非公開

### 新規参加者向け
1. Java 17をインストール
2. リポジトリをクローン
3. `./gradlew bootRun` で起動
4. http://localhost:8080/swagger-ui.html でAPI確認

### コントリビューション
1. フィーチャーブランチ作成
2. 変更実装
3. テスト実行
4. プルリクエスト作成

---

**開発チーム**: RCT Development Team  
**最終更新**: 2025年9月2日