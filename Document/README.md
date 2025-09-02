# RCT - Remind Code Typing

学習支援型タイピングアプリケーション

## 📋 概要

RCT（Remind Code Typing）は、プログラミング学習者向けのタイピング練習アプリです。
電子学習帳機能と組み合わせて、効率的なコード入力スキルの向上を支援します。

## 🏗️ システム構成

### フロントエンド (Rct/)
- **index.html**: ログイン・新規登録ページ
- **main.html**: メインページ（機能選択・統合画面）
- **typing.html**: タイピング練習専用ページ
- **notebook.html**: 電子学習帳専用ページ
- **records.html**: 学習記録専用ページ

### バックエンド (rct-backend/)
- **Spring Boot** アプリケーション
- **MySQL** データベース
- **REST API** による通信

## 🚀 セットアップ手順

### 1. データベース起動
```powershell
# MySQLコンテナを作成・起動
docker run --name rct-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=rct_db -p 3306:3306 -d mysql:8.0

# データベースが起動するまで待機（10-15秒）
docker logs rct-mysql
```

### 2. バックエンド起動
```powershell
cd RemindCodeTyping/rct-backend
./mvnw.cmd spring-boot:run
```

### 3. フロントエンド起動
```powershell
cd RemindCodeTyping/Rct
# ブラウザでindex.htmlを開く
start index.html
```

## 🎯 基本機能

### 1. 認証機能
- **ログイン**: 登録済みユーザーでのログイン
- **新規登録**: 新しいユーザーアカウントの作成
- **デモプレイ**: ゲストユーザーでの体験利用

### 2. タイピング練習機能
- 学習帳からランダムに問題を出題
- リアルタイムでの正確性・時間計測
- 結果の自動記録

### 3. 電子学習帳機能
- プログラミング問題・答え・説明の登録
- 言語別での分類
- 学習項目の参照・管理

### 4. 学習記録機能
- 練習統計の表示（総回数、平均正確性、最高スコアなど）
- 学習履歴の確認
- 進捗の可視化

## 📊 データベース設計

### LOGIN_INFO テーブル
- ユーザー認証情報
- ログイン統計（連続日数、累計日数など）

### STUDY_BOOK テーブル
- 学習項目（問題・答え・説明）
- 言語分類

### TYPING_RECORD テーブル
- タイピング練習結果
- スコア・正確性・時間の記録

## 🔧 API エンドポイント

### 認証API
- `GET /api/auth/demo` - デモログイン
- `POST /api/auth/login` - ユーザーログイン
- `POST /api/auth/register` - 新規登録
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/user` - 現在のユーザー情報

### 学習帳API
- `GET /api/studybook` - 学習帳一覧取得
- `POST /api/studybook` - 学習項目追加

### タイピングAPI
- `GET /api/typing/question` - ランダム問題取得
- `POST /api/typing/result` - 結果送信

### 記録API
- `GET /api/records/statistics` - 学習統計取得
- `GET /api/records/history` - 学習履歴取得

## 🧪 動作確認

### 1. バックエンド接続テスト
```
http://localhost:8080/api/test/hello
```

### 2. デモログインテスト
```
http://localhost:8080/api/auth/demo
```

### 3. フロントエンド動作確認
1. `index.html` でデモプレイボタンをクリック
2. `main.html` で各機能タブを確認
3. タイピング練習を実行

## 🛠️ トラブルシューティング

### データベース接続エラー
```powershell
# データベース状態確認
docker ps

# データベース起動
docker start rct-mysql

# ログ確認
docker logs rct-mysql
```

### CORS エラー
- フロントエンドを `file://` プロトコルで開いている場合
- ローカルサーバー（Live Server等）を使用してください

### API 404 エラー
- バックエンドが起動していることを確認
- `http://localhost:8080/api/test/hello` でテスト

## 📝 開発者向け情報

### 技術スタック
- **フロントエンド**: HTML, CSS, JavaScript (Vanilla)
- **バックエンド**: Spring Boot, Java 11+
- **データベース**: MySQL 8.0
- **コンテナ**: Docker

### 設定ファイル
- `application.properties`: メイン設定
- `application-test.properties`: テスト用設定
- `application-nodb.properties`: DB無し設定

## 📄 ライセンス

このプロジェクトは学習目的で作成されています。

---

**開発者**: PJ Staff A, PJ Staff B  
**最終更新**: 2025年8月30日