# Data Directory

このディレクトリには、プロジェクトのサンプルデータ、設定例、テストデータが含まれています。

## 📁 ディレクトリ構成

### 📋 examples/
設定ファイルの例
- `.env.example` - フロントエンド環境変数例
- `.env.example` (backend) - バックエンド環境変数例
- `.env.production.example` - 本番環境変数例
- `openapi.yml` - API仕様書

### 🧪 fixtures/
テストデータとE2Eテスト
- `cypress/` - Cypressテストスイート
  - `e2e/` - E2Eテストケース
  - `component/` - コンポーネントテスト
  - `fixtures/` - テスト用データ
  - `support/` - テストサポートファイル

## 🎯 使用タイミング

### 初期セットアップ時
```bash
# 環境変数ファイルを作成
cp data/examples/.env.example .env
cp data/examples/.env.example rct-backend/.env
```

### API開発時
- `examples/openapi.yml` でAPI仕様を確認

### テスト実行時
```bash
# E2Eテストを実行（cypressディレクトリをルートに戻す）
cp -r data/fixtures/cypress ./
npx cypress open
```

### 本番デプロイ時
```bash
# 本番環境変数を設定
cp data/examples/.env.production.example .env.production
# 必要な値を編集
```

## 📝 ファイル説明

### 環境変数例
- **開発環境**: H2データベース、デバッグモード有効
- **本番環境**: PostgreSQL、セキュリティ強化設定

### テストデータ
- **認証テスト**: ログイン・登録フロー
- **学習帳テスト**: CRUD操作
- **タイピングテスト**: セッション記録・統計

### API仕様
- **OpenAPI 3.0**: 全エンドポイントの詳細仕様
- **認証方式**: 現在は簡易トークン、将来JWT対応予定