# Archive Directory

このディレクトリには、プロジェクトの高度な機能や将来的に必要になる可能性のあるファイルが整理されています。

## 📁 ディレクトリ構成

### 🏗️ deployment-tools/
本番環境デプロイメント関連のファイル
- `BUILD_PIPELINE.md` - CI/CDパイプライン設定ガイド
- `docker-compose.production.yml` - 本番環境Docker設定
- `docker-compose.staging.yml` - ステージング環境Docker設定
- `deploy.sh` - デプロイメントスクリプト
- `infrastructure/` - Terraform等のインフラ定義

### 🧪 advanced-testing/
高度なテスト機能とツール
- `check-architecture-compliance.sh` - アーキテクチャ準拠チェック
- `fix-code-quality.sh` - コード品質自動修正
- `generate-coverage-report.sh` - カバレッジレポート生成
- `scripts/` - テスト自動化スクリプト
- `QUALITY_SETUP.md` - 品質管理セットアップガイド
- `performance/` - パフォーマンステスト
- `security/` - セキュリティテスト
- `migration/` - データマイグレーションテスト

### 🔒 security-tools/
セキュリティ関連ツール
- `.zap/` - OWASP ZAP設定ファイル

### 📊 monitoring/
監視・メトリクス収集機能
- `infrastructure/monitoring/` - バックエンド監視機能

### ⚡ performance/
パフォーマンス最適化機能
- `infrastructure/performance/` - フロントエンド最適化
- `monitoring/` - パフォーマンス監視
- `frontend-performance-tests/` - フロントエンドパフォーマンステスト

### 🔄 migration/
データマイグレーション関連
- `scripts/` - マイグレーションスクリプト

### 📚 documentation/
詳細ドキュメント
- `docs/` - プロジェクト詳細ドキュメント
- `Document/` - 企画・設計ドキュメント
- `backend-docs/` - バックエンドAPI詳細ドキュメント
- `documentation/` - テスト用ドキュメント生成機能

### 🏛️ legacy-features/
レガシー機能・互換性維持用
- `LegacyApiAdapter.js` - 旧API互換アダプター

## 🎯 使用タイミング

### 初学者・基本開発時
- **使用しない**: archiveディレクトリは無視して、メインプロジェクトに集中

### 本番環境構築時
- `deployment-tools/` を参照してインフラ構築
- `monitoring/` でシステム監視を設定

### 品質向上・最適化時
- `advanced-testing/` で高度なテスト実装
- `performance/` でパフォーマンス最適化
- `security-tools/` でセキュリティ強化

### 運用・保守時
- `migration/` でデータ移行
- `documentation/` で詳細仕様確認

## ⚠️ 注意事項

1. **依存関係**: archiveファイルは現在のメインプロジェクトから参照されていません
2. **動作保証**: archive内のファイルは最新のプロジェクト構造に合わせて更新が必要な場合があります
3. **復元時**: ファイルを復元する際は、現在のプロジェクト構造に合わせて調整してください

## 🔄 復元方法

必要に応じてファイルを元の場所に戻すことができます：

```bash
# 例: デプロイメント機能を復元
cp -r archive/deployment-tools/infrastructure ./
cp archive/deployment-tools/deploy.sh ./

# 例: 高度なテスト機能を復元
cp -r archive/advanced-testing/scripts ./
```

復元後は、現在のプロジェクト構造に合わせてパスやインポート文の調整が必要です。