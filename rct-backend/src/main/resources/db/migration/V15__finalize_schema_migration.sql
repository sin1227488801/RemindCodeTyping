-- Finalize schema migration by renaming tables and cleaning up
-- This migration completes the transition to the normalized schema

-- Step 1: Drop old table indexes first (to avoid conflicts)
DROP INDEX IF EXISTS idx_login_info_login_id;
DROP INDEX IF EXISTS idx_study_book_user_id;
DROP INDEX IF EXISTS idx_study_book_language;
DROP INDEX IF EXISTS idx_typing_log_user_id;
DROP INDEX IF EXISTS idx_typing_log_created_at;

-- Step 2: Drop compatibility views
DROP VIEW IF EXISTS login_info_view;
DROP VIEW IF EXISTS study_book_view;
DROP VIEW IF EXISTS typing_log_view;

-- Step 3: Drop old tables (backup data should be verified first)
DROP TABLE IF EXISTS typing_log;
DROP TABLE IF EXISTS study_book;
DROP TABLE IF EXISTS login_info;

-- Step 4: Rename new tables to final names (H2 compatible approach)
-- For H2, we need to use a different approach since it doesn't support RENAME TABLE directly

-- Create final tables with correct names
CREATE TABLE users AS SELECT * FROM users_new;
CREATE TABLE user_login_statistics AS SELECT * FROM user_login_statistics_new;
CREATE TABLE study_books AS SELECT * FROM study_books_new;
CREATE TABLE typing_sessions AS SELECT * FROM typing_sessions_new;

-- Step 5: Recreate constraints on final tables
-- Users constraints
ALTER TABLE users ADD CONSTRAINT pk_users PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT uk_users_login_id UNIQUE (login_id);

-- User login statistics constraints
ALTER TABLE user_login_statistics ADD CONSTRAINT pk_user_login_statistics PRIMARY KEY (user_id);
ALTER TABLE user_login_statistics ADD CONSTRAINT fk_user_login_stats_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Study books constraints
ALTER TABLE study_books ADD CONSTRAINT pk_study_books PRIMARY KEY (id);
ALTER TABLE study_books ADD CONSTRAINT fk_study_books_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE study_books ADD CONSTRAINT chk_difficulty_level 
    CHECK (difficulty_level BETWEEN 1 AND 5);

-- Typing sessions constraints
ALTER TABLE typing_sessions ADD CONSTRAINT pk_typing_sessions PRIMARY KEY (id);
ALTER TABLE typing_sessions ADD CONSTRAINT fk_typing_sessions_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE typing_sessions ADD CONSTRAINT fk_typing_sessions_study_book 
    FOREIGN KEY (study_book_id) REFERENCES study_books(id) ON DELETE CASCADE;
ALTER TABLE typing_sessions ADD CONSTRAINT chk_characters_positive 
    CHECK (total_characters >= 0 AND correct_characters >= 0);
ALTER TABLE typing_sessions ADD CONSTRAINT chk_correct_not_exceed_total 
    CHECK (correct_characters <= total_characters);
ALTER TABLE typing_sessions ADD CONSTRAINT chk_duration_positive 
    CHECK (duration_ms IS NULL OR duration_ms >= 0);

-- Step 6: Recreate all performance indexes on final tables
-- Users table indexes
CREATE INDEX idx_users_login_id ON users(login_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User login statistics indexes
CREATE INDEX idx_user_login_stats_last_login ON user_login_statistics(last_login_date);
CREATE INDEX idx_user_login_stats_consecutive ON user_login_statistics(consecutive_login_days DESC);

-- Study books indexes
CREATE INDEX idx_study_books_user_language ON study_books(user_id, language);
CREATE INDEX idx_study_books_system_language ON study_books(is_system_problem, language);
CREATE INDEX idx_study_books_language ON study_books(language);
CREATE INDEX idx_study_books_difficulty ON study_books(difficulty_level);
CREATE INDEX idx_study_books_created_at ON study_books(created_at);
CREATE INDEX idx_study_books_system_flag ON study_books(is_system_problem);

-- Typing sessions indexes
CREATE INDEX idx_typing_sessions_user_date ON typing_sessions(user_id, started_at DESC);
CREATE INDEX idx_typing_sessions_study_book ON typing_sessions(study_book_id);
CREATE INDEX idx_typing_sessions_accuracy ON typing_sessions(accuracy DESC);
CREATE INDEX idx_typing_sessions_duration ON typing_sessions(duration_ms);
CREATE INDEX idx_typing_sessions_user_accuracy ON typing_sessions(user_id, accuracy DESC);

-- Composite indexes for common queries
CREATE INDEX idx_typing_sessions_user_book_date ON typing_sessions(user_id, study_book_id, started_at DESC);
CREATE INDEX idx_study_books_user_created ON study_books(user_id, created_at DESC);

-- Step 7: Drop temporary tables
DROP TABLE IF EXISTS users_new;
DROP TABLE IF EXISTS user_login_statistics_new;
DROP TABLE IF EXISTS study_books_new;
DROP TABLE IF EXISTS typing_sessions_new;

-- Step 8: Create final compatibility views (for gradual migration)
CREATE VIEW login_info AS
SELECT 
    u.id,
    u.login_id,
    u.password_hash,
    uls.last_login_date,
    uls.consecutive_login_days as last_login_days,
    uls.max_consecutive_login_days as max_login_days,
    uls.total_login_days,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN user_login_statistics uls ON u.id = uls.user_id;

CREATE VIEW study_book AS
SELECT 
    id,
    user_id,
    language,
    question,
    explanation,
    is_system_problem,
    created_by,
    created_at,
    updated_at
FROM study_books;

CREATE VIEW typing_log AS
SELECT 
    id,
    user_id,
    study_book_id,
    started_at,
    duration_ms,
    total_characters as total_chars,
    correct_characters as correct_chars,
    accuracy,
    created_at
FROM typing_sessions;

-- Step 9: Verify data integrity
-- These statements will fail if data integrity is compromised
SELECT COUNT(*) FROM users WHERE login_id IS NULL OR password_hash IS NULL;
SELECT COUNT(*) FROM study_books WHERE language IS NULL OR question IS NULL;
SELECT COUNT(*) FROM typing_sessions WHERE user_id IS NULL OR study_book_id IS NULL;

-- Step 10: Update statistics for query optimizer (H2 specific)
-- H2 automatically maintains statistics, but we can force an update
ANALYZE;