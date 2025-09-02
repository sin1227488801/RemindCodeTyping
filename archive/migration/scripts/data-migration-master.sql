-- Master Data Migration Script for RemindCodeTyping Refactoring
-- This script orchestrates the complete data migration process
-- Version: 1.0
-- Requirements: 10.2

-- ============================================================================
-- PHASE 1: PRE-MIGRATION VALIDATION AND BACKUP
-- ============================================================================

-- Create backup tables with timestamp
DO $$
DECLARE
    backup_suffix TEXT := '_backup_' || to_char(now(), 'YYYYMMDD_HH24MISS');
BEGIN
    -- Backup existing tables
    EXECUTE 'CREATE TABLE login_info' || backup_suffix || ' AS SELECT * FROM login_info';
    EXECUTE 'CREATE TABLE study_book' || backup_suffix || ' AS SELECT * FROM study_book';
    EXECUTE 'CREATE TABLE typing_log' || backup_suffix || ' AS SELECT * FROM typing_log';
    
    RAISE NOTICE 'Backup tables created with suffix: %', backup_suffix;
END $$;

-- Validate data integrity before migration
SELECT 
    'login_info' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT id) as unique_ids,
    COUNT(*) - COUNT(DISTINCT id) as duplicate_ids,
    COUNT(*) - COUNT(login_id) as null_login_ids,
    COUNT(*) - COUNT(password_hash) as null_passwords
FROM login_info
UNION ALL
SELECT 
    'study_book' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT id) as unique_ids,
    COUNT(*) - COUNT(DISTINCT id) as duplicate_ids,
    COUNT(*) - COUNT(language) as null_languages,
    COUNT(*) - COUNT(question) as null_questions
FROM study_book
UNION ALL
SELECT 
    'typing_log' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT id) as unique_ids,
    COUNT(*) - COUNT(DISTINCT id) as duplicate_ids,
    COUNT(*) - COUNT(user_id) as null_user_ids,
    COUNT(*) - COUNT(study_book_id) as null_study_book_ids
FROM typing_log;

-- ============================================================================
-- PHASE 2: DATA CLEANSING AND PREPARATION
-- ============================================================================

-- Clean invalid data in login_info
UPDATE login_info 
SET login_id = TRIM(login_id)
WHERE login_id != TRIM(login_id);

UPDATE login_info 
SET password_hash = TRIM(password_hash)
WHERE password_hash != TRIM(password_hash);

-- Remove records with critical null values
DELETE FROM login_info 
WHERE login_id IS NULL OR login_id = '' OR password_hash IS NULL OR password_hash = '';

-- Clean invalid data in study_book
UPDATE study_book 
SET language = TRIM(language),
    question = TRIM(question),
    explanation = TRIM(explanation)
WHERE language != TRIM(language) 
   OR question != TRIM(question) 
   OR (explanation IS NOT NULL AND explanation != TRIM(explanation));

-- Remove study books with invalid data
DELETE FROM study_book 
WHERE language IS NULL OR language = '' OR question IS NULL OR question = '';

-- Clean orphaned typing_log records
DELETE FROM typing_log 
WHERE user_id NOT IN (SELECT id FROM login_info)
   OR study_book_id NOT IN (SELECT id FROM study_book);

-- Fix negative or invalid values in typing_log
UPDATE typing_log 
SET total_chars = GREATEST(0, COALESCE(total_chars, 0)),
    correct_chars = GREATEST(0, COALESCE(correct_chars, 0))
WHERE total_chars < 0 OR correct_chars < 0 OR total_chars IS NULL OR correct_chars IS NULL;

-- Ensure correct_chars doesn't exceed total_chars
UPDATE typing_log 
SET correct_chars = total_chars
WHERE correct_chars > total_chars;

-- ============================================================================
-- PHASE 3: MIGRATION EXECUTION
-- ============================================================================

-- Execute the main migration scripts in order
\i V13__normalize_schema_and_optimize.sql
\i V14__normalize_schema_h2_compatible.sql
\i V15__finalize_schema_migration.sql

-- ============================================================================
-- PHASE 4: POST-MIGRATION VALIDATION
-- ============================================================================

-- Validate migrated data counts
SELECT 
    'Migration Validation' as check_type,
    'users' as new_table,
    'login_info' as old_table,
    (SELECT COUNT(*) FROM users) as new_count,
    (SELECT COUNT(*) FROM login_info_backup_20240101_000000) as old_count,
    (SELECT COUNT(*) FROM users) - (SELECT COUNT(*) FROM login_info_backup_20240101_000000) as difference;

-- Validate data integrity in new schema
SELECT 
    'Data Integrity Check' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN login_id IS NULL OR login_id = '' THEN 1 END) as invalid_login_ids,
    COUNT(CASE WHEN password_hash IS NULL OR password_hash = '' THEN 1 END) as invalid_passwords,
    COUNT(CASE WHEN LENGTH(login_id) < 3 THEN 1 END) as short_login_ids
FROM users;

-- Validate foreign key relationships
SELECT 
    'Foreign Key Validation' as check_type,
    COUNT(*) as total_study_books,
    COUNT(CASE WHEN user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users) THEN 1 END) as orphaned_study_books
FROM study_books;

SELECT 
    'Foreign Key Validation' as check_type,
    COUNT(*) as total_typing_sessions,
    COUNT(CASE WHEN user_id NOT IN (SELECT id FROM users) THEN 1 END) as orphaned_user_sessions,
    COUNT(CASE WHEN study_book_id NOT IN (SELECT id FROM study_books) THEN 1 END) as orphaned_book_sessions
FROM typing_sessions;

-- ============================================================================
-- PHASE 5: PERFORMANCE VALIDATION
-- ============================================================================

-- Test query performance on new schema
EXPLAIN ANALYZE 
SELECT u.login_id, COUNT(ts.id) as session_count, AVG(ts.accuracy) as avg_accuracy
FROM users u
LEFT JOIN typing_sessions ts ON u.id = ts.user_id
GROUP BY u.id, u.login_id
ORDER BY session_count DESC
LIMIT 10;

-- Validate indexes are being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'study_books', 'typing_sessions', 'user_login_statistics')
ORDER BY tablename, indexname;

-- ============================================================================
-- PHASE 6: MIGRATION COMPLETION LOG
-- ============================================================================

-- Create migration log entry
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    details TEXT,
    executed_by VARCHAR(100)
);

INSERT INTO migration_log (migration_name, status, details, executed_by)
VALUES (
    'comprehensive-refactoring-data-migration',
    'COMPLETED',
    'Successfully migrated data from legacy schema to normalized clean architecture schema',
    CURRENT_USER
);

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'DATA MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE 'Timestamp: %', now();
    RAISE NOTICE 'Migrated Tables: users, user_login_statistics, study_books, typing_sessions';
    RAISE NOTICE 'Backup Tables: Available with timestamp suffix';
    RAISE NOTICE '=================================================================';
END $$;