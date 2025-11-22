-- Performance optimization migration
-- Add additional indexes and optimize existing queries

-- Drop existing indexes that might be suboptimal
DROP INDEX IF EXISTS idx_typing_sessions_user_date;
DROP INDEX IF EXISTS idx_typing_sessions_accuracy;

-- Create optimized composite indexes for common query patterns
-- Index for user statistics queries (most frequent)
CREATE INDEX idx_typing_sessions_user_completed_accuracy 
ON typing_sessions(user_id, completed_at, accuracy DESC) 
WHERE completed_at IS NOT NULL;

-- Index for user session history with pagination
CREATE INDEX idx_typing_sessions_user_started_desc 
ON typing_sessions(user_id, started_at DESC);

-- Index for study book performance analysis
CREATE INDEX idx_typing_sessions_studybook_accuracy 
ON typing_sessions(study_book_id, accuracy DESC, started_at DESC) 
WHERE completed_at IS NOT NULL;

-- Index for date range queries with user filter
CREATE INDEX idx_typing_sessions_user_date_range 
ON typing_sessions(user_id, started_at, completed_at) 
WHERE completed_at IS NOT NULL;

-- Optimize study books queries
-- Index for language-based random selection
CREATE INDEX idx_study_books_language_system_random 
ON study_books(language, is_system_problem, id);

-- Index for user's study books with language filter
CREATE INDEX idx_study_books_user_lang_created 
ON study_books(user_id, language, created_at DESC);

-- Partial index for system problems only
CREATE INDEX idx_study_books_system_problems 
ON study_books(language, difficulty_level, created_at DESC) 
WHERE is_system_problem = true;

-- Add covering indexes for frequently accessed columns
-- Covering index for typing statistics
CREATE INDEX idx_typing_sessions_stats_covering 
ON typing_sessions(user_id, completed_at) 
INCLUDE (accuracy, total_characters, duration_ms) 
WHERE completed_at IS NOT NULL;

-- Covering index for study book listings
CREATE INDEX idx_study_books_listing_covering 
ON study_books(user_id, created_at DESC) 
INCLUDE (language, question, explanation, is_system_problem);

-- Create materialized view for user statistics (if supported by database)
-- Note: H2 doesn't support materialized views, so we'll use a regular view with hints
CREATE OR REPLACE VIEW user_typing_statistics AS
SELECT 
    ts.user_id,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN ts.completed_at IS NOT NULL THEN 1 END) as completed_sessions,
    COALESCE(AVG(CASE WHEN ts.completed_at IS NOT NULL THEN ts.accuracy END), 0) as avg_accuracy,
    COALESCE(MAX(CASE WHEN ts.completed_at IS NOT NULL THEN ts.accuracy END), 0) as max_accuracy,
    COALESCE(SUM(CASE WHEN ts.completed_at IS NOT NULL THEN ts.total_characters END), 0) as total_characters,
    COALESCE(SUM(CASE WHEN ts.completed_at IS NOT NULL THEN ts.duration_ms END), 0) as total_duration_ms,
    MIN(ts.started_at) as first_session_date,
    MAX(ts.started_at) as last_session_date
FROM typing_sessions ts
GROUP BY ts.user_id;

-- Create view for study book statistics
CREATE OR REPLACE VIEW study_book_statistics AS
SELECT 
    sb.id as study_book_id,
    sb.language,
    sb.is_system_problem,
    COUNT(ts.id) as total_attempts,
    COUNT(CASE WHEN ts.completed_at IS NOT NULL THEN 1 END) as completed_attempts,
    COALESCE(AVG(CASE WHEN ts.completed_at IS NOT NULL THEN ts.accuracy END), 0) as avg_accuracy,
    COALESCE(MAX(CASE WHEN ts.completed_at IS NOT NULL THEN ts.accuracy END), 0) as max_accuracy,
    MIN(ts.started_at) as first_attempt_date,
    MAX(ts.started_at) as last_attempt_date
FROM study_books sb
LEFT JOIN typing_sessions ts ON sb.id = ts.study_book_id
GROUP BY sb.id, sb.language, sb.is_system_problem;

-- Add database-specific optimizations
-- Update table statistics for better query planning
ANALYZE TABLE users;
ANALYZE TABLE user_login_statistics;
ANALYZE TABLE study_books;
ANALYZE TABLE typing_sessions;

-- Add constraints to help query optimizer
-- These constraints provide additional information to the query planner
ALTER TABLE typing_sessions 
ADD CONSTRAINT chk_accuracy_range 
CHECK (accuracy >= 0 AND accuracy <= 100);

ALTER TABLE typing_sessions 
ADD CONSTRAINT chk_completed_after_started 
CHECK (completed_at IS NULL OR completed_at >= started_at);

-- Create function-based indexes for common calculations
-- Index for accuracy percentage calculations
CREATE INDEX idx_typing_sessions_accuracy_percentage 
ON typing_sessions((CASE WHEN total_characters > 0 THEN (correct_characters * 100.0 / total_characters) ELSE 0 END));

-- Index for session duration in seconds
CREATE INDEX idx_typing_sessions_duration_seconds 
ON typing_sessions((duration_ms / 1000.0)) 
WHERE duration_ms IS NOT NULL;

-- Add hints for query optimization (database-specific)
-- These comments serve as documentation for query optimization strategies

-- For H2 database, ensure proper memory settings:
-- SET DB_CLOSE_DELAY -1;
-- SET CACHE_SIZE 65536;
-- SET OPTIMIZE_REUSE_RESULTS 1;

-- Performance monitoring queries (for testing)
-- These can be used to monitor query performance after optimization

-- Query to check index usage
-- SELECT * FROM INFORMATION_SCHEMA.INDEXES WHERE TABLE_NAME IN ('USERS', 'STUDY_BOOKS', 'TYPING_SESSIONS');

-- Query to check table statistics
-- SELECT * FROM INFORMATION_SCHEMA.TABLE_STATISTICS WHERE TABLE_NAME IN ('USERS', 'STUDY_BOOKS', 'TYPING_SESSIONS');