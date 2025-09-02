学習支援型タイピングアプリ 要件定義書（改訂 2025-08-31）
1. 目的／範囲（Objective/Scope）

フロントを変更せず に動作する最小のREST APIを提供する。

ローカル即時起動 → Azure（App Service + Azure Database for PostgreSQL）へ展開。

将来的に AWS へ移行可能とする。

2. 機能要件（API / Functional Requirements）
2.1 認証／デモ（Auth / Demo）

POST /auth/register {login_id, password} → 201

POST /auth/login {login_id, password} → 200 {token or session}

POST /auth/demo → 200 {userId or token}

2.2 学習帳（StudyBook）

GET /studybooks?language=&query=&page=&size=

POST /studybooks {language, question, explanation}

PUT /studybooks/{id}

DELETE /studybooks/{id}

GET /studybooks/random?language=&limit=10

2.3 タイピング（Typing）

POST /typing/logs {study_book_id, duration_ms, total_chars, correct_chars}

GET /stats/summary

3. データ要件（スキーマ / Data Requirements）

login_info（id UUID, login_id unique, password_hash, last_login_date, last_login_days, max_login_days, total_login_days, created_at, updated_at）

study_book（id UUID, user_id FK → login_info, language, question, explanation, created_at, updated_at）

typing_log（id UUID, user_id FK, study_book_id FK, started_at, duration_ms, total_chars, correct_chars, accuracy DECIMAL(5,2), created_at）

マイグレーション：Flyway（V1__init.sql）＋ デモシード（V1_1__seed.sql）

4. 非機能要件（Non-Functional）

性能：小規模ユーザー前提で通常 < 300ms

可用性：初期は単一のApp Serviceインスタンス

セキュリティ：開発はJWT／ゲスト → 本番はJWT強化、CORS、環境変数、後にKey Vault

ログ／監視：Application Insights（任意）、構造化JSONログ

5. 環境（Environments）

ローカル：Java 17, Spring Boot 3, H2／SQLite；./gradlew bootRun または mvn spring-boot:run

Azure：

App Service（Linux, Java 17）

Azure Database for PostgreSQL Flexible Server

（任意）Application Insights

可搬性：JPA／標準SQLを優先

6. 設定（環境変数例 / Config）

SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD

SPRING_JPA_HIBERNATE_DDL_AUTO=validate

SPRING_CORS_ORIGINS=http://localhost:3000,https://<frontend>

JWT_SECRET=...（任意）

7. Azure 最小CLI例（Azure Minimal CLI Example）
RG=typingapp-rg
LOC=japaneast
PG=typingapp-pg
APPPLAN=typingapp-plan
APP=typingapp-api

# リソースグループ作成
az group create -n $RG -l $LOC

# PostgreSQL フレキシブルサーバー作成（最小例）
az postgres flexible-server create \
  --resource-group $RG \
  --name $PG \
  --location $LOC \
  --tier Burstable --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 16 \
  --public-access 0.0.0.0-255.255.255.255 \
  --yes

# App Service プラン／Web App 作成（Java 17）
az appservice plan create -g $RG -n $APPPLAN --sku B1 --is-linux
az webapp create -g $RG -p $APPPLAN -n $APP --runtime "JAVA:17-java17"

# アプリ設定（DB接続／CORS）
az webapp config appsettings set -g $RG -n $APP --settings \
  SPRING_DATASOURCE_URL="jdbc:postgresql://<host>:5432/<db>" \
  SPRING_DATASOURCE_USERNAME="<user>" \
  SPRING_DATASOURCE_PASSWORD="<password>" \
  SPRING_CORS_ORIGINS="http://localhost:3000"

# jar を含む zip を作成してデプロイ
az webapp deploy -g $RG -n $APP --src-path ./build.zip

8. 運用（Operations）

バックアップ：PostgreSQLのデフォルトを起点に、後で保持期間拡張

監視：Application Insights

シークレット：当初はアプリ設定 → 後にKey Vaultへ

IaC：Bicep／Terraformモジュール化（将来はAWSへ差し替え）

9. テスト（Testing）

ユニット：DTO／Service／Repository

結合：まず /studybooks/random と /typing/logs

E2E：Postman（任意）

10. 受け入れ条件（DoD）

ローカル（H2）初回起動 < 3分；Flyway 初期化＋シード完了

フロントからのCORSが通る

Azureデプロイが手順どおり再現可能

README／OpenAPI／ERDが揃い、30分以内でオンボーディング可能