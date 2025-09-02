# RCT デプロイガイド

### 1. フロントエンド公開（GitHub Pages）

#### Step 1: リポジトリ準備
```bash
# 現在のディレクトリで実行
git add .
git commit -m "Portfolio deployment preparation"
git push origin main
```

#### Step 2: GitHub Pages設定
1. GitHubリポジトリページにアクセス
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: main / (root)
5. Save

**公開URL**: `https://[ユーザー名].github.io/RemindCodeTyping/Rct/login-new.html`

### 2. バックエンド公開（Railway - 無料）

#### Step 1: Railway準備
```bash
# Railwayアカウント作成（GitHubでサインアップ）
# https://railway.app/

# プロジェクト作成
# "Deploy from GitHub repo" を選択
# RemindCodeTypingリポジトリを選択
```

#### Step 2: 環境設定
Railway Dashboard で以下を設定：
```
SPRING_PROFILES_ACTIVE=railway
SPRING_DATASOURCE_URL=postgresql://[自動生成]
PORT=8080
```

### 3. 設定ファイル作成

#### railway.json (バックエンド用)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "rct-backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "java -jar build/libs/rct-backend-0.0.1-SNAPSHOT.jar",
    "healthcheckPath": "/actuator/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4. 即座デプロイ用Dockerfile
```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY rct-backend/build/libs/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

## 🎯 面談用デモ準備

### デモシナリオ
1. **ログイン画面**: 認証システムの説明
2. **タイピング練習**: コア機能のデモ
3. **学習帳管理**: CRUD操作の実演
4. **学習記録**: データ可視化の紹介

### 技術アピールポイント
- **フロントエンド**: モダンJavaScript、クリーンアーキテクチャ
- **バックエンド**: Spring Boot、RESTful API、PostgreSQL
- **インフラ**: Docker、CI/CD、クラウドデプロイ
- **品質**: テスト駆動開発、静的解析、セキュリティ

### 面談での説明用
```
「このアプリケーションは、プログラマー向けの学習支援タイピング練習ツールです。

技術スタック：
- フロントエンド: Vanilla JavaScript + クリーンアーキテクチャ
- バックエンド: Spring Boot + PostgreSQL
- インフラ: Docker + Railway/GitHub Pages
- 品質保証: Jest + JUnit + 静的解析

特徴：
1. レスポンシブデザイン
2. リアルタイムタイピング判定
3. 学習進捗の可視化
4. セキュアな認証システム
5. RESTful API設計
」
```

## ⚡ 緊急時の代替案

### オプション2: Netlify Drop（最速）
1. https://app.netlify.com/drop にアクセス
2. Rctフォルダをドラッグ&ドロップ
3. 即座に公開URL取得

### オプション3: Vercel（高性能）
```bash
npm install -g vercel
cd Rct
vercel --prod
```

## 📱 モバイル対応確認

### レスポンシブテスト
```bash
# 開発者ツールでテスト
# iPhone SE: 375x667
# iPad: 768x1024
# Desktop: 1920x1080
```

## 🔧 最終チェックリスト

### デプロイ前
- [ ] 全ファイルのコミット
- [ ] README.mdの更新
- [ ] 環境変数の設定
- [ ] CORS設定の確認

### デプロイ後
- [ ] フロントエンドアクセス確認
- [ ] API接続テスト
- [ ] モバイル表示確認
- [ ] パフォーマンステスト

### 面談準備
- [ ] デモシナリオの練習
- [ ] 技術説明の準備
- [ ] 質問対応の準備
- [ ] ポートフォリオURLの共有

## 🎉 成功パターン

### 面談でのアピール
1. **実際に動くアプリケーション**を見せる
2. **コードの品質**を説明する
3. **アーキテクチャの設計思想**を語る
4. **今後の改善計画**を提示する

### 追加開発提案
- PWA対応
- リアルタイム対戦機能
- AI による問題生成
- 詳細な分析ダッシュボード