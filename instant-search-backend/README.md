# Instant Search Backend

FastAPIベースのバックエンドシステム。既存フロントエンド仕様を変更せずに接続可能で、将来のJava/Spring Boot + PostgreSQLへの移行パスを維持します。

## 概要

このプロジェクトは、タイピング練習アプリケーション用のバックエンドAPIです。以下の特徴があります：

- **ドメイン駆動設計**: 明確な層分離（API/App/Domain/Infrastructure）
- **全文検索**: SQLite FTS5による高速検索（PostgreSQL移行対応）
- **構造化ログ**: JSON形式での包括的なログ出力
- **コンテナ対応**: Docker/Docker Composeによる簡単デプロイ
- **移行準備**: Java/Spring Boot + PostgreSQLへの移行パス

### 主要機能

- ユーザー管理と認証（モック実装、OIDC対応準備済み）
- 学習帳と問題の管理
- タイピング性能の記録と追跡
- 学習分析とイベント追跡
- 問題と回答の全文検索
- ヘルスチェックと監視

## プロジェクト構造

```
instant-search-backend/
├── api/           # FastAPIルーターとエンドポイント
├── app/           # アプリケーション層（ビジネスロジック）
├── domain/        # ドメイン層（エンティティとインターフェース）
├── infra/         # インフラストラクチャ層（データベース実装）
├── migrations/    # データベースマイグレーション
├── tests/         # テストスイート
├── scripts/       # ユーティリティスクリプト
├── main.py        # アプリケーションエントリーポイント
└── requirements.txt
```

## 必要な環境

- **Docker環境**: Docker Desktop または Docker + Docker Compose
- **ローカル環境**: Python 3.11+, pip

## クイックスタート

### 1. Docker環境での開発（推奨）

```bash
# リポジトリのクローン
git clone <repository-url>
cd instant-search-backend

# 完全な開発環境セットアップ（推奨）
make dev-docker
```

このコマンドで以下が自動実行されます：
- Dockerイメージのビルド
- 開発サービスの起動（ホットリロード付き）
- データベースマイグレーション
- サンプルデータの投入

### 2. ローカル環境での開発

```bash
# 1. 依存関係のインストール
make setup
# または
pip install -r requirements.txt

# 2. データベースのセットアップ
make migrate
# または
python -m alembic upgrade head

# 3. サンプルデータの投入（オプション）
make seed
# または
python scripts/seed_data.py

# 4. アプリケーションの起動
make run-local
# または
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. APIドキュメントの確認

起動後、以下のURLでAPIドキュメントを確認できます：

- **本番環境**: http://localhost:8000/docs
- **開発環境**: http://localhost:8001/docs
- **ヘルスチェック**: http://localhost:8000/healthz

## 環境設定

### 環境変数

`.env.local`ファイルを作成して環境変数を設定できます：

```bash
# データベース設定
DATABASE_URL=sqlite:///./data/app.db

# アプリケーション設定
APP_NAME=instant-search-backend
APP_VERSION=1.0.0
DEBUG=true

# ログ設定
LOG_LEVEL=INFO

# 認証設定（将来のOIDC対応）
AUTH_ENABLED=false
```

## 開発コマンド

### 基本操作

```bash
# ヘルプの表示
make help

# 完全な開発セットアップ
make dev                 # ローカル環境
make dev-docker          # Docker環境
```

### データベース操作

```bash
# マイグレーション
make migrate             # ローカル環境
make migrate-docker      # Docker環境

# サンプルデータ投入
make seed                # ローカル環境
make seed-docker         # Docker環境

# 新しいマイグレーション作成
make migration-create MESSAGE="description"

# データベースリセット（注意：全データ削除）
make db-reset

# データベースバックアップ
make db-backup
```

### Docker操作

```bash
# イメージビルド
make build

# サービス管理
make up                  # 本番環境サービス開始
make up-dev              # 開発環境サービス開始（ホットリロード）
make down                # サービス停止
make restart             # サービス再起動

# ログとステータス
make logs                # 本番環境ログ
make logs-dev            # 開発環境ログ
make status              # サービス状態確認
```

### テストと品質管理

```bash
# テスト実行
make test                # ローカル環境
make test-docker         # Docker環境
make test-coverage       # カバレッジレポート付き

# コード品質チェック
make format              # コードフォーマット（black, isort）
make lint                # リンティング（flake8）
make type-check          # 型チェック（mypy）
make quality-check       # 全品質チェック実行
```

### 監視とヘルスチェック

```bash
# ヘルスチェック
make health              # アプリケーションの健全性確認

# クリーンアップ
make clean               # 一時ファイル削除
make clean-docker        # Dockerリソース削除
```

## API使用方法

### 認証

現在はモック認証を使用しています。リクエストヘッダーに`X-User-Id`を設定してください：

```bash
curl -H "X-User-Id: alice@example.com" http://localhost:8000/api/users/me
```

### 主要エンドポイント

#### ユーザー管理
- `POST /api/users/signup` - ユーザー登録
- `GET /api/users/me` - 現在のユーザー情報取得

#### 学習帳管理
- `GET /api/study-books` - 学習帳一覧取得
- `POST /api/study-books` - 学習帳作成
- `GET /api/study-books/{id}` - 学習帳詳細取得
- `PUT /api/study-books/{id}` - 学習帳更新
- `DELETE /api/study-books/{id}` - 学習帳削除

#### 問題管理
- `GET /api/study-books/{id}/questions` - 問題一覧取得
- `POST /api/study-books/{id}/questions` - 問題作成
- `GET /api/questions/{id}/random` - ランダム問題取得

#### 検索
- `GET /api/search/questions?q={query}` - 問題検索

#### タイピングログ
- `POST /api/typing-logs` - タイピング結果記録
- `GET /api/typing-logs` - タイピングログ取得

#### 学習分析
- `POST /api/learning-events` - 学習イベント記録
- `GET /api/learning-events` - 学習イベント取得

### レスポンス例

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Python Basics",
  "description": "Fundamental Python concepts",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Docker構成

### サービス構成

- **app**: 本番環境用サービス（ポート8000）
- **app-dev**: 開発環境用サービス（ポート8001、ホットリロード付き）

### 永続化データ

- `./data/`: SQLiteデータベースファイル
- `./logs/`: アプリケーションログファイル

### Docker Compose プロファイル

```bash
# 本番環境プロファイル
docker compose up app

# 開発環境プロファイル
docker compose --profile dev up app-dev
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. データベース接続エラー

```bash
# データベースファイルの権限確認
ls -la data/

# マイグレーション再実行
make migrate

# データベースリセット（注意：全データ削除）
make db-reset
```

#### 2. ポート競合エラー

```bash
# 使用中のポートを確認
netstat -tulpn | grep :8000

# 別のポートを使用
python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

#### 3. Docker関連の問題

```bash
# Dockerリソースのクリーンアップ
make clean-docker

# イメージの再ビルド
make build

# ログの確認
make logs
```

#### 4. 依存関係の問題

```bash
# 依存関係の再インストール
pip install -r requirements.txt --force-reinstall

# 仮想環境の再作成
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

#### 5. マイグレーションエラー

```bash
# マイグレーション履歴の確認
python -m alembic history

# 特定のリビジョンに戻す
python -m alembic downgrade <revision>

# マイグレーションの再実行
python -m alembic upgrade head
```

### ログの確認

```bash
# アプリケーションログ
tail -f logs/app.log

# Dockerログ
make logs

# 構造化ログの検索例
grep "ERROR" logs/app.log | jq .
```

### パフォーマンス監視

```bash
# ヘルスチェック
curl http://localhost:8000/healthz

# データベース統計
sqlite3 data/app.db ".schema"
sqlite3 data/app.db "SELECT COUNT(*) FROM users;"
```

## 移行ロードマップ

### PostgreSQL移行

1. **データベース移行**
   - SQLiteからPostgreSQLへのスキーマ変換
   - データ移行スクリプトの実行
   - FTS5からtsvector/pg_trgmへの検索機能移行

2. **設定変更**
   - `DATABASE_URL`の更新
   - 接続プール設定の追加
   - パフォーマンスチューニング

### Spring Boot移行

1. **アーキテクチャ移行**
   - FastAPI → Spring Boot
   - Pydantic → Jackson/Bean Validation
   - SQLAlchemy → Spring Data JPA

2. **API互換性維持**
   - 同一エンドポイント構造
   - 同一レスポンス形式
   - 同一エラーハンドリング

3. **段階的移行**
   - ドメイン層の移行
   - インフラストラクチャ層の移行
   - API層の移行

### 移行支援ツール

- データベーススキーマ変換スクリプト
- API互換性テストスイート
- パフォーマンス比較ツール

## アーキテクチャ

### 層構造

```
┌─────────────────┐
│   API Layer     │  FastAPIルーター、エンドポイント
├─────────────────┤
│   App Layer     │  ビジネスロジック、ユースケース
├─────────────────┤
│  Domain Layer   │  エンティティ、リポジトリIF
├─────────────────┤
│  Infra Layer    │  データベース、検索実装
└─────────────────┘
```

### 主要コンポーネント

- **認証**: モック実装（OIDC対応準備済み）
- **検索**: SQLite FTS5（PostgreSQL移行対応）
- **ログ**: 構造化JSON形式
- **監視**: ヘルスチェックエンドポイント

## 貢献

### 開発フロー

1. 機能ブランチの作成
2. コード実装
3. テスト実行: `make test`
4. 品質チェック: `make quality-check`
5. プルリクエスト作成

### コーディング規約

- **フォーマット**: Black + isort
- **リンティング**: flake8
- **型チェック**: mypy
- **テスト**: pytest

## ライセンス

[ライセンス情報をここに記載]