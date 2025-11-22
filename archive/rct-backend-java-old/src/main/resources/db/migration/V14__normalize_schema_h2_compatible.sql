-- H2-compatible version of schema normalization and optimization
-- This migration provides H2 database compatibility for development/testing

-- Step 1: Create normalized users table (H2 compatible)
CREATE TABLE IF NOT EXISTS users_new (
    id UUID PRIMARY KEY DEFAULT RANDOM_UUID(),
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create separate user_login_statistics table (H2 compatible)
CREATE TABLE IF NOT EXISTS user_login_statistics_new (
    user_id UUID PRIMARY KEY,
    last_login_date DATE,
    consecutive_login_days INTEGER NOT NULL DEFAULT 0,
    max_consecutive_login_days INTEGER NOT NULL DEFAULT 0,
    total_login_days INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_login_stats_user_new FOREIGN KEY (user_id) REFERENCES users_new(id) ON DELETE CASCADE
);

-- Step 3: Create improved study_books table (H2 compatible)
CREATE TABLE IF NOT EXISTS study_books_new (
    id UUID PRIMARY KEY DEFAULT RANDOM_UUID(),
    user_id UUID,
    language VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT,
    is_system_problem BOOLEAN NOT NULL DEFAULT FALSE,
    difficulty_level INTEGER DEFAULT 1,
    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_study_books_user_new FOREIGN KEY (user_id) REFERENCES users_new(id) ON DELETE CASCADE,
    CONSTRAINT chk_difficulty_level_new CHECK (difficulty_level BETWEEN 1 AND 5)
);

-- Step 4: Create improved typing_sessions table (H2 compatible - without generated columns)
CREATE TABLE IF NOT EXISTS typing_sessions_new (
    id UUID PRIMARY KEY DEFAULT RANDOM_UUID(),
    user_id UUID NOT NULL,
    study_book_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_ms BIGINT,
    total_characters INTEGER NOT NULL,
    correct_characters INTEGER NOT NULL,
    accuracy DECIMAL(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_typing_sessions_user_new FOREIGN KEY (user_id) REFERENCES users_new(id) ON DELETE CASCADE,
    CONSTRAINT fk_typing_sessions_study_book_new FOREIGN KEY (study_book_id) REFERENCES study_books_new(id) ON DELETE CASCADE,
    CONSTRAINT chk_characters_positive_new CHECK (total_characters >= 0 AND correct_characters >= 0),
    CONSTRAINT chk_correct_not_exceed_total_new CHECK (correct_characters <= total_characters),
    CONSTRAINT chk_duration_positive_new CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- Step 5: Migrate data only if old tables exist and new tables are empty
-- Users migration
INSERT INTO users_new (id, login_id, password_hash, created_at, updated_at)
SELECT id, login_id, password_hash, created_at, updated_at
FROM login_info
WHERE NOT EXISTS (SELECT 1 FROM users_new);

-- User login statistics migration
INSERT INTO user_login_statistics_new (user_id, last_login_date, consecutive_login_days, max_consecutive_login_days, total_login_days, updated_at)
SELECT id, last_login_date, last_login_days, max_login_days, total_login_days, updated_at
FROM login_info
WHERE NOT EXISTS (SELECT 1 FROM user_login_statistics_new);

-- Study books migration
INSERT INTO study_books_new (id, user_id, language, question, explanation, is_system_problem, created_by, created_at, updated_at)
SELECT id, user_id, language, question, explanation, 
       COALESCE(is_system_problem, FALSE), 
       created_by, 
       created_at, 
       updated_at
FROM study_book
WHERE NOT EXISTS (SELECT 1 FROM study_books_new);

-- Typing sessions migration with calculated accuracy
INSERT INTO typing_sessions_new (id, user_id, study_book_id, started_at, duration_ms, total_characters, correct_characters, accuracy, created_at)
SELECT id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars,
       CASE WHEN total_chars > 0 THEN (correct_chars::DECIMAL / total_chars * 100) ELSE 0 END,
       created_at
FROM typing_log
WHERE NOT EXISTS (SELECT 1 FROM typing_sessions_new);

-- Step 6: Create performance indexes for H2
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_new_login_id ON users_new(login_id);
CREATE INDEX IF NOT EXISTS idx_users_new_created_at ON users_new(created_at);

-- User login statistics indexes
CREATE INDEX IF NOT EXISTS idx_user_login_stats_new_last_login ON user_login_statistics_new(last_login_date);
CREATE INDEX IF NOT EXISTS idx_user_login_stats_new_consecutive ON user_login_statistics_new(consecutive_login_days DESC);

-- Study books indexes
CREATE INDEX IF NOT EXISTS idx_study_books_new_user_language ON study_books_new(user_id, language);
CREATE INDEX IF NOT EXISTS idx_study_books_new_system_language ON study_books_new(is_system_problem, language);
CREATE INDEX IF NOT EXISTS idx_study_books_new_language ON study_books_new(language);
CREATE INDEX IF NOT EXISTS idx_study_books_new_difficulty ON study_books_new(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_study_books_new_created_at ON study_books_new(created_at);
CREATE INDEX IF NOT EXISTS idx_study_books_new_system_flag ON study_books_new(is_system_problem);

-- Typing sessions indexes
CREATE INDEX IF NOT EXISTS idx_typing_sessions_new_user_date ON typing_sessions_new(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_new_study_book ON typing_sessions_new(study_book_id);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_new_accuracy ON typing_sessions_new(accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_new_duration ON typing_sessions_new(duration_ms);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_new_user_accuracy ON typing_sessions_new(user_id, accuracy DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_typing_sessions_new_user_book_date ON typing_sessions_new(user_id, study_book_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_books_new_user_created ON study_books_new(user_id, created_at DESC);

-- Step 7: Create trigger function for H2 (using Java trigger)
-- Note: H2 doesn't support PL/SQL, so we'll handle timestamp updates in the application layer

-- Step 8: Add database-level constraints for data integrity (H2 compatible)
-- Note: H2 has limited CHECK constraint support, so some constraints are simplified

-- Step 9: Create views for backward compatibility (will be used during transition)
CREATE OR REPLACE VIEW login_info_view AS
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
FROM users_new u
LEFT JOIN user_login_statistics_new uls ON u.id = uls.user_id;

CREATE OR REPLACE VIEW study_book_view AS
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
FROM study_books_new;

CREATE OR REPLACE VIEW typing_log_view AS
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
FROM typing_sessions_new;

-- Step 10: Update accuracy for existing records (H2 compatible)
UPDATE typing_sessions_new 
SET accuracy = CASE 
    WHEN total_characters > 0 THEN (correct_characters * 100.0 / total_characters) 
    ELSE 0 
END
WHERE accuracy IS NULL;