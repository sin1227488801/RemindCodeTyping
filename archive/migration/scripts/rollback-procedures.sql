-- Rollback Procedures for Data Migration
-- This script provides comprehensive rollback capabilities for the migration
-- Requirements: 10.2

-- ============================================================================
-- ROLLBACK STRATEGY OVERVIEW
-- ============================================================================
-- 1. Backup-based rollback: Restore from backup tables
-- 2. Incremental rollback: Undo specific migration steps
-- 3. Emergency rollback: Quick restoration with minimal validation
-- 4. Selective rollback: Rollback specific tables only

-- ============================================================================
-- BACKUP MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create timestamped backups
CREATE OR REPLACE FUNCTION create_migration_backup(backup_suffix TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    suffix TEXT;
    backup_count INTEGER;
BEGIN
    -- Generate suffix if not provided
    IF backup_suffix IS NULL THEN
        suffix := 'backup_' || to_char(now(), 'YYYYMMDD_HH24MISS');
    ELSE
        suffix := backup_suffix;
    END IF;
    
    -- Create backup tables
    EXECUTE format('CREATE TABLE login_info_%s AS SELECT * FROM login_info', suffix);
    EXECUTE format('CREATE TABLE study_book_%s AS SELECT * FROM study_book', suffix);
    EXECUTE format('CREATE TABLE typing_log_%s AS SELECT * FROM typing_log', suffix);
    
    -- Log backup creation
    INSERT INTO migration_log (migration_name, status, details, executed_by)
    VALUES (
        'backup-creation-' || suffix,
        'COMPLETED',
        'Created backup tables with suffix: ' || suffix,
        CURRENT_USER
    );
    
    RETURN suffix;
END;
$$ LANGUAGE plpgsql;

-- Function to list available backups
CREATE OR REPLACE FUNCTION list_migration_backups()
RETURNS TABLE (
    backup_suffix TEXT,
    table_name TEXT,
    record_count BIGINT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUBSTRING(tablename FROM 'login_info_(.+)') as backup_suffix,
        'login_info' as table_name,
        schemaname::BIGINT as record_count,  -- Placeholder, actual count would need dynamic SQL
        NULL::TIMESTAMP as created_at
    FROM pg_tables 
    WHERE tablename LIKE 'login_info_backup_%'
    
    UNION ALL
    
    SELECT 
        SUBSTRING(tablename FROM 'study_book_(.+)') as backup_suffix,
        'study_book' as table_name,
        schemaname::BIGINT as record_count,
        NULL::TIMESTAMP as created_at
    FROM pg_tables 
    WHERE tablename LIKE 'study_book_backup_%'
    
    UNION ALL
    
    SELECT 
        SUBSTRING(tablename FROM 'typing_log_(.+)') as backup_suffix,
        'typing_log' as table_name,
        schemaname::BIGINT as record_count,
        NULL::TIMESTAMP as created_at
    FROM pg_tables 
    WHERE tablename LIKE 'typing_log_backup_%';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETE ROLLBACK PROCEDURES
-- ============================================================================

-- Full rollback to backup state
CREATE OR REPLACE FUNCTION rollback_complete_migration(backup_suffix TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rollback_success BOOLEAN := TRUE;
    error_message TEXT;
BEGIN
    -- Start transaction for atomic rollback
    BEGIN
        -- Validate backup tables exist
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'login_info_' || backup_suffix) THEN
            RAISE EXCEPTION 'Backup table login_info_% does not exist', backup_suffix;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'study_book_' || backup_suffix) THEN
            RAISE EXCEPTION 'Backup table study_book_% does not exist', backup_suffix;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'typing_log_' || backup_suffix) THEN
            RAISE EXCEPTION 'Backup table typing_log_% does not exist', backup_suffix;
        END IF;
        
        -- Drop new tables and constraints
        DROP TABLE IF EXISTS typing_sessions CASCADE;
        DROP TABLE IF EXISTS study_books CASCADE;
        DROP TABLE IF EXISTS user_login_statistics CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        
        -- Drop views if they exist
        DROP VIEW IF EXISTS login_info CASCADE;
        DROP VIEW IF EXISTS study_book CASCADE;
        DROP VIEW IF EXISTS typing_log CASCADE;
        
        -- Restore original tables from backup
        EXECUTE format('CREATE TABLE login_info AS SELECT * FROM login_info_%s', backup_suffix);
        EXECUTE format('CREATE TABLE study_book AS SELECT * FROM study_book_%s', backup_suffix);
        EXECUTE format('CREATE TABLE typing_log AS SELECT * FROM typing_log_%s', backup_suffix);
        
        -- Recreate original constraints and indexes
        ALTER TABLE login_info ADD CONSTRAINT pk_login_info PRIMARY KEY (id);
        ALTER TABLE login_info ADD CONSTRAINT uk_login_info_login_id UNIQUE (login_id);
        
        ALTER TABLE study_book ADD CONSTRAINT pk_study_book PRIMARY KEY (id);
        ALTER TABLE study_book ADD CONSTRAINT fk_study_book_user 
            FOREIGN KEY (user_id) REFERENCES login_info(id) ON DELETE CASCADE;
        
        ALTER TABLE typing_log ADD CONSTRAINT pk_typing_log PRIMARY KEY (id);
        ALTER TABLE typing_log ADD CONSTRAINT fk_typing_log_user 
            FOREIGN KEY (user_id) REFERENCES login_info(id) ON DELETE CASCADE;
        ALTER TABLE typing_log ADD CONSTRAINT fk_typing_log_study_book 
            FOREIGN KEY (study_book_id) REFERENCES study_book(id) ON DELETE CASCADE;
        
        -- Recreate original indexes
        CREATE INDEX idx_login_info_login_id ON login_info(login_id);
        CREATE INDEX idx_study_book_user_id ON study_book(user_id);
        CREATE INDEX idx_study_book_language ON study_book(language);
        CREATE INDEX idx_typing_log_user_id ON typing_log(user_id);
        CREATE INDEX idx_typing_log_created_at ON typing_log(created_at);
        
        -- Log successful rollback
        INSERT INTO migration_log (migration_name, status, details, executed_by)
        VALUES (
            'complete-rollback-' || backup_suffix,
            'COMPLETED',
            'Successfully rolled back complete migration to backup: ' || backup_suffix,
            CURRENT_USER
        );
        
        RAISE NOTICE 'Complete rollback successful. Restored from backup: %', backup_suffix;
        
    EXCEPTION WHEN OTHERS THEN
        rollback_success := FALSE;
        error_message := SQLERRM;
        
        -- Log rollback failure
        INSERT INTO migration_log (migration_name, status, details, executed_by)
        VALUES (
            'complete-rollback-' || backup_suffix,
            'FAILED',
            'Rollback failed: ' || error_message,
            CURRENT_USER
        );
        
        RAISE EXCEPTION 'Rollback failed: %', error_message;
    END;
    
    RETURN rollback_success;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SELECTIVE ROLLBACK PROCEDURES
-- ============================================================================

-- Rollback specific table
CREATE OR REPLACE FUNCTION rollback_table_migration(
    table_name TEXT, 
    backup_suffix TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    rollback_success BOOLEAN := TRUE;
    backup_table_name TEXT;
    new_table_name TEXT;
BEGIN
    -- Determine table names
    backup_table_name := table_name || '_' || backup_suffix;
    
    CASE table_name
        WHEN 'login_info' THEN
            new_table_name := 'users';
        WHEN 'study_book' THEN
            new_table_name := 'study_books';
        WHEN 'typing_log' THEN
            new_table_name := 'typing_sessions';
        ELSE
            RAISE EXCEPTION 'Unknown table name: %', table_name;
    END CASE;
    
    BEGIN
        -- Validate backup exists
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = backup_table_name) THEN
            RAISE EXCEPTION 'Backup table % does not exist', backup_table_name;
        END IF;
        
        -- Drop new table
        EXECUTE format('DROP TABLE IF EXISTS %s CASCADE', new_table_name);
        
        -- Restore original table
        EXECUTE format('CREATE TABLE %s AS SELECT * FROM %s', table_name, backup_table_name);
        
        -- Recreate basic constraints (simplified)
        IF table_name = 'login_info' THEN
            ALTER TABLE login_info ADD CONSTRAINT pk_login_info PRIMARY KEY (id);
            ALTER TABLE login_info ADD CONSTRAINT uk_login_info_login_id UNIQUE (login_id);
        ELSIF table_name = 'study_book' THEN
            ALTER TABLE study_book ADD CONSTRAINT pk_study_book PRIMARY KEY (id);
        ELSIF table_name = 'typing_log' THEN
            ALTER TABLE typing_log ADD CONSTRAINT pk_typing_log PRIMARY KEY (id);
        END IF;
        
        -- Log selective rollback
        INSERT INTO migration_log (migration_name, status, details, executed_by)
        VALUES (
            'selective-rollback-' || table_name,
            'COMPLETED',
            'Successfully rolled back table ' || table_name || ' from backup: ' || backup_suffix,
            CURRENT_USER
        );
        
        RAISE NOTICE 'Selective rollback successful for table: %', table_name;
        
    EXCEPTION WHEN OTHERS THEN
        rollback_success := FALSE;
        
        INSERT INTO migration_log (migration_name, status, details, executed_by)
        VALUES (
            'selective-rollback-' || table_name,
            'FAILED',
            'Selective rollback failed for ' || table_name || ': ' || SQLERRM,
            CURRENT_USER
        );
        
        RAISE EXCEPTION 'Selective rollback failed for %: %', table_name, SQLERRM;
    END;
    
    RETURN rollback_success;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EMERGENCY ROLLBACK PROCEDURES
-- ============================================================================

-- Emergency rollback with minimal validation (fastest option)
CREATE OR REPLACE FUNCTION emergency_rollback(backup_suffix TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rollback_success BOOLEAN := TRUE;
BEGIN
    BEGIN
        -- Quick validation
        IF backup_suffix IS NULL OR backup_suffix = '' THEN
            RAISE EXCEPTION 'Backup suffix is required for emergency rollback';
        END IF;
        
        -- Drop all new structures immediately
        DROP TABLE IF EXISTS typing_sessions CASCADE;
        DROP TABLE IF EXISTS study_books CASCADE;
        DROP TABLE IF EXISTS user_login_statistics CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP VIEW IF EXISTS login_info CASCADE;
        DROP VIEW IF EXISTS study_book CASCADE;
        DROP VIEW IF EXISTS typing_log CASCADE;
        
        -- Restore from backup without constraints (for speed)
        EXECUTE format('CREATE TABLE login_info AS SELECT * FROM login_info_%s', backup_suffix);
        EXECUTE format('CREATE TABLE study_book AS SELECT * FROM study_book_%s', backup_suffix);
        EXECUTE format('CREATE TABLE typing_log AS SELECT * FROM typing_log_%s', backup_suffix);
        
        -- Add only primary keys for basic functionality
        ALTER TABLE login_info ADD CONSTRAINT pk_login_info PRIMARY KEY (id);
        ALTER TABLE study_book ADD CONSTRAINT pk_study_book PRIMARY KEY (id);
        ALTER TABLE typing_log ADD CONSTRAINT pk_typing_log PRIMARY KEY (id);
        
        -- Log emergency rollback
        INSERT INTO migration_log (migration_name, status, details, executed_by)
        VALUES (
            'emergency-rollback-' || backup_suffix,
            'COMPLETED',
            'Emergency rollback completed. Manual constraint recreation may be needed.',
            CURRENT_USER
        );
        
        RAISE NOTICE 'EMERGENCY ROLLBACK COMPLETED - Manual constraint recreation recommended';
        
    EXCEPTION WHEN OTHERS THEN
        rollback_success := FALSE;
        
        INSERT INTO migration_log (migration_name, status, details, executed_by)
        VALUES (
            'emergency-rollback-' || backup_suffix,
            'FAILED',
            'Emergency rollback failed: ' || SQLERRM,
            CURRENT_USER
        );
        
        RAISE EXCEPTION 'Emergency rollback failed: %', SQLERRM;
    END;
    
    RETURN rollback_success;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROLLBACK VALIDATION AND CLEANUP
-- ============================================================================

-- Validate rollback success
CREATE OR REPLACE FUNCTION validate_rollback_success(backup_suffix TEXT)
RETURNS TABLE (
    validation_check TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if original tables exist
    RETURN QUERY
    SELECT 
        'Original Tables Exist'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename IN ('login_info', 'study_book', 'typing_log'))
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Checking if original table structure is restored'::TEXT;
    
    -- Check if new tables are removed
    RETURN QUERY
    SELECT 
        'New Tables Removed'::TEXT,
        CASE WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename IN ('users', 'study_books', 'typing_sessions', 'user_login_statistics'))
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Checking if new migration tables are properly removed'::TEXT;
    
    -- Check data count consistency
    RETURN QUERY
    SELECT 
        'Data Count Consistency'::TEXT,
        CASE WHEN (
            (SELECT COUNT(*) FROM login_info) = 
            (SELECT COUNT(*) FROM (EXECUTE format('SELECT * FROM login_info_%s', backup_suffix)))
        ) THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Comparing record counts between restored and backup tables'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Cleanup backup tables after successful rollback
CREATE OR REPLACE FUNCTION cleanup_migration_backups(backup_suffix TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    cleanup_success BOOLEAN := TRUE;
BEGIN
    BEGIN
        -- Drop backup tables
        EXECUTE format('DROP TABLE IF EXISTS login_info_%s', backup_suffix);
        EXECUTE format('DROP TABLE IF EXISTS study_book_%s', backup_suffix);
        EXECUTE format('DROP TABLE IF EXISTS typing_log_%s', backup_suffix);
        
        -- Log cleanup
        INSERT INTO migration_log (migration_name, status, details, executed_by)
        VALUES (
            'backup-cleanup-' || backup_suffix,
            'COMPLETED',
            'Cleaned up backup tables for suffix: ' || backup_suffix,
            CURRENT_USER
        );
        
        RAISE NOTICE 'Backup cleanup completed for suffix: %', backup_suffix;
        
    EXCEPTION WHEN OTHERS THEN
        cleanup_success := FALSE;
        
        INSERT INTO migration_log (migration_name, status, details, executed_by)
        VALUES (
            'backup-cleanup-' || backup_suffix,
            'FAILED',
            'Backup cleanup failed: ' || SQLERRM,
            CURRENT_USER
        );
        
        RAISE EXCEPTION 'Backup cleanup failed: %', SQLERRM;
    END;
    
    RETURN cleanup_success;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROLLBACK EXECUTION EXAMPLES
-- ============================================================================

/*
-- Example usage:

-- 1. List available backups
SELECT * FROM list_migration_backups();

-- 2. Perform complete rollback
SELECT rollback_complete_migration('backup_20240101_120000');

-- 3. Perform selective rollback (single table)
SELECT rollback_table_migration('login_info', 'backup_20240101_120000');

-- 4. Emergency rollback (fastest, minimal validation)
SELECT emergency_rollback('backup_20240101_120000');

-- 5. Validate rollback success
SELECT * FROM validate_rollback_success('backup_20240101_120000');

-- 6. Cleanup backups after successful rollback
SELECT cleanup_migration_backups('backup_20240101_120000');
*/