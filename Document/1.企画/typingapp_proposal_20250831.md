学習支援型タイピングアプリ 企画書（改訂 2025-08-31）
1. 目的（Goal）

「電子学習帳」に 言語／問題／解説 を蓄積し、ランダム出題による反復学習を支援する。

動くMVPの早期提供 と 共同開発しやすい軽量アーキテクチャ を優先する。

プライマリクラウドは Azure。将来的に AWS への移行も可能とする。

2. 想定ユーザーとユースケース（Users & Use Cases）

短時間のトレーニングを必要とする学習者・実務者。

フロー：デモ（ゲスト） → ログイン → 学習帳（StudyBook）作成／管理 → ランダム出題 → 成績閲覧。

3. コア機能（Core Features）

認証（ゲスト／登録ユーザー）

学習帳（StudyBook）のCRUDと検索

ランダム出題用エンドポイント

タイピング結果（TypingLog）の記録・集計（正答率、連続日数、累計）

4. 画面（概要 / Screens）

タイトル／ログイン／デモ

学習帳一覧・編集

タイピング（練習）画面

成績サマリー

5. 技術選定（最小で拡張可能 / Tech Choices）

バックエンド：Java 17 / Spring Boot 3（Web, Validation, Data JPA）

DB：開発＝H2 または SQLite → 本番＝Azure Database for PostgreSQL Flexible Server

マイグレーション：Flyway（初期化＋シード）

ホスティング：Azure App Service（Linux, Java 17）

可観測性：Application Insights（任意）

ドキュメント：springdoc-openapi、READMEクイックスタート、Postman（任意）

セキュリティ：まずは簡易JWT／ゲスト対応、後に本番強化（Key Vault、厳格CORS）

6. スコープ（Scope）

対象（In）：既存フロントを変更せずに接続できるREST API

非対象（初期 / Out）：エンタープライズSSO、課金、複雑なRBAC、マルチテナントのリアルタイム機能

7. 進め方（Process）

モノリスで開始し、将来分割できる余地を残す。

ドキュメント先行（OpenAPI／README／ERD）。

8. リリース計画（Release Plan）

P0：ローカル（H2）

P1：Azure（App Service + PostgreSQL）

P2：監視／バックアップ、JWT本番化

将来：弱点対策などの賢い出題

9. AWS への移行計画（将来 / Migration Plan）

DB：Azure PostgreSQL → AWS RDS for PostgreSQL

コンピュート：App Service → App Runner／ECS／Fargate

IaC：Bicep／Terraformモジュールでプロバイダを差し替え可能にする