# RCT - Remind Code Typing

学習支援型タイピングアプリケーション

## 🚀 クイックスタート

### フロントエンド（UI確認）
ブラウザで以下のファイルを開く：

```
Rct/login.html     - ログイン画面
Rct/main.html      - メインアプリケーション
```

**デモログイン:**
- ID: `demo`
- パスワード: `password`

### バックエンド（API）
```bash
cd instant-search-backend
docker compose up -d app
```

API確認: http://localhost:8000/docs

## 📁 プロジェクト構成

```
RemindCodeTyping/
├── Rct/                    # フロントエンド
│   ├── login.html          # ログイン画面
│   ├── main.html           # メインアプリ
│   ├── typing.html         # タイピング設定
│   ├── typing-practice.html # タイピング練習
│   ├── notebook.html       # 電子学習帳
│   ├── records.html        # 学習記録
│   ├── css/                # スタイルシート
│   ├── js/                 # JavaScript
│   └── images/             # 画像ファイル
├── instant-search-backend/ # バックエンド（FastAPI + SQLite）
├── Document/               # プロジェクト資料
└── archive/                # 旧ファイル・テスト用ファイル
```

## 🎯 主な機能

- **タイピング練習**: プログラミング言語別の練習問題
- **電子学習帳**: 独自問題の作成・管理
- **学習記録**: タイピング成績の記録・分析
- **問題検索**: 全文検索による問題発見

## 🔧 技術スタック

- **フロントエンド**: HTML5/CSS3/JavaScript（バニラJS）
- **バックエンド**: Python FastAPI + SQLite
- **認証**: ローカルストレージベース（デモ版）

## 📝 開発メモ

- フロントエンドは静的ファイルとして動作
- バックエンドAPIは別途起動が必要
- デモ用認証システム実装済み
- レスポンシブデザイン対応