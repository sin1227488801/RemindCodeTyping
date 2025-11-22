# PostgreSQL移行戦略

## 概要

このドキュメントは、instant-search-backendをSQLiteからPostgreSQLに移行するための詳細な戦略とガイドを提供します。移行は段階的に実行され、データの整合性とシステムの可用性を維持しながら行われます。

## 移行の背景と目的

### 現在の状況
- **データベース**: SQLite with FTS5 full-text search
- **検索機能**: SQLite FTS5 virtual tables
- **環境**: 開発・テスト環境での使用

### 移行後の目標
- **データベース**: PostgreSQL with tsvector/pg_trgm search
- **検索機能**: PostgreSQL native full-text search
- **環境**: 本番環境でのスケーラビリティとパフォーマンス向上

## 移行戦略概要

### フェーズ1: 準備段階
1. PostgreSQL環境のセットアップ
2. スキーマ互換性の検証
3. 移行スクリプトの開発とテスト

### フェーズ2: 検索戦略の実装
1. PostgreSQL検索戦略の実装
2. 検索インデックスの最適化
3. パフォーマンステストの実行

### フェーズ3: データ移行
1. データエクスポート・インポートの実行
2. データ整合性の検証
3. 検索インデックスの再構築

### フェーズ4: 本番移行
1. 段階的な切り替え
2. 監視とロールバック準備
3. 最終検証

## 詳細移行手順

### 1. PostgreSQL環境セットアップ

#### 1.1 PostgreSQL拡張機能の有効化

```sql
-- 全文検索用拡張機能
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- UUID生成用拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### 1.2 データベース設定の最適化

```sql
-- 全文検索パフォーマンス向上
ALTER SYSTEM SET shared_preload_libraries = 'pg_trgm';
ALTER SYSTEM SET default_text_search_config = 'pg_catalog.english';

-- インデックス作成の高速化
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET max_parallel_maintenance_workers = 4;

SELECT pg_reload_conf();
```

### 2. スキーマ移行

#### 2.1 テーブル定義の変換

**SQLite → PostgreSQL スキーママッピング**

```sql
-- Users テーブル
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Study Books テーブル
CREATE TABLE study_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_books_user_id ON study_books(user_id);

-- Questions テーブル
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_book_id UUID NOT NULL REFERENCES study_books(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 全文検索用のtsvectorカラム
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(question, '') || ' ' || coalesce(answer, ''))
    ) STORED
);

CREATE INDEX idx_questions_study_book_id ON questions(study_book_id);
CREATE INDEX idx_questions_search_vector ON questions USING GIN(search_vector);
CREATE INDEX idx_questions_trigram ON questions USING GIN(question gin_trgm_ops, answer gin_trgm_ops);

-- Typing Logs テーブル
CREATE TABLE typing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    wpm INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    took_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_typing_logs_user_id ON typing_logs(user_id);
CREATE INDEX idx_typing_logs_question_id ON typing_logs(question_id);
CREATE INDEX idx_typing_logs_created_at ON typing_logs(created_at);

-- Learning Events テーブル
CREATE TABLE learning_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    app_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    object_id VARCHAR(255),
    score DECIMAL(10,2),
    duration_ms INTEGER,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learning_events_user_occurred ON learning_events(user_id, occurred_at DESC);
CREATE INDEX idx_learning_events_action ON learning_events(action);
```

#### 2.2 データ型変換マッピング

| SQLite型 | PostgreSQL型 | 変換ルール |
|----------|-------------|-----------|
| TEXT (UUID) | UUID | `uuid_generate_v4()` または文字列からのキャスト |
| TEXT (ISO8601) | TIMESTAMPTZ | `TO_TIMESTAMP()` 関数で変換 |
| INTEGER | INTEGER | 直接マッピング |
| REAL | DECIMAL | 精度指定で変換 |
| TEXT | VARCHAR/TEXT | 長さ制限に応じて選択 |

### 3. 検索戦略の移行

#### 3.1 FTS5からPostgreSQL検索への変換

**現在のSQLite FTS5実装:**
```sql
-- FTS5仮想テーブル
CREATE VIRTUAL TABLE questions_fts USING fts5(
    question_id UNINDEXED,
    question,
    answer
);

-- 検索クエリ
SELECT question_id, highlight(questions_fts, 1, '<mark>', '</mark>') as highlight
FROM questions_fts 
WHERE questions_fts MATCH ?
ORDER BY rank;
```

**PostgreSQL tsvector + pg_trgm実装:**
```sql
-- 全文検索（tsvector使用）
SELECT 
    q.id,
    q.question,
    q.answer,
    ts_headline('english', q.question || ' ' || q.answer, plainto_tsquery('english', $1)) as highlight,
    ts_rank(q.search_vector, plainto_tsquery('english', $1)) as rank
FROM questions q
WHERE q.search_vector @@ plainto_tsquery('english', $1)
ORDER BY rank DESC;

-- 類似検索（pg_trgm使用）
SELECT 
    q.id,
    q.question,
    q.answer,
    similarity(q.question || ' ' || q.answer, $1) as similarity
FROM questions q
WHERE (q.question || ' ' || q.answer) % $1
ORDER BY similarity DESC;

-- ハイブリッド検索（両方を組み合わせ）
SELECT 
    q.id,
    q.question,
    q.answer,
    CASE 
        WHEN q.search_vector @@ plainto_tsquery('english', $1) THEN
            ts_headline('english', q.question || ' ' || q.answer, plainto_tsquery('english', $1))
        ELSE
            q.question || ' ' || q.answer
    END as highlight,
    COALESCE(
        ts_rank(q.search_vector, plainto_tsquery('english', $1)),
        similarity(q.question || ' ' || q.answer, $1) * 0.5
    ) as score
FROM questions q
WHERE q.search_vector @@ plainto_tsquery('english', $1)
   OR (q.question || ' ' || q.answer) % $1
ORDER BY score DESC;
```

#### 3.2 PostgreSQL検索戦略の実装

```python
# infra/postgresql_search.py
from typing import List, Optional
import asyncpg
from domain.search import SearchStrategy, SearchResult
from domain.models import UUID

class PostgreSQLSearchStrategy(SearchStrategy):
    def __init__(self, database_url: str):
        self.database_url = database_url
        self._pool: Optional[asyncpg.Pool] = None
    
    async def initialize(self):
        self._pool = await asyncpg.create_pool(self.database_url)
    
    async def search_questions(self, query: str, user_id: UUID, limit: int = 50) -> List[SearchResult]:
        if not self._pool:
            await self.initialize()
        
        # ハイブリッド検索クエリ
        sql = """
        SELECT DISTINCT
            q.id,
            q.question,
            q.answer,
            CASE 
                WHEN q.search_vector @@ plainto_tsquery('english', $1) THEN
                    ts_headline('english', q.question || ' ' || q.answer, plainto_tsquery('english', $1))
                ELSE
                    q.question || ' ' || q.answer
            END as highlight,
            COALESCE(
                ts_rank(q.search_vector, plainto_tsquery('english', $1)),
                similarity(q.question || ' ' || q.answer, $1) * 0.5
            ) as score
        FROM questions q
        JOIN study_books sb ON q.study_book_id = sb.id
        WHERE sb.user_id = $2
          AND (q.search_vector @@ plainto_tsquery('english', $1)
               OR (q.question || ' ' || q.answer) % $1)
        ORDER BY score DESC
        LIMIT $3;
        """
        
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(sql, query, str(user_id), limit)
            
            return [
                SearchResult(
                    question_id=UUID(row['id']),
                    question=row['question'],
                    answer=row['answer'],
                    highlight=row['highlight'],
                    score=float(row['score'])
                )
                for row in rows
            ]
    
    async def rebuild_index(self) -> None:
        if not self._pool:
            await self.initialize()
        
        # tsvectorカラムは自動生成されるため、インデックスの再構築のみ
        async with self._pool.acquire() as conn:
            await conn.execute("REINDEX INDEX idx_questions_search_vector;")
            await conn.execute("REINDEX INDEX idx_questions_trigram;")
```

### 4. データ移行スクリプト

#### 4.1 エクスポートスクリプト

```python
# scripts/export_sqlite_data.py
import sqlite3
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any

async def export_sqlite_data(sqlite_path: str) -> Dict[str, List[Dict[str, Any]]]:
    """SQLiteデータベースからすべてのデータをエクスポート"""
    
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    
    exported_data = {}
    
    # テーブル一覧を取得
    tables = ['users', 'study_books', 'questions', 'typing_logs', 'learning_events']
    
    for table in tables:
        cursor = conn.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        
        exported_data[table] = []
        for row in rows:
            row_dict = dict(row)
            
            # データ型変換
            if table in ['users', 'study_books', 'questions', 'typing_logs']:
                # UUIDの検証と変換
                for uuid_field in ['id', 'user_id', 'study_book_id', 'question_id']:
                    if uuid_field in row_dict and row_dict[uuid_field]:
                        try:
                            # UUID形式の検証
                            uuid.UUID(row_dict[uuid_field])
                        except ValueError:
                            # 無効なUUIDの場合は新しいUUIDを生成
                            row_dict[uuid_field] = str(uuid.uuid4())
                
                # タイムスタンプの変換
                for ts_field in ['created_at', 'updated_at', 'occurred_at']:
                    if ts_field in row_dict and row_dict[ts_field]:
                        # ISO8601形式をPostgreSQL TIMESTAMPTZ形式に変換
                        try:
                            dt = datetime.fromisoformat(row_dict[ts_field].replace('Z', '+00:00'))
                            row_dict[ts_field] = dt.isoformat()
                        except ValueError:
                            # 無効な日時の場合は現在時刻を使用
                            row_dict[ts_field] = datetime.utcnow().isoformat()
            
            exported_data[table].append(row_dict)
    
    conn.close()
    
    # エクスポートデータをJSONファイルに保存
    with open('exported_data.json', 'w', encoding='utf-8') as f:
        json.dump(exported_data, f, ensure_ascii=False, indent=2)
    
    return exported_data

if __name__ == "__main__":
    import asyncio
    asyncio.run(export_sqlite_data("app.db"))
```

#### 4.2 インポートスクリプト

```python
# scripts/import_postgresql_data.py
import asyncpg
import json
from typing import Dict, List, Any
from datetime import datetime

async def import_postgresql_data(
    database_url: str, 
    data_file: str = 'exported_data.json'
) -> None:
    """PostgreSQLデータベースにデータをインポート"""
    
    # データファイルの読み込み
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    pool = await asyncpg.create_pool(database_url)
    
    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                # 外部キー制約を一時的に無効化
                await conn.execute("SET session_replication_role = replica;")
                
                # テーブルの順序（外部キー制約を考慮）
                import_order = ['users', 'study_books', 'questions', 'typing_logs', 'learning_events']
                
                for table in import_order:
                    if table not in data:
                        continue
                    
                    print(f"Importing {table}...")
                    
                    # テーブルをクリア
                    await conn.execute(f"TRUNCATE TABLE {table} CASCADE;")
                    
                    # データをインサート
                    rows = data[table]
                    if not rows:
                        continue
                    
                    # カラム名を取得
                    columns = list(rows[0].keys())
                    placeholders = ', '.join([f'${i+1}' for i in range(len(columns))])
                    
                    insert_sql = f"""
                    INSERT INTO {table} ({', '.join(columns)})
                    VALUES ({placeholders})
                    """
                    
                    # バッチインサート
                    values_list = []
                    for row in rows:
                        values = []
                        for col in columns:
                            value = row[col]
                            
                            # データ型変換
                            if col.endswith('_at') and isinstance(value, str):
                                # タイムスタンプの変換
                                try:
                                    value = datetime.fromisoformat(value)
                                except ValueError:
                                    value = datetime.utcnow()
                            elif col in ['id', 'user_id', 'study_book_id', 'question_id'] and value:
                                # UUIDの変換
                                import uuid
                                try:
                                    value = uuid.UUID(value)
                                except ValueError:
                                    value = uuid.uuid4()
                            
                            values.append(value)
                        
                        values_list.append(values)
                    
                    await conn.executemany(insert_sql, values_list)
                    print(f"Imported {len(values_list)} rows to {table}")
                
                # 外部キー制約を再有効化
                await conn.execute("SET session_replication_role = DEFAULT;")
                
                # シーケンスのリセット（必要に応じて）
                # PostgreSQLのUUID主キーの場合は不要
                
                print("Data import completed successfully!")
                
    finally:
        await pool.close()

if __name__ == "__main__":
    import asyncio
    import os
    
    database_url = os.getenv("POSTGRESQL_URL", "postgresql://user:password@localhost/dbname")
    asyncio.run(import_postgresql_data(database_url))
```

### 5. データ整合性検証

#### 5.1 検証スクリプト

```python
# scripts/verify_migration.py
import asyncpg
import sqlite3
from typing import Dict, Any

async def verify_migration(sqlite_path: str, postgresql_url: str) -> Dict[str, Any]:
    """移行後のデータ整合性を検証"""
    
    verification_results = {
        "tables": {},
        "search_functionality": {},
        "data_integrity": {},
        "performance": {}
    }
    
    # SQLite接続
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    
    # PostgreSQL接続
    pg_pool = await asyncpg.create_pool(postgresql_url)
    
    try:
        async with pg_pool.acquire() as pg_conn:
            
            # 1. レコード数の比較
            tables = ['users', 'study_books', 'questions', 'typing_logs', 'learning_events']
            
            for table in tables:
                # SQLiteのレコード数
                sqlite_count = sqlite_conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                
                # PostgreSQLのレコード数
                pg_count = await pg_conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                
                verification_results["tables"][table] = {
                    "sqlite_count": sqlite_count,
                    "postgresql_count": pg_count,
                    "match": sqlite_count == pg_count
                }
            
            # 2. 検索機能のテスト
            test_queries = ["test", "python", "programming", "学習"]
            
            for query in test_queries:
                # SQLite FTS5検索
                sqlite_results = sqlite_conn.execute("""
                    SELECT COUNT(*) FROM questions_fts WHERE questions_fts MATCH ?
                """, (query,)).fetchone()[0]
                
                # PostgreSQL検索
                pg_results = await pg_conn.fetchval("""
                    SELECT COUNT(*) FROM questions 
                    WHERE search_vector @@ plainto_tsquery('english', $1)
                       OR (question || ' ' || answer) % $1
                """, query)
                
                verification_results["search_functionality"][query] = {
                    "sqlite_results": sqlite_results,
                    "postgresql_results": pg_results,
                    "difference": abs(sqlite_results - pg_results)
                }
            
            # 3. データ整合性チェック
            # 外部キー制約の検証
            fk_violations = await pg_conn.fetch("""
                SELECT 'study_books' as table_name, COUNT(*) as violations
                FROM study_books sb
                LEFT JOIN users u ON sb.user_id = u.id
                WHERE u.id IS NULL
                
                UNION ALL
                
                SELECT 'questions' as table_name, COUNT(*) as violations
                FROM questions q
                LEFT JOIN study_books sb ON q.study_book_id = sb.id
                WHERE sb.id IS NULL
                
                UNION ALL
                
                SELECT 'typing_logs' as table_name, COUNT(*) as violations
                FROM typing_logs tl
                LEFT JOIN users u ON tl.user_id = u.id
                WHERE u.id IS NULL AND tl.user_id IS NOT NULL
            """)
            
            verification_results["data_integrity"]["foreign_key_violations"] = [
                {"table": row["table_name"], "violations": row["violations"]}
                for row in fk_violations
            ]
            
            # 4. パフォーマンステスト
            import time
            
            # PostgreSQL検索パフォーマンス
            start_time = time.time()
            await pg_conn.fetch("""
                SELECT id, question, answer FROM questions 
                WHERE search_vector @@ plainto_tsquery('english', 'test')
                LIMIT 100
            """)
            pg_search_time = time.time() - start_time
            
            verification_results["performance"]["postgresql_search_time"] = pg_search_time
            
    finally:
        sqlite_conn.close()
        await pg_pool.close()
    
    return verification_results

if __name__ == "__main__":
    import asyncio
    import json
    
    results = asyncio.run(verify_migration("app.db", "postgresql://user:password@localhost/dbname"))
    
    with open("migration_verification.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print("Migration verification completed. Results saved to migration_verification.json")
```

### 6. 移行実行手順

#### 6.1 事前準備チェックリスト

- [ ] PostgreSQL 13以上がインストールされている
- [ ] 必要な拡張機能（pg_trgm, unaccent, uuid-ossp）が利用可能
- [ ] データベースユーザーと権限が適切に設定されている
- [ ] バックアップが作成されている
- [ ] 移行スクリプトがテスト環境で検証済み

#### 6.2 移行実行手順

```bash
# 1. PostgreSQL環境の準備
createdb instant_search_production
psql instant_search_production -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql instant_search_production -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
psql instant_search_production -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# 2. スキーマの作成
psql instant_search_production -f scripts/postgresql_schema.sql

# 3. データのエクスポート
python scripts/export_sqlite_data.py

# 4. データのインポート
python scripts/import_postgresql_data.py

# 5. 検索インデックスの最適化
psql instant_search_production -c "ANALYZE questions;"
psql instant_search_production -c "REINDEX INDEX idx_questions_search_vector;"

# 6. 検証の実行
python scripts/verify_migration.py

# 7. アプリケーション設定の更新
# DATABASE_URL=postgresql://user:password@localhost/instant_search_production
```

### 7. ロールバック手順

移行に問題が発生した場合のロールバック手順：

```bash
# 1. アプリケーションの停止
docker-compose down

# 2. SQLite設定に戻す
export DATABASE_URL=sqlite:///./app.db

# 3. アプリケーションの再起動
docker-compose up -d

# 4. データの整合性確認
python scripts/verify_sqlite_data.py
```

### 8. 監視とメンテナンス

#### 8.1 移行後の監視項目

- **パフォーマンス監視**
  - 検索クエリの実行時間
  - データベース接続プールの使用率
  - インデックスの効率性

- **データ整合性監視**
  - 外部キー制約違反の監視
  - データ重複の検出
  - 検索結果の品質

#### 8.2 定期メンテナンス

```sql
-- 週次実行: 統計情報の更新
ANALYZE;

-- 月次実行: インデックスの再構築
REINDEX DATABASE instant_search_production;

-- 検索パフォーマンスの最適化
UPDATE pg_settings SET setting = 'on' WHERE name = 'track_io_timing';
```

## トラブルシューティング

### よくある問題と解決方法

1. **文字エンコーディングの問題**
   ```sql
   -- データベース作成時にUTF-8を指定
   CREATE DATABASE instant_search_production 
   WITH ENCODING 'UTF8' 
   LC_COLLATE='en_US.UTF-8' 
   LC_CTYPE='en_US.UTF-8';
   ```

2. **検索結果の不一致**
   ```sql
   -- 検索設定の確認と調整
   SHOW default_text_search_config;
   SET default_text_search_config = 'pg_catalog.english';
   ```

3. **パフォーマンスの低下**
   ```sql
   -- インデックス使用状況の確認
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'public';
   ```

## 参考資料

- [PostgreSQL Full Text Search Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [pg_trgm Extension Documentation](https://www.postgresql.org/docs/current/pgtrgm.html)
- [SQLite FTS5 Documentation](https://www.sqlite.org/fts5.html)
- [Alembic Migration Documentation](https://alembic.sqlalchemy.org/)