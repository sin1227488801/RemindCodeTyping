#!/bin/bash

# Database Migration Script for RemindCodeTyping
# This script handles database migrations with rollback capabilities

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
ACTION=${2:-migrate}  # migrate, rollback, status, validate
TARGET_VERSION=${3:-latest}
DRY_RUN=${4:-false}

# Database configuration
case $ENVIRONMENT in
    "staging")
        DB_HOST=${STAGING_DB_HOST:-localhost}
        DB_PORT=${STAGING_DB_PORT:-5432}
        DB_NAME=${STAGING_DB_NAME:-rct_staging}
        DB_USER=${STAGING_DB_USER:-rct_user}
        DB_PASSWORD=${STAGING_DB_PASSWORD}
        ;;
    "production")
        DB_HOST=${PRODUCTION_DB_HOST}
        DB_PORT=${PRODUCTION_DB_PORT:-5432}
        DB_NAME=${PRODUCTION_DB_NAME:-rct_production}
        DB_USER=${PRODUCTION_DB_USER:-rct_user}
        DB_PASSWORD=${PRODUCTION_DB_PASSWORD}
        ;;
    "local")
        DB_HOST=${LOCAL_DB_HOST:-localhost}
        DB_PORT=${LOCAL_DB_PORT:-5432}
        DB_NAME=${LOCAL_DB_NAME:-rct_db}
        DB_USER=${LOCAL_DB_USER:-rct_user}
        DB_PASSWORD=${LOCAL_DB_PASSWORD:-rct_password}
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo "Valid environments: staging, production, local"
        exit 1
        ;;
esac

echo -e "${BLUE}🗄️  Database Migration Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Action: ${ACTION}${NC}"
echo -e "${BLUE}Target Version: ${TARGET_VERSION}${NC}"
echo -e "${BLUE}Dry Run: ${DRY_RUN}${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Function to handle errors
handle_error() {
    echo -e "\n${RED}❌ Migration failed at: $1${NC}"
    
    # Attempt to rollback if this was a migration
    if [ "$ACTION" = "migrate" ] && [ "$DRY_RUN" != "true" ]; then
        echo -e "${RED}Attempting automatic rollback...${NC}"
        rollback_migration
    fi
    
    exit 1
}

# Function to check prerequisites
check_prerequisites() {
    print_section "📋 Checking Prerequisites"
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        handle_error "PostgreSQL client (psql) is not installed"
    fi
    echo -e "${GREEN}✅ PostgreSQL client available${NC}"
    
    # Check if Flyway is available (if using Flyway)
    if command -v flyway &> /dev/null; then
        echo -e "${GREEN}✅ Flyway available${NC}"
        MIGRATION_TOOL="flyway"
    else
        echo -e "${YELLOW}⚠️  Flyway not available, using native SQL migrations${NC}"
        MIGRATION_TOOL="native"
    fi
    
    # Check database connectivity
    echo -e "${YELLOW}Testing database connectivity...${NC}"
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &>/dev/null; then
        handle_error "Cannot connect to database"
    fi
    echo -e "${GREEN}✅ Database connection successful${NC}"
    
    # Check if migration directory exists
    if [ ! -d "../../rct-backend/src/main/resources/db/migration" ]; then
        handle_error "Migration directory not found"
    fi
    echo -e "${GREEN}✅ Migration directory found${NC}"
}

# Function to get current database version
get_current_version() {
    local current_version
    
    if [ "$MIGRATION_TOOL" = "flyway" ]; then
        current_version=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;" 2>/dev/null | xargs || echo "0")
    else
        # Check if schema_version table exists
        local table_exists=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schema_version');" 2>/dev/null | xargs)
        
        if [ "$table_exists" = "t" ]; then
            current_version=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1;" 2>/dev/null | xargs || echo "0")
        else
            current_version="0"
        fi
    fi
    
    echo $current_version
}

# Function to get available migrations
get_available_migrations() {
    local migrations=()
    
    for file in ../../rct-backend/src/main/resources/db/migration/V*.sql; do
        if [ -f "$file" ]; then
            local version=$(basename "$file" | sed 's/V\([0-9]*\)__.*/\1/')
            migrations+=($version)
        fi
    done
    
    printf '%s\n' "${migrations[@]}" | sort -n
}

# Function to create schema version table (for native migrations)
create_schema_version_table() {
    if [ "$MIGRATION_TOOL" = "native" ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                description TEXT NOT NULL,
                script_name TEXT NOT NULL,
                checksum TEXT NOT NULL,
                applied_by TEXT NOT NULL DEFAULT CURRENT_USER,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN NOT NULL DEFAULT TRUE
            );
        " || handle_error "Failed to create schema version table"
    fi
}

# Function to backup database
backup_database() {
    print_section "💾 Creating Database Backup"
    
    local backup_file="backup_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).sql"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would create backup: $backup_file${NC}"
        return
    fi
    
    echo -e "${YELLOW}Creating backup: $backup_file${NC}"
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "$backup_file" || handle_error "Database backup failed"
    
    echo -e "${GREEN}✅ Backup created: $backup_file${NC}"
    echo "$backup_file" > .last_backup
}

# Function to validate migrations
validate_migrations() {
    print_section "🔍 Validating Migrations"
    
    local current_version=$(get_current_version)
    local available_migrations=($(get_available_migrations))
    
    echo -e "${BLUE}Current database version: $current_version${NC}"
    echo -e "${BLUE}Available migrations: ${available_migrations[*]}${NC}"
    
    # Check for missing migrations
    for version in "${available_migrations[@]}"; do
        if [ "$version" -le "$current_version" ]; then
            local migration_file="../../rct-backend/src/main/resources/db/migration/V${version}__*.sql"
            if [ ! -f $migration_file ]; then
                echo -e "${RED}❌ Missing migration file for version $version${NC}"
                return 1
            fi
        fi
    done
    
    echo -e "${GREEN}✅ Migration validation passed${NC}"
}

# Function to run migrations
run_migrations() {
    print_section "🚀 Running Database Migrations"
    
    local current_version=$(get_current_version)
    local available_migrations=($(get_available_migrations))
    local target_version_num
    
    if [ "$TARGET_VERSION" = "latest" ]; then
        target_version_num=${available_migrations[-1]}
    else
        target_version_num=$TARGET_VERSION
    fi
    
    echo -e "${BLUE}Current version: $current_version${NC}"
    echo -e "${BLUE}Target version: $target_version_num${NC}"
    
    if [ "$current_version" -ge "$target_version_num" ]; then
        echo -e "${GREEN}✅ Database is already at or beyond target version${NC}"
        return
    fi
    
    # Create schema version table if needed
    create_schema_version_table
    
    # Run migrations
    for version in "${available_migrations[@]}"; do
        if [ "$version" -gt "$current_version" ] && [ "$version" -le "$target_version_num" ]; then
            run_single_migration $version
        fi
    done
    
    echo -e "${GREEN}✅ All migrations completed successfully${NC}"
}

# Function to run a single migration
run_single_migration() {
    local version=$1
    local migration_file=$(ls ../../rct-backend/src/main/resources/db/migration/V${version}__*.sql 2>/dev/null | head -1)
    
    if [ ! -f "$migration_file" ]; then
        handle_error "Migration file not found for version $version"
    fi
    
    local description=$(basename "$migration_file" | sed "s/V${version}__\(.*\)\.sql/\1/" | tr '_' ' ')
    local checksum=$(md5sum "$migration_file" | cut -d' ' -f1)
    
    echo -e "${YELLOW}Applying migration V$version: $description${NC}"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would apply migration from $migration_file${NC}"
        return
    fi
    
    # Start transaction
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v ON_ERROR_STOP=1 << EOF || handle_error "Migration V$version failed"
BEGIN;

-- Apply migration
\i $migration_file

-- Record migration
$(if [ "$MIGRATION_TOOL" = "native" ]; then
    echo "INSERT INTO schema_version (version, description, script_name, checksum) VALUES ($version, '$description', '$(basename "$migration_file")', '$checksum');"
fi)

COMMIT;
EOF
    
    echo -e "${GREEN}✅ Migration V$version applied successfully${NC}"
}

# Function to rollback migrations
rollback_migration() {
    print_section "🔄 Rolling Back Database"
    
    local current_version=$(get_current_version)
    local target_version=${TARGET_VERSION:-$((current_version - 1))}
    
    echo -e "${BLUE}Current version: $current_version${NC}"
    echo -e "${BLUE}Target version: $target_version${NC}"
    
    if [ "$current_version" -le "$target_version" ]; then
        echo -e "${GREEN}✅ Database is already at or below target version${NC}"
        return
    fi
    
    # Check if rollback scripts exist
    for ((version = current_version; version > target_version; version--)); do
        local rollback_file="../../rct-backend/src/main/resources/db/migration/R${version}__*.sql"
        
        if [ ! -f $rollback_file ]; then
            echo -e "${RED}❌ No rollback script found for version $version${NC}"
            echo -e "${RED}Manual rollback may be required${NC}"
            return 1
        fi
        
        if [ "$DRY_RUN" = "true" ]; then
            echo -e "${YELLOW}🔍 DRY RUN: Would rollback version $version using $rollback_file${NC}"
            continue
        fi
        
        echo -e "${YELLOW}Rolling back version $version${NC}"
        
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v ON_ERROR_STOP=1 << EOF || handle_error "Rollback of version $version failed"
BEGIN;

-- Apply rollback
\i $rollback_file

-- Remove migration record
$(if [ "$MIGRATION_TOOL" = "native" ]; then
    echo "DELETE FROM schema_version WHERE version = $version;"
fi)

COMMIT;
EOF
        
        echo -e "${GREEN}✅ Version $version rolled back successfully${NC}"
    done
}

# Function to show migration status
show_status() {
    print_section "📊 Migration Status"
    
    local current_version=$(get_current_version)
    local available_migrations=($(get_available_migrations))
    
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    echo -e "${BLUE}Database: $DB_HOST:$DB_PORT/$DB_NAME${NC}"
    echo -e "${BLUE}Current Version: $current_version${NC}"
    echo -e "${BLUE}Latest Available: ${available_migrations[-1]}${NC}"
    echo ""
    
    echo -e "${BLUE}Migration History:${NC}"
    if [ "$MIGRATION_TOOL" = "flyway" ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;"
    else
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version, description, applied_at, success FROM schema_version ORDER BY version;" 2>/dev/null || echo "No migration history found"
    fi
}

# Main execution
main() {
    check_prerequisites
    
    case $ACTION in
        "migrate")
            validate_migrations
            backup_database
            run_migrations
            ;;
        "rollback")
            backup_database
            rollback_migration
            ;;
        "status")
            show_status
            ;;
        "validate")
            validate_migrations
            ;;
        *)
            echo -e "${RED}❌ Invalid action: $ACTION${NC}"
            echo "Valid actions: migrate, rollback, status, validate"
            exit 1
            ;;
    esac
}

# Run main function
main

echo -e "${GREEN}🎉 Database migration script completed successfully!${NC}"