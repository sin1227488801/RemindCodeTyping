-- Normalize database schema and add performance optimizations
-- This migration creates a normalized schema following clean architecture principles

-- Step 1: Create normalized users table (rename from login_info)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create separate user_login_statistics table
CREATE TABLE user_login_statistics (
    user_id UUID PRIMARY KEY,
    last_login_date DATE,
    consecutive_login_days INTEGER NOT NULL DEFAULT 0,
    max_consecutive_login_days INTEGER NOT NULL DEFAULT 0,
    total_login_days INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_login_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 3: Migrate data from login_info to users and user_login_statistics
INSERT INTO users (id, login_id, password_hash, created_at, updated_at)
SELECT id, login_id, password_hash, created_at, updated_at
FROM login_info;

INSERT INTO user_login_statistics (user_id, last_login_date, consecutive_login_days, max_consecutive_login_days, total_login_days, updated_at)
SELECT id, last_login_date, last_login_days, max_login_days, total_login_days, updated_at
FROM login_info;

-- Step 4: Create improved study_books table (rename from study_book)
CREATE TABLE study_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    language VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT,
    is_system_problem BOOLEAN NOT NULL DEFAULT FALSE,
    difficulty_level INTEGER DEFAULT 1,
    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_study_books_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_study_books_user_or_system CHECK (
        (is_system_problem = TRUE AND user_id IS NULL) OR 
        (is_system_problem = FALSE AND user_id IS NOT NULL)
    ),
    CONSTRAINT chk_difficulty_level CHECK (difficulty_level BETWEEN 1 AND 5)
);

-- Step 5: Migrate data from study_book to study_books
INSERT INTO study_books (id, user_id, language, question, explanation, is_system_problem, created_by, created_at, updated_at)
SELECT id, user_id, language, question, explanation, 
       COALESCE(is_system_problem, FALSE), 
       created_by, 
       created_at, 
       updated_at
FROM study_book;

-- Step 6: Create improved typing_sessions table (rename from typing_log)
CREATE TABLE typing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    study_book_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_ms BIGINT,
    total_characters INTEGER NOT NULL,
    correct_characters INTEGER NOT NULL,
    accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_characters > 0 
        THEN (correct_characters::DECIMAL / total_characters * 100) 
        ELSE 0 END
    ) STORED,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_typing_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_typing_sessions_study_book FOREIGN KEY (study_book_id) REFERENCES study_books(id) ON DELETE CASCADE,
    CONSTRAINT chk_characters_positive CHECK (total_characters >= 0 AND correct_characters >= 0),
    CONSTRAINT chk_correct_not_exceed_total CHECK (correct_characters <= total_characters),
    CONSTRAINT chk_duration_positive CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- Step 7: Migrate data from typing_log to typing_sessions
INSERT INTO typing_sessions (id, user_id, study_book_id, started_at, duration_ms, total_characters, correct_characters, created_at)
SELECT id, user_id, study_book_id, started_at, duration_ms, total_chars, correct_chars, created_at
FROM typing_log;

-- Step 8: Create performance indexes
-- Users table indexes
CREATE INDEX idx_users_login_id ON users(login_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User login statistics indexes
CREATE INDEX idx_user_login_stats_last_login ON user_login_statistics(last_login_date);
CREATE INDEX idx_user_login_stats_consecutive ON user_login_statistics(consecutive_login_days DESC);

-- Study books indexes
CREATE INDEX idx_study_books_user_language ON study_books(user_id, language) WHERE user_id IS NOT NULL;
CREATE INDEX idx_study_books_system_language ON study_books(is_system_problem, language) WHERE is_system_problem = TRUE;
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
CREATE INDEX idx_typing_sessions_completed ON typing_sessions(completed_at) WHERE completed_at IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_typing_sessions_user_book_date ON typing_sessions(user_id, study_book_id, started_at DESC);
CREATE INDEX idx_study_books_user_created ON study_books(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Step 9: Drop old tables (commented out for safety - uncomment after verification)
-- DROP TABLE typing_log;
-- DROP TABLE study_book;
-- DROP TABLE login_info;

-- Step 10: Create views for backward compatibility (temporary)
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

-- Step 11: Add database-level constraints for data integrity
ALTER TABLE users ADD CONSTRAINT chk_login_id_length CHECK (LENGTH(login_id) >= 3 AND LENGTH(login_id) <= 50);
ALTER TABLE users ADD CONSTRAINT chk_password_hash_not_empty CHECK (LENGTH(password_hash) > 0);

ALTER TABLE study_books ADD CONSTRAINT chk_language_not_empty CHECK (LENGTH(TRIM(language)) > 0);
ALTER TABLE study_books ADD CONSTRAINT chk_question_not_empty CHECK (LENGTH(TRIM(question)) > 0);

-- Step 12: Create function for updating timestamps (PostgreSQL specific)
-- This will be used by triggers to automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 13: Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_login_statistics_updated_at 
    BEFORE UPDATE ON user_login_statistics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_books_updated_at 
    BEFORE UPDATE ON study_books 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Add comments for documentation
COMMENT ON TABLE users IS 'Normalized user table with basic authentication information';
COMMENT ON TABLE user_login_statistics IS 'Separate table for user login statistics to follow SRP';
COMMENT ON TABLE study_books IS 'Improved study books table with proper constraints and indexing';
COMMENT ON TABLE typing_sessions IS 'Enhanced typing sessions with calculated accuracy and better constraints';

COMMENT ON COLUMN users.login_id IS 'Unique login identifier for the user';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password';
COMMENT ON COLUMN study_books.is_system_problem IS 'Flag to indicate if this is a system-provided problem';
COMMENT ON COLUMN study_books.difficulty_level IS 'Difficulty level from 1 (easy) to 5 (hard)';
COMMENT ON COLUMN typing_sessions.accuracy IS 'Calculated accuracy percentage (stored generated column)';
COMMENT ON COLUMN typing_sessions.completed_at IS 'Timestamp when the session was completed (null if ongoing)';