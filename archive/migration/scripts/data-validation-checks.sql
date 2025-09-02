-- Data Validation and Integrity Checks for Migration
-- This script provides comprehensive validation checks for the data migration
-- Requirements: 10.2

-- ============================================================================
-- PRE-MIGRATION VALIDATION CHECKS
-- ============================================================================

-- Check 1: Validate source data quality
CREATE OR REPLACE FUNCTION validate_source_data()
RETURNS TABLE (
    table_name TEXT,
    check_name TEXT,
    status TEXT,
    count_value BIGINT,
    details TEXT
) AS $$
BEGIN
    -- Login info validation
    RETURN QUERY
    SELECT 
        'login_info'::TEXT,
        'total_records'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Total records in login_info table'::TEXT
    FROM login_info;
    
    RETURN QUERY
    SELECT 
        'login_info'::TEXT,
        'null_login_ids'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Records with null or empty login_id'::TEXT
    FROM login_info 
    WHERE login_id IS NULL OR login_id = '';
    
    RETURN QUERY
    SELECT 
        'login_info'::TEXT,
        'null_passwords'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Records with null or empty password_hash'::TEXT
    FROM login_info 
    WHERE password_hash IS NULL OR password_hash = '';
    
    RETURN QUERY
    SELECT 
        'login_info'::TEXT,
        'duplicate_login_ids'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Duplicate login_id values'::TEXT
    FROM (
        SELECT login_id, COUNT(*) as cnt
        FROM login_info 
        GROUP BY login_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Study book validation
    RETURN QUERY
    SELECT 
        'study_book'::TEXT,
        'total_records'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Total records in study_book table'::TEXT
    FROM study_book;
    
    RETURN QUERY
    SELECT 
        'study_book'::TEXT,
        'invalid_languages'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Records with null or empty language'::TEXT
    FROM study_book 
    WHERE language IS NULL OR language = '';
    
    RETURN QUERY
    SELECT 
        'study_book'::TEXT,
        'invalid_questions'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Records with null or empty question'::TEXT
    FROM study_book 
    WHERE question IS NULL OR question = '';
    
    RETURN QUERY
    SELECT 
        'study_book'::TEXT,
        'orphaned_user_books'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        COUNT(*)::BIGINT,
        'Study books with non-existent user_id'::TEXT
    FROM study_book sb
    WHERE sb.user_id IS NOT NULL 
      AND sb.user_id NOT IN (SELECT id FROM login_info);
    
    -- Typing log validation
    RETURN QUERY
    SELECT 
        'typing_log'::TEXT,
        'total_records'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Total records in typing_log table'::TEXT
    FROM typing_log;
    
    RETURN QUERY
    SELECT 
        'typing_log'::TEXT,
        'orphaned_user_logs'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Typing logs with non-existent user_id'::TEXT
    FROM typing_log tl
    WHERE tl.user_id NOT IN (SELECT id FROM login_info);
    
    RETURN QUERY
    SELECT 
        'typing_log'::TEXT,
        'orphaned_book_logs'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Typing logs with non-existent study_book_id'::TEXT
    FROM typing_log tl
    WHERE tl.study_book_id NOT IN (SELECT id FROM study_book);
    
    RETURN QUERY
    SELECT 
        'typing_log'::TEXT,
        'invalid_character_counts'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        COUNT(*)::BIGINT,
        'Records where correct_chars > total_chars'::TEXT
    FROM typing_log 
    WHERE correct_chars > total_chars;
    
    RETURN QUERY
    SELECT 
        'typing_log'::TEXT,
        'negative_values'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        COUNT(*)::BIGINT,
        'Records with negative character counts'::TEXT
    FROM typing_log 
    WHERE total_chars < 0 OR correct_chars < 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- POST-MIGRATION VALIDATION CHECKS
-- ============================================================================

-- Check 2: Validate migrated data integrity
CREATE OR REPLACE FUNCTION validate_migrated_data()
RETURNS TABLE (
    table_name TEXT,
    check_name TEXT,
    status TEXT,
    count_value BIGINT,
    details TEXT
) AS $$
BEGIN
    -- Users table validation
    RETURN QUERY
    SELECT 
        'users'::TEXT,
        'total_records'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Total records in users table'::TEXT
    FROM users;
    
    RETURN QUERY
    SELECT 
        'users'::TEXT,
        'data_integrity'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Records with null or invalid data'::TEXT
    FROM users 
    WHERE login_id IS NULL OR login_id = '' 
       OR password_hash IS NULL OR password_hash = ''
       OR LENGTH(login_id) < 3;
    
    -- User login statistics validation
    RETURN QUERY
    SELECT 
        'user_login_statistics'::TEXT,
        'total_records'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Total records in user_login_statistics table'::TEXT
    FROM user_login_statistics;
    
    RETURN QUERY
    SELECT 
        'user_login_statistics'::TEXT,
        'orphaned_statistics'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Statistics records with non-existent user_id'::TEXT
    FROM user_login_statistics uls
    WHERE uls.user_id NOT IN (SELECT id FROM users);
    
    -- Study books validation
    RETURN QUERY
    SELECT 
        'study_books'::TEXT,
        'total_records'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Total records in study_books table'::TEXT
    FROM study_books;
    
    RETURN QUERY
    SELECT 
        'study_books'::TEXT,
        'data_integrity'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Records with null or invalid data'::TEXT
    FROM study_books 
    WHERE language IS NULL OR language = '' 
       OR question IS NULL OR question = '';
    
    RETURN QUERY
    SELECT 
        'study_books'::TEXT,
        'orphaned_books'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Study books with non-existent user_id'::TEXT
    FROM study_books sb
    WHERE sb.user_id IS NOT NULL 
      AND sb.user_id NOT IN (SELECT id FROM users);
    
    -- Typing sessions validation
    RETURN QUERY
    SELECT 
        'typing_sessions'::TEXT,
        'total_records'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Total records in typing_sessions table'::TEXT
    FROM typing_sessions;
    
    RETURN QUERY
    SELECT 
        'typing_sessions'::TEXT,
        'orphaned_user_sessions'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Sessions with non-existent user_id'::TEXT
    FROM typing_sessions ts
    WHERE ts.user_id NOT IN (SELECT id FROM users);
    
    RETURN QUERY
    SELECT 
        'typing_sessions'::TEXT,
        'orphaned_book_sessions'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COUNT(*)::BIGINT,
        'Sessions with non-existent study_book_id'::TEXT
    FROM typing_sessions ts
    WHERE ts.study_book_id NOT IN (SELECT id FROM study_books);
    
    RETURN QUERY
    SELECT 
        'typing_sessions'::TEXT,
        'accuracy_calculation'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        COUNT(*)::BIGINT,
        'Sessions with incorrect accuracy calculation'::TEXT
    FROM typing_sessions 
    WHERE total_characters > 0 
      AND ABS(accuracy - (correct_characters::DECIMAL / total_characters * 100)) > 0.01;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATA COMPARISON CHECKS
-- ============================================================================

-- Check 3: Compare record counts between old and new tables
CREATE OR REPLACE FUNCTION compare_migration_counts()
RETURNS TABLE (
    comparison_type TEXT,
    old_table TEXT,
    new_table TEXT,
    old_count BIGINT,
    new_count BIGINT,
    difference BIGINT,
    status TEXT
) AS $$
BEGIN
    -- Compare users vs login_info
    RETURN QUERY
    SELECT 
        'User Migration'::TEXT,
        'login_info'::TEXT,
        'users'::TEXT,
        (SELECT COUNT(*) FROM login_info)::BIGINT,
        (SELECT COUNT(*) FROM users)::BIGINT,
        (SELECT COUNT(*) FROM users) - (SELECT COUNT(*) FROM login_info)::BIGINT,
        CASE 
            WHEN (SELECT COUNT(*) FROM users) >= (SELECT COUNT(*) FROM login_info) THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT;
    
    -- Compare study_books vs study_book
    RETURN QUERY
    SELECT 
        'StudyBook Migration'::TEXT,
        'study_book'::TEXT,
        'study_books'::TEXT,
        (SELECT COUNT(*) FROM study_book)::BIGINT,
        (SELECT COUNT(*) FROM study_books)::BIGINT,
        (SELECT COUNT(*) FROM study_books) - (SELECT COUNT(*) FROM study_book)::BIGINT,
        CASE 
            WHEN (SELECT COUNT(*) FROM study_books) >= (SELECT COUNT(*) FROM study_book) THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT;
    
    -- Compare typing_sessions vs typing_log
    RETURN QUERY
    SELECT 
        'TypingSession Migration'::TEXT,
        'typing_log'::TEXT,
        'typing_sessions'::TEXT,
        (SELECT COUNT(*) FROM typing_log)::BIGINT,
        (SELECT COUNT(*) FROM typing_sessions)::BIGINT,
        (SELECT COUNT(*) FROM typing_sessions) - (SELECT COUNT(*) FROM typing_log)::BIGINT,
        CASE 
            WHEN (SELECT COUNT(*) FROM typing_sessions) >= (SELECT COUNT(*) FROM typing_log) THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE VALIDATION CHECKS
-- ============================================================================

-- Check 4: Validate index usage and performance
CREATE OR REPLACE FUNCTION validate_migration_performance()
RETURNS TABLE (
    check_type TEXT,
    table_name TEXT,
    index_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if required indexes exist
    RETURN QUERY
    SELECT 
        'Index Existence'::TEXT,
        'users'::TEXT,
        'idx_users_login_id'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'users' AND indexname = 'idx_users_login_id'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Critical index for user lookup'::TEXT;
    
    RETURN QUERY
    SELECT 
        'Index Existence'::TEXT,
        'study_books'::TEXT,
        'idx_study_books_user_language'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'study_books' AND indexname = 'idx_study_books_user_language'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Critical index for study book queries'::TEXT;
    
    RETURN QUERY
    SELECT 
        'Index Existence'::TEXT,
        'typing_sessions'::TEXT,
        'idx_typing_sessions_user_date'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'typing_sessions' AND indexname = 'idx_typing_sessions_user_date'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Critical index for session queries'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPREHENSIVE VALIDATION REPORT
-- ============================================================================

-- Generate complete validation report
CREATE OR REPLACE FUNCTION generate_migration_validation_report()
RETURNS VOID AS $$
DECLARE
    report_timestamp TIMESTAMP := now();
BEGIN
    -- Create temporary report table
    DROP TABLE IF EXISTS migration_validation_report;
    CREATE TEMP TABLE migration_validation_report (
        report_section TEXT,
        table_name TEXT,
        check_name TEXT,
        status TEXT,
        count_value BIGINT,
        details TEXT,
        checked_at TIMESTAMP DEFAULT now()
    );
    
    -- Insert pre-migration validation results
    INSERT INTO migration_validation_report (report_section, table_name, check_name, status, count_value, details)
    SELECT 'PRE_MIGRATION', table_name, check_name, status, count_value, details
    FROM validate_source_data();
    
    -- Insert post-migration validation results
    INSERT INTO migration_validation_report (report_section, table_name, check_name, status, count_value, details)
    SELECT 'POST_MIGRATION', table_name, check_name, status, count_value, details
    FROM validate_migrated_data();
    
    -- Insert comparison results
    INSERT INTO migration_validation_report (report_section, table_name, check_name, status, count_value, details)
    SELECT 'COMPARISON', old_table || ' -> ' || new_table, comparison_type, status, difference, 
           'Old: ' || old_count || ', New: ' || new_count
    FROM compare_migration_counts();
    
    -- Insert performance validation results
    INSERT INTO migration_validation_report (report_section, table_name, check_name, status, count_value, details)
    SELECT 'PERFORMANCE', table_name, check_type || ': ' || index_name, status, 0, details
    FROM validate_migration_performance();
    
    -- Display summary report
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'MIGRATION VALIDATION REPORT - %', report_timestamp;
    RAISE NOTICE '=================================================================';
    
    -- Show failed checks
    RAISE NOTICE 'FAILED CHECKS:';
    FOR rec IN 
        SELECT report_section, table_name, check_name, details
        FROM migration_validation_report 
        WHERE status = 'FAIL'
        ORDER BY report_section, table_name
    LOOP
        RAISE NOTICE '  [%] %: % - %', rec.report_section, rec.table_name, rec.check_name, rec.details;
    END LOOP;
    
    -- Show warning checks
    RAISE NOTICE 'WARNING CHECKS:';
    FOR rec IN 
        SELECT report_section, table_name, check_name, details
        FROM migration_validation_report 
        WHERE status = 'WARN'
        ORDER BY report_section, table_name
    LOOP
        RAISE NOTICE '  [%] %: % - %', rec.report_section, rec.table_name, rec.check_name, rec.details;
    END LOOP;
    
    -- Show summary statistics
    RAISE NOTICE 'SUMMARY:';
    FOR rec IN 
        SELECT status, COUNT(*) as count
        FROM migration_validation_report 
        GROUP BY status
        ORDER BY status
    LOOP
        RAISE NOTICE '  % checks: %', rec.status, rec.count;
    END LOOP;
    
    RAISE NOTICE '=================================================================';
END;
$$ LANGUAGE plpgsql;