#!/bin/bash

# Production Readiness Check Script
# This script validates that all production deployment requirements are met

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHECKLIST_FILE="$PROJECT_ROOT/PRODUCTION_DEPLOYMENT_CHECKLIST.md"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
FAILED_CHECKS=()

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "PASS")
            echo -e "${GREEN}[PASS]${NC} $message"
            ((CHECKS_PASSED++))
            ;;
        "FAIL")
            echo -e "${RED}[FAIL]${NC} $message"
            ((CHECKS_FAILED++))
            FAILED_CHECKS+=("$message")
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ((CHECKS_WARNING++))
            ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check file exists and is readable
file_exists() {
    [[ -f "$1" && -r "$1" ]]
}

# Function to check directory exists
dir_exists() {
    [[ -d "$1" ]]
}

# Check 1: Required Tools and Dependencies
check_required_tools() {
    log "INFO" "Checking required tools and dependencies..."
    
    local required_tools=("java" "mvn" "docker" "aws" "curl" "jq" "psql" "node" "npm")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if command_exists "$tool"; then
            log "PASS" "Required tool '$tool' is available"
        else
            log "FAIL" "Required tool '$tool' is missing"
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -eq 0 ]]; then
        log "PASS" "All required tools are available"
    else
        log "FAIL" "Missing tools: ${missing_tools[*]}"
    fi
}

# Check 2: Project Structure
check_project_structure() {
    log "INFO" "Checking project structure..."
    
    local required_dirs=(
        "$PROJECT_ROOT/rct-backend"
        "$PROJECT_ROOT/Rct"
        "$PROJECT_ROOT/tests"
        "$PROJECT_ROOT/docs"
        "$PROJECT_ROOT/infrastructure"
        "$PROJECT_ROOT/scripts"
    )
    
    for dir in "${required_dirs[@]}"; do
        if dir_exists "$dir"; then
            log "PASS" "Directory exists: $(basename "$dir")"
        else
            log "FAIL" "Missing directory: $(basename "$dir")"
        fi
    done
    
    local required_files=(
        "$PROJECT_ROOT/README.md"
        "$PROJECT_ROOT/PRODUCTION_DEPLOYMENT_CHECKLIST.md"
        "$PROJECT_ROOT/INCIDENT_RESPONSE_PROCEDURES.md"
        "$PROJECT_ROOT/ROLLBACK_PLAN.md"
        "$PROJECT_ROOT/docker-compose.yml"
        "$PROJECT_ROOT/docker-compose.production.yml"
    )
    
    for file in "${required_files[@]}"; do
        if file_exists "$file"; then
            log "PASS" "File exists: $(basename "$file")"
        else
            log "FAIL" "Missing file: $(basename "$file")"
        fi
    done
}

# Check 3: Backend Build and Tests
check_backend_build() {
    log "INFO" "Checking backend build and tests..."
    
    cd "$PROJECT_ROOT/rct-backend"
    
    # Check if Maven wrapper exists
    if file_exists "./mvnw"; then
        log "PASS" "Maven wrapper exists"
    else
        log "FAIL" "Maven wrapper missing"
        return 1
    fi
    
    # Check if pom.xml exists and is valid
    if file_exists "pom.xml"; then
        log "PASS" "pom.xml exists"
        
        # Validate pom.xml
        if ./mvnw help:effective-pom -q > /dev/null 2>&1; then
            log "PASS" "pom.xml is valid"
        else
            log "FAIL" "pom.xml is invalid"
        fi
    else
        log "FAIL" "pom.xml missing"
    fi
    
    # Check if build succeeds
    log "INFO" "Running backend build..."
    if ./mvnw clean compile -q; then
        log "PASS" "Backend build successful"
    else
        log "FAIL" "Backend build failed"
    fi
    
    # Check if tests pass
    log "INFO" "Running backend tests..."
    if ./mvnw test -q; then
        log "PASS" "Backend tests passed"
    else
        log "FAIL" "Backend tests failed"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check 4: Frontend Build and Tests
check_frontend_build() {
    log "INFO" "Checking frontend build and tests..."
    
    cd "$PROJECT_ROOT"
    
    # Check if package.json exists
    if file_exists "package.json"; then
        log "PASS" "package.json exists"
    else
        log "FAIL" "package.json missing"
        return 1
    fi
    
    # Check if node_modules exists or can be installed
    if dir_exists "node_modules" || npm install --silent; then
        log "PASS" "Node dependencies available"
    else
        log "FAIL" "Cannot install Node dependencies"
    fi
    
    # Check if frontend tests pass
    log "INFO" "Running frontend tests..."
    if npm test -- --run --silent 2>/dev/null; then
        log "PASS" "Frontend tests passed"
    else
        log "WARN" "Frontend tests failed or not configured"
    fi
}

# Check 5: Docker Configuration
check_docker_configuration() {
    log "INFO" "Checking Docker configuration..."
    
    # Check backend Dockerfile
    if file_exists "$PROJECT_ROOT/rct-backend/Dockerfile"; then
        log "PASS" "Backend Dockerfile exists"
    else
        log "FAIL" "Backend Dockerfile missing"
    fi
    
    # Check frontend Dockerfile
    if file_exists "$PROJECT_ROOT/Dockerfile.frontend"; then
        log "PASS" "Frontend Dockerfile exists"
    else
        log "FAIL" "Frontend Dockerfile missing"
    fi
    
    # Check docker-compose files
    if file_exists "$PROJECT_ROOT/docker-compose.yml"; then
        log "PASS" "docker-compose.yml exists"
    else
        log "FAIL" "docker-compose.yml missing"
    fi
    
    if file_exists "$PROJECT_ROOT/docker-compose.production.yml"; then
        log "PASS" "docker-compose.production.yml exists"
    else
        log "FAIL" "docker-compose.production.yml missing"
    fi
    
    # Validate docker-compose syntax
    if command_exists "docker-compose"; then
        cd "$PROJECT_ROOT"
        if docker-compose config > /dev/null 2>&1; then
            log "PASS" "docker-compose configuration is valid"
        else
            log "FAIL" "docker-compose configuration is invalid"
        fi
    fi
}

# Check 6: Database Configuration
check_database_configuration() {
    log "INFO" "Checking database configuration..."
    
    # Check Flyway migrations
    local migration_dir="$PROJECT_ROOT/rct-backend/src/main/resources/db/migration"
    if dir_exists "$migration_dir"; then
        local migration_count=$(find "$migration_dir" -name "V*.sql" | wc -l)
        if [[ $migration_count -gt 0 ]]; then
            log "PASS" "Database migrations found ($migration_count files)"
        else
            log "WARN" "No database migration files found"
        fi
    else
        log "FAIL" "Database migration directory missing"
    fi
    
    # Check application.yml for database configuration
    local app_config="$PROJECT_ROOT/rct-backend/src/main/resources/application.yml"
    if file_exists "$app_config"; then
        if grep -q "datasource:" "$app_config"; then
            log "PASS" "Database configuration found in application.yml"
        else
            log "FAIL" "Database configuration missing in application.yml"
        fi
    else
        log "FAIL" "application.yml missing"
    fi
}

# Check 7: Security Configuration
check_security_configuration() {
    log "INFO" "Checking security configuration..."
    
    # Check for hardcoded secrets
    log "INFO" "Scanning for hardcoded secrets..."
    local secret_patterns=("password.*=" "secret.*=" "key.*=" "token.*=")
    local secrets_found=false
    
    for pattern in "${secret_patterns[@]}"; do
        if grep -r -i "$pattern" "$PROJECT_ROOT/rct-backend/src" --include="*.java" --include="*.yml" --include="*.properties" | grep -v "example" | grep -v "test" > /dev/null 2>&1; then
            secrets_found=true
            break
        fi
    done
    
    if [[ "$secrets_found" == "false" ]]; then
        log "PASS" "No hardcoded secrets found"
    else
        log "FAIL" "Potential hardcoded secrets found"
    fi
    
    # Check for security configuration files
    local security_files=(
        "$PROJECT_ROOT/rct-backend/src/main/java/com/rct/infrastructure/security/SecurityConfig.java"
        "$PROJECT_ROOT/rct-backend/src/main/java/com/rct/infrastructure/security/JwtTokenService.java"
        "$PROJECT_ROOT/rct-backend/src/main/java/com/rct/infrastructure/security/PasswordService.java"
    )
    
    for file in "${security_files[@]}"; do
        if file_exists "$file"; then
            log "PASS" "Security file exists: $(basename "$file")"
        else
            log "FAIL" "Security file missing: $(basename "$file")"
        fi
    done
}

# Check 8: Monitoring and Logging Configuration
check_monitoring_configuration() {
    log "INFO" "Checking monitoring and logging configuration..."
    
    # Check monitoring configuration files
    if file_exists "$PROJECT_ROOT/monitoring-alerting-setup.yml"; then
        log "PASS" "Monitoring configuration exists"
    else
        log "FAIL" "Monitoring configuration missing"
    fi
    
    # Check for actuator endpoints in application.yml
    local app_config="$PROJECT_ROOT/rct-backend/src/main/resources/application.yml"
    if file_exists "$app_config" && grep -q "actuator" "$app_config"; then
        log "PASS" "Actuator endpoints configured"
    else
        log "WARN" "Actuator endpoints not configured"
    fi
    
    # Check logging configuration
    if file_exists "$PROJECT_ROOT/rct-backend/src/main/resources/logback-spring.xml"; then
        log "PASS" "Logging configuration exists"
    else
        log "WARN" "Custom logging configuration missing"
    fi
}

# Check 9: Infrastructure as Code
check_infrastructure_code() {
    log "INFO" "Checking infrastructure as code..."
    
    # Check Terraform configuration
    if dir_exists "$PROJECT_ROOT/infrastructure/terraform"; then
        log "PASS" "Terraform configuration directory exists"
        
        local tf_files=$(find "$PROJECT_ROOT/infrastructure/terraform" -name "*.tf" | wc -l)
        if [[ $tf_files -gt 0 ]]; then
            log "PASS" "Terraform files found ($tf_files files)"
        else
            log "WARN" "No Terraform files found"
        fi
    else
        log "WARN" "Terraform configuration directory missing"
    fi
    
    # Check deployment scripts
    if file_exists "$PROJECT_ROOT/scripts/production-deployment.sh"; then
        log "PASS" "Production deployment script exists"
    else
        log "FAIL" "Production deployment script missing"
    fi
    
    if file_exists "$PROJECT_ROOT/deploy.sh"; then
        log "PASS" "Deployment script exists"
    else
        log "WARN" "Main deployment script missing"
    fi
}

# Check 10: Documentation
check_documentation() {
    log "INFO" "Checking documentation..."
    
    local required_docs=(
        "$PROJECT_ROOT/README.md"
        "$PROJECT_ROOT/docs/DEVELOPMENT_SETUP.md"
        "$PROJECT_ROOT/docs/BUILD_AND_DEPLOYMENT.md"
        "$PROJECT_ROOT/PRODUCTION_DEPLOYMENT_CHECKLIST.md"
        "$PROJECT_ROOT/INCIDENT_RESPONSE_PROCEDURES.md"
        "$PROJECT_ROOT/ROLLBACK_PLAN.md"
    )
    
    for doc in "${required_docs[@]}"; do
        if file_exists "$doc"; then
            # Check if file has content (more than just a title)
            local line_count=$(wc -l < "$doc")
            if [[ $line_count -gt 10 ]]; then
                log "PASS" "Documentation exists and has content: $(basename "$doc")"
            else
                log "WARN" "Documentation exists but may be incomplete: $(basename "$doc")"
            fi
        else
            log "FAIL" "Documentation missing: $(basename "$doc")"
        fi
    done
    
    # Check API documentation
    if file_exists "$PROJECT_ROOT/rct-backend/docs/API_USAGE_GUIDE.md"; then
        log "PASS" "API documentation exists"
    else
        log "WARN" "API documentation missing"
    fi
}

# Check 11: Test Coverage
check_test_coverage() {
    log "INFO" "Checking test coverage..."
    
    cd "$PROJECT_ROOT/rct-backend"
    
    # Run tests with coverage
    if ./mvnw clean test jacoco:report -q 2>/dev/null; then
        local coverage_file="target/site/jacoco/index.html"
        if file_exists "$coverage_file"; then
            log "PASS" "Test coverage report generated"
            
            # Try to extract coverage percentage (basic check)
            if grep -q "Total.*%" "$coverage_file"; then
                log "PASS" "Test coverage metrics available"
            else
                log "WARN" "Test coverage metrics not found"
            fi
        else
            log "WARN" "Test coverage report not generated"
        fi
    else
        log "WARN" "Could not generate test coverage report"
    fi
    
    cd "$PROJECT_ROOT"
}

# Check 12: Environment Configuration
check_environment_configuration() {
    log "INFO" "Checking environment configuration..."
    
    # Check for environment-specific configuration files
    local env_files=(
        "$PROJECT_ROOT/rct-backend/.env.example"
        "$PROJECT_ROOT/rct-backend/.env.production.example"
        "$PROJECT_ROOT/rct-backend/src/main/resources/application-production.yml"
    )
    
    for file in "${env_files[@]}"; do
        if file_exists "$file"; then
            log "PASS" "Environment file exists: $(basename "$file")"
        else
            log "WARN" "Environment file missing: $(basename "$file")"
        fi
    done
    
    # Check for 12-factor app compliance
    local app_config="$PROJECT_ROOT/rct-backend/src/main/resources/application.yml"
    if file_exists "$app_config"; then
        if grep -q "\${" "$app_config"; then
            log "PASS" "Configuration uses environment variables"
        else
            log "WARN" "Configuration may not be externalized"
        fi
    fi
}

# Check 13: CI/CD Configuration
check_cicd_configuration() {
    log "INFO" "Checking CI/CD configuration..."
    
    # Check GitHub Actions
    if dir_exists "$PROJECT_ROOT/.github/workflows"; then
        local workflow_count=$(find "$PROJECT_ROOT/.github/workflows" -name "*.yml" -o -name "*.yaml" | wc -l)
        if [[ $workflow_count -gt 0 ]]; then
            log "PASS" "GitHub Actions workflows found ($workflow_count files)"
        else
            log "WARN" "No GitHub Actions workflows found"
        fi
    else
        log "WARN" "GitHub Actions directory missing"
    fi
    
    # Check quality gates
    local quality_files=(
        "$PROJECT_ROOT/rct-backend/checkstyle.xml"
        "$PROJECT_ROOT/rct-backend/pmd-rules.xml"
        "$PROJECT_ROOT/.pre-commit-config.yaml"
    )
    
    for file in "${quality_files[@]}"; do
        if file_exists "$file"; then
            log "PASS" "Quality gate file exists: $(basename "$file")"
        else
            log "WARN" "Quality gate file missing: $(basename "$file")"
        fi
    done
}

# Check 14: Backup and Recovery
check_backup_recovery() {
    log "INFO" "Checking backup and recovery procedures..."
    
    # Check for backup scripts
    if file_exists "$PROJECT_ROOT/scripts/backup-database.sh"; then
        log "PASS" "Database backup script exists"
    else
        log "WARN" "Database backup script missing"
    fi
    
    # Check for recovery procedures in documentation
    if file_exists "$PROJECT_ROOT/ROLLBACK_PLAN.md"; then
        if grep -q -i "backup\|recovery\|restore" "$PROJECT_ROOT/ROLLBACK_PLAN.md"; then
            log "PASS" "Recovery procedures documented"
        else
            log "WARN" "Recovery procedures may not be documented"
        fi
    fi
    
    # Check for data migration scripts
    local migration_scripts_dir="$PROJECT_ROOT/rct-backend/src/main/resources/db/migration/scripts"
    if dir_exists "$migration_scripts_dir"; then
        log "PASS" "Migration scripts directory exists"
    else
        log "WARN" "Migration scripts directory missing"
    fi
}

# Check 15: Performance and Load Testing
check_performance_testing() {
    log "INFO" "Checking performance and load testing setup..."
    
    # Check for performance test files
    local perf_test_patterns=("*Performance*Test.java" "*Load*Test.java" "*Stress*Test.java")
    local perf_tests_found=false
    
    for pattern in "${perf_test_patterns[@]}"; do
        if find "$PROJECT_ROOT/rct-backend/src/test" -name "$pattern" | grep -q .; then
            perf_tests_found=true
            break
        fi
    done
    
    if [[ "$perf_tests_found" == "true" ]]; then
        log "PASS" "Performance tests found"
    else
        log "WARN" "Performance tests not found"
    fi
    
    # Check for JMeter or similar tools configuration
    if dir_exists "$PROJECT_ROOT/performance-tests"; then
        log "PASS" "Performance tests directory exists"
    else
        log "WARN" "Performance tests directory missing"
    fi
}

# Generate summary report
generate_summary() {
    log "INFO" "Production Readiness Check Summary"
    log "INFO" "======================================"
    log "INFO" "Checks passed: $CHECKS_PASSED"
    log "INFO" "Checks failed: $CHECKS_FAILED"
    log "INFO" "Warnings: $CHECKS_WARNING"
    
    if [[ $CHECKS_FAILED -gt 0 ]]; then
        log "FAIL" "Failed checks:"
        for failed_check in "${FAILED_CHECKS[@]}"; do
            log "FAIL" "  - $failed_check"
        done
        
        log "ERROR" "Production deployment is NOT READY"
        log "ERROR" "Please address the failed checks before proceeding"
        return 1
    elif [[ $CHECKS_WARNING -gt 0 ]]; then
        log "WARN" "Production deployment has warnings"
        log "WARN" "Review warnings and consider addressing them"
        return 0
    else
        log "PASS" "Production deployment is READY"
        log "PASS" "All checks passed successfully"
        return 0
    fi
}

# Main execution
main() {
    log "INFO" "Starting Production Readiness Check"
    log "INFO" "Project: RemindCodeTyping"
    log "INFO" "Date: $(date)"
    log "INFO" "======================================"
    
    check_required_tools
    check_project_structure
    check_backend_build
    check_frontend_build
    check_docker_configuration
    check_database_configuration
    check_security_configuration
    check_monitoring_configuration
    check_infrastructure_code
    check_documentation
    check_test_coverage
    check_environment_configuration
    check_cicd_configuration
    check_backup_recovery
    check_performance_testing
    
    generate_summary
}

# Run the main function
main "$@"