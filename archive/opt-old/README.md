# Optional Configuration Directory

このディレクトリには、プロジェクトのオプション設定ファイルとスクリプトが含まれています。

## 📁 ディレクトリ構成

### 🔧 config/
プロジェクト設定ファイル
- `.eslintrc.js` - ESLint設定
- `.prettierrc.js`, `.prettierignore` - Prettier設定
- `.pre-commit-config.yaml` - Git pre-commit hooks
- `.yamllint.yml` - YAML linting設定
- `cypress.config.js` - E2Eテスト設定
- `webpack.config.js` - フロントエンドバンドル設定
- `docker-compose.yml` - Docker環境設定
- `Dockerfile.frontend` - フロントエンドDocker設定
- `nginx.conf` - Webサーバー設定
- `.dockerignore` - Docker除外ファイル設定
- `Dockerfile` - バックエンドDocker設定

### 📜 scripts/
自動化スクリプト
- `quality-check.sh/.bat` - コード品質チェック
- `run-system-tests.sh/.bat` - システムテスト実行
- `run-tests.sh/.bat` - 全テスト実行
- `run-test-coverage.sh/.bat` - カバレッジレポート生成

### ⚙️ backend-config/
バックエンド品質管理設定
- `checkstyle.xml` - Checkstyle設定
- `pmd-rules.xml` - PMD静的解析設定
- `dependency-check-suppressions.xml` - 脆弱性チェック除外設定
- `test-coverage-config.xml` - テストカバレッジ設定

## 🎯 使用タイミング

### 基本開発時
- **不要**: これらの設定は無視して開発に集中

### 品質向上時
- `scripts/quality-check` でコード品質をチェック
- `backend-config/` で静的解析を強化

### 本番環境構築時
- `config/docker-compose.yml` でDocker環境構築
- `config/nginx.conf` でWebサーバー設定

### CI/CD構築時
- `scripts/` の各スクリプトをパイプラインで使用
- `.pre-commit-config.yaml` でGitフック設定

## 🔄 使用方法

必要に応じてファイルをルートディレクトリにコピー：

```bash
# 例: Docker環境を使用する場合
cp opt/config/docker-compose.yml ./
cp opt/config/nginx.conf ./

# 例: コード品質チェックを実行する場合
cp opt/scripts/quality-check.sh ./
./quality-check.sh
```