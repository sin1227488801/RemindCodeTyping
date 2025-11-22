# RCT - Remind Code Typing

学習支援型タイピングアプリケーション

## 📋 概要

RCT（Remind Code Typing）は、プログラミング学習者向けのタイピング練習アプリです。
電子学習帳機能と組み合わせて、効率的なコード入力スキルの向上を支援します。

## 🏗️ システム構成

### フロントエンド (Rct/)
- **login.html**: ログイン・新規登録ページ
- **main.html**: メインページ（機能選択・統合画面）
- **typing-practice.html**: タイピング練習専用ページ
- **notebook.html**: 電子学習帳（コンテンツ）
- **records.html**: 学習記録（コンテンツ）
- **typing.html**: タイピング設定（コンテンツ）

### バックエンド (instant-search-backend/)
- **FastAPI** (Python 3) アプリケーション
- **SQLite** データベース
- **REST API** による通信

## 🚀 セットアップ手順

### 1. バックエンド環境構築
```bash
cd instant-search-backend

# 仮想環境の作成（推奨）
python -m venv venv

# 仮想環境の有効化
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 依存パッケージのインストール
pip install -r requirements.txt
```

### 2. データベース初期化
```bash
# マイグレーション実行
alembic upgrade head

# 初期データ投入（オプション）
python scripts/seed_data.py
```

### 3. バックエンド起動
```bash
# 開発サーバー起動
python main.py

# または uvicorn で起動
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. フロントエンド起動
```bash
cd Rct
# ブラウザでlogin.htmlを開く
# Live Serverなどのローカルサーバーを使用することを推奨
```

## 🎯 基本機能

### 1. 認証機能
- **ログイン**: 登録済みユーザーでのログイン
- **新規登録**: 新しいユーザーアカウントの作成
- **デモログイン**: デモユーザーでの体験利用

### 2. タイピング練習機能
- **問題ソース選択**: システム問題、My問題、ミックス
- **言語選択**: 複数言語から選択可能
- **ルール設定**: ランダム出題、苦手優先、得意優先、登録順
- **制限時間設定**: 問題ごとの制限時間
- **問題数設定**: セッションあたりの問題数
- リアルタイムでの正確性・WPM計測
- スコア（判定値）の自動計算
- 結果の自動記録

### 3. 電子学習帳機能
- プログラミング問題・解説の登録
- 言語別での分類
- 自由な言語入力（システム言語 + ユーザー定義言語）
- 登録した問題をタイピング練習で使用可能

### 4. 学習記録機能
- 練習統計の表示（累計問題数、正答率、スコア平均など）
- セッション数の記録
- 得意言語・苦手言語の表示（言語別平均スコア）
- 進捗の可視化

## 📊 データベース設計

### users テーブル
- ユーザー認証情報
- ユーザー基本情報

### study_books テーブル
- 学習帳情報
- ユーザーとの関連付け

### questions テーブル
- 学習項目（問題・答え・説明）
- 言語・カテゴリ・難易度の分類
- 学習帳との関連付け

### typing_logs テーブル
- タイピング練習結果
- WPM・正確性・時間の記録
- 問題との関連付け

### learning_events テーブル
- 学習イベントの記録
- ユーザーアクティビティの追跡

## 🔧 API エンドポイント

### ユーザーAPI (`/api/v1/users`)
- `POST /` - ユーザー登録
- `GET /{user_id}` - ユーザー情報取得
- `PUT /{user_id}` - ユーザー情報更新
- `DELETE /{user_id}` - ユーザー削除

### 学習帳API (`/api/v1/study-books`)
- `GET /` - 学習帳一覧取得
- `POST /` - 学習帳作成
- `GET /{study_book_id}` - 学習帳詳細取得
- `PUT /{study_book_id}` - 学習帳更新
- `DELETE /{study_book_id}` - 学習帳削除
- `GET /languages` - 利用可能な言語一覧取得

### 問題API (`/api/v1/questions`)
- `GET /` - 問題一覧取得（学習帳IDで絞り込み）
- `POST /` - 問題作成
- `GET /{question_id}` - 問題詳細取得
- `PUT /{question_id}` - 問題更新
- `DELETE /{question_id}` - 問題削除
- `GET /random` - ランダム問題取得

### システム問題API (`/api/v1/studybooks`)
- `GET /languages` - システム言語一覧取得
- `GET /system-problems/{language}` - 言語別システム問題取得

### タイピングログAPI (`/api/v1/typing-logs`)
- `POST /` - タイピング結果記録
- `GET /` - タイピングログ一覧取得
- `GET /stats` - タイピング統計取得

### 検索API (`/api/v1/search`)
- `GET /questions` - 問題検索

### ヘルスチェック (`/health`)
- `GET /` - サーバー状態確認

## 🧪 動作確認

### 1. バックエンド接続テスト
```
http://localhost:8000/health
```

### 2. API ドキュメント確認
```
http://localhost:8000/docs
```

### 3. フロントエンド動作確認
1. `login.html` でデモログインまたは新規登録
2. `main.html` で各機能タブを確認
3. タイピング練習を実行

## 🛠️ トラブルシューティング

### データベースファイルが見つからない
```bash
# データベースディレクトリ確認
ls instant-search-backend/data/

# マイグレーション実行
cd instant-search-backend
alembic upgrade head
```

### CORS エラー
- フロントエンドを `file://` プロトコルで開いている場合
- ローカルサーバー（Live Server、Python http.server等）を使用してください

### API 404 エラー
- バックエンドが起動していることを確認
- `http://localhost:8000/health` でテスト
- ポート8000が使用中でないか確認

### モジュールが見つからないエラー
```bash
# 依存パッケージの再インストール
pip install -r requirements.txt
```

## 📝 開発者向け情報

### 技術スタック
- **フロントエンド**: HTML, CSS, JavaScript (Vanilla)
- **バックエンド**: FastAPI (Python 3.10+)
- **データベース**: SQLite 3
- **ORM**: SQLAlchemy
- **マイグレーション**: Alembic

### 設定ファイル
- `app/config.py`: アプリケーション設定
- `alembic.ini`: マイグレーション設定
- `.env.local`: 環境変数（ローカル開発用）

### ディレクトリ構造
```
instant-search-backend/
├── api/              # APIエンドポイント
├── app/              # アプリケーションコア
├── domain/           # ドメインモデル・DTO
├── infra/            # インフラストラクチャ層
├── migrations/       # データベースマイグレーション
├── scripts/          # ユーティリティスクリプト
├── tests/            # テストコード
└── data/             # SQLiteデータベースファイル
```

## � 主なセ機能の詳細

### タイピング練習のスコア計算
スコアは以下の要素で計算されます：
- 正答率（accuracy）
- WPM（Words Per Minute）
- 制限時間内の完了

### 言語別統計
- タイピングログから言語別の平均スコアを自動計算
- 得意言語（最高スコア）と苦手言語（最低スコア）を表示
- 練習回数も記録

### セッション管理
- 5分以内の連続したタイピングを1セッションとしてカウント
- セッション数を正確に記録・表示

## 📄 ライセンス

このプロジェクトは学習目的で作成されています。

---

**最終更新**: 2025年11月22日