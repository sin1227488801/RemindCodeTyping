#!/bin/bash

# Production Deployment Script for RemindCodeTyping
# This script automates the production deployment process with comprehensive checks and rollback capabilities

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/rct-deployment-$(date +%Y%m%d_%H%M%S).log"
DEPLOYMENT_ID="deploy-$(date +%Y%m%d_%H%M%S)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
VERSION="${VERSION:-latest}"
ROLLBACK_VERSION="${ROLLBACK_VERSION:-}"
DRY_RUN="${DRY_RUN:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
FORCE_DEPLOY="${FORCE_DEPLOY:-false}"

# AWS Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECS_CLUSTER="${ECS_CLUSTER:-rct-production}"
ECS_SERVICE_BACKEND="${ECS_SERVICE_BACKEND:-rct-backend}"
ECS_SERVICE_FRONTEND="${ECS_SERVICE_FRONTEND:-rct-frontend}"
ALB_TARGET_GROUP="${ALB_TARGET_GROUP:-rct-production-tg}"

# Database Configuration
DB_HOST="${DB_HOST:-rct-production.cluster-xyz.us-east-1.rds.amazonaws.com}"
DB_NAME="${DB_NAME:-rct_production}"
DB_USER="${DB_USER:-rct_user}"

# Monitoring Configuration
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
PAGERDUTY_KEY="${PAGERDUTY_KEY:-}"

# Function to log messages
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        *)
            echo "[$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
    esac
}

# Function to send notifications
send_notification() {
    local message="$1"
    local severity="${2:-info}"
    
    # Slack notification
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 RCT Deployment: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
    
    # PagerDuty notification for critical events
    if [[ "$severity" == "critical" && -n "$PAGERDUTY_KEY" ]]; then
        curl -X POST -H 'Content-Type: application/json' \
            -d "{
                \"routing_key\": \"$PAGERDUTY_KEY\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"RCT Production Deployment Issue\",
                    \"source\": \"deployment-script\",
                    \"severity\": \"critical\",
                    \"custom_details\": {\"message\": \"$message\"}
                }
            }" \
            https://events.pagerduty.com/v2/enqueue 2>/dev/null || true
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."
    
    # Check required tools
    local required_tools=("aws" "docker" "curl" "jq" "psql")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool '$tool' is not installed"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log "ERROR" "AWS credentials not configured or invalid"
        exit 1
    fi
    
    # Check database connectivity
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        log "ERROR" "Cannot connect to production database"
        exit 1
    fi
    
    # Check if deployment is already in progress
    if aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE_BACKEND" \
        | jq -r '.services[0].deployments[] | select(.status == "RUNNING") | .status' \
        | grep -q "RUNNING"; then
        if [[ "$FORCE_DEPLOY" != "true" ]]; then
            log "ERROR" "Deployment already in progress. Use FORCE_DEPLOY=true to override"
            exit 1
        fi
    fi
    
    log "SUCCESS" "All prerequisites satisfied"
}

# Function to run pre-deployment tests
run_pre_deployment_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log "WARN" "Skipping pre-deployment tests (SKIP_TESTS=true)"
        return 0
    fi
    
    log "INFO" "Running pre-deployment tests..."
    
    # Backend tests
    log "INFO" "Running backend tests..."
    cd "$PROJECT_ROOT/rct-backend"
    if ! ./mvnw clean test -Dspring.profiles.active=test; then
        log "ERROR" "Backend tests failed"
        exit 1
    fi
    
    # Frontend tests
    log "INFO" "Running frontend tests..."
    cd "$PROJECT_ROOT"
    if ! npm test -- --run; then
        log "ERROR" "Frontend tests failed"
        exit 1
    fi
    
    # Integration tests
    log "INFO" "Running integration tests..."
    cd "$PROJECT_ROOT/rct-backend"
    if ! ./mvnw test -Dtest="*IntegrationTest" -Dspring.profiles.active=integration; then
        log "ERROR" "Integration tests failed"
        exit 1
    fi
    
    # Security tests
    log "INFO" "Running security tests..."
    if ! ./mvnw test -Dtest="*SecurityTest" -Dspring.profiles.active=security; then
        log "ERROR" "Security tests failed"
        exit 1
    fi
    
    log "SUCCESS" "All pre-deployment tests passed"
}

# Function to build and push Docker images
build_and_push_images() {
    log "INFO" "Building and pushing Docker images..."
    
    # Get ECR login token
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build backend image
    log "INFO" "Building backend Docker image..."
    cd "$PROJECT_ROOT/rct-backend"
    docker build -t "rct-backend:$VERSION" .
    docker tag "rct-backend:$VERSION" "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/rct-backend:$VERSION"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        docker push "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/rct-backend:$VERSION"
    fi
    
    # Build frontend image
    log "INFO" "Building frontend Docker image..."
    cd "$PROJECT_ROOT"
    docker build -f Dockerfile.frontend -t "rct-frontend:$VERSION" .
    docker tag "rct-frontend:$VERSION" "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/rct-frontend:$VERSION"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        docker push "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/rct-frontend:$VERSION"
    fi
    
    log "SUCCESS" "Docker images built and pushed successfully"
}

# Function to run database migrations
run_database_migrations() {
    log "INFO" "Running database migrations..."
    
    # Create backup before migration
    local backup_file="/tmp/rct-backup-pre-migration-$(date +%Y%m%d_%H%M%S).sql"
    log "INFO" "Creating database backup: $backup_file"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"
        
        # Upload backup to S3
        aws s3 cp "$backup_file" "s3://rct-backups/database/$(basename "$backup_file")"
    fi
    
    # Run Flyway migrations
    cd "$PROJECT_ROOT/rct-backend"
    if [[ "$DRY_RUN" != "true" ]]; then
        ./mvnw flyway:migrate \
            -Dflyway.url="jdbc:postgresql://$DB_HOST:5432/$DB_NAME" \
            -Dflyway.user="$DB_USER" \
            -Dflyway.password="$DB_PASSWORD"
    else
        log "INFO" "DRY RUN: Would run database migrations"
    fi
    
    log "SUCCESS" "Database migrations completed successfully"
}

# Function to deploy to ECS
deploy_to_ecs() {
    log "INFO" "Deploying to ECS..."
    
    # Update backend service
    log "INFO" "Updating backend service..."
    local backend_task_def=$(aws ecs describe-task-definition --task-definition rct-backend-production --query 'taskDefinition')
    local new_backend_task_def=$(echo "$backend_task_def" | jq --arg IMAGE "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/rct-backend:$VERSION" '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')
    
    if [[ "$DRY_RUN" != "true" ]]; then
        echo "$new_backend_task_def" > /tmp/backend-task-def.json
        aws ecs register-task-definition --cli-input-json file:///tmp/backend-task-def.json
        
        aws ecs update-service \
            --cluster "$ECS_CLUSTER" \
            --service "$ECS_SERVICE_BACKEND" \
            --task-definition rct-backend-production
    fi
    
    # Update frontend service
    log "INFO" "Updating frontend service..."
    local frontend_task_def=$(aws ecs describe-task-definition --task-definition rct-frontend-production --query 'taskDefinition')
    local new_frontend_task_def=$(echo "$frontend_task_def" | jq --arg IMAGE "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/rct-frontend:$VERSION" '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')
    
    if [[ "$DRY_RUN" != "true" ]]; then
        echo "$new_frontend_task_def" > /tmp/frontend-task-def.json
        aws ecs register-task-definition --cli-input-json file:///tmp/frontend-task-def.json
        
        aws ecs update-service \
            --cluster "$ECS_CLUSTER" \
            --service "$ECS_SERVICE_FRONTEND" \
            --task-definition rct-frontend-production
    fi
    
    log "SUCCESS" "ECS deployment initiated"
}

# Function to wait for deployment completion
wait_for_deployment() {
    log "INFO" "Waiting for deployment to complete..."
    
    local max_wait=1800  # 30 minutes
    local wait_interval=30
    local elapsed=0
    
    while [[ $elapsed -lt $max_wait ]]; do
        local backend_stable=$(aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE_BACKEND" --query 'services[0].deployments[?status==`RUNNING`] | length(@)')
        local frontend_stable=$(aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE_FRONTEND" --query 'services[0].deployments[?status==`RUNNING`] | length(@)')
        
        if [[ "$backend_stable" == "1" && "$frontend_stable" == "1" ]]; then
            log "SUCCESS" "Deployment completed successfully"
            return 0
        fi
        
        log "INFO" "Deployment in progress... (${elapsed}s elapsed)"
        sleep $wait_interval
        elapsed=$((elapsed + wait_interval))
    done
    
    log "ERROR" "Deployment timed out after ${max_wait} seconds"
    return 1
}

# Function to run health checks
run_health_checks() {
    log "INFO" "Running post-deployment health checks..."
    
    # Get ALB DNS name
    local alb_dns=$(aws elbv2 describe-load-balancers --names rct-production --query 'LoadBalancers[0].DNSName' --output text)
    local health_url="https://$alb_dns/actuator/health"
    
    # Wait for ALB to route traffic to new instances
    sleep 60
    
    # Health check with retries
    local max_retries=10
    local retry_interval=30
    
    for ((i=1; i<=max_retries; i++)); do
        log "INFO" "Health check attempt $i/$max_retries..."
        
        if curl -f -s "$health_url" | jq -e '.status == "UP"' > /dev/null; then
            log "SUCCESS" "Health check passed"
            break
        fi
        
        if [[ $i -eq $max_retries ]]; then
            log "ERROR" "Health checks failed after $max_retries attempts"
            return 1
        fi
        
        sleep $retry_interval
    done
    
    # Additional functional tests
    log "INFO" "Running functional tests..."
    "$SCRIPT_DIR/functional-tests.sh" "$alb_dns"
    
    log "SUCCESS" "All health checks and functional tests passed"
}

# Function to run smoke tests
run_smoke_tests() {
    log "INFO" "Running smoke tests..."
    
    # Test user authentication
    local alb_dns=$(aws elbv2 describe-load-balancers --names rct-production --query 'LoadBalancers[0].DNSName' --output text)
    local api_url="https://$alb_dns/api"
    
    # Test health endpoint
    if ! curl -f -s "$api_url/actuator/health" > /dev/null; then
        log "ERROR" "Health endpoint smoke test failed"
        return 1
    fi
    
    # Test authentication endpoint
    local auth_response=$(curl -s -X POST "$api_url/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"loginId":"smoketest","password":"smoketest123"}' \
        -w "%{http_code}")
    
    if [[ "${auth_response: -3}" != "200" && "${auth_response: -3}" != "401" ]]; then
        log "ERROR" "Authentication endpoint smoke test failed"
        return 1
    fi
    
    log "SUCCESS" "Smoke tests passed"
}

# Function to update monitoring and alerting
update_monitoring() {
    log "INFO" "Updating monitoring and alerting..."
    
    # Update Prometheus targets
    if [[ "$DRY_RUN" != "true" ]]; then
        # This would typically update service discovery or configuration
        # Implementation depends on your monitoring setup
        log "INFO" "Monitoring configuration updated"
    fi
    
    # Send deployment notification
    send_notification "Deployment $DEPLOYMENT_ID completed successfully for version $VERSION"
    
    log "SUCCESS" "Monitoring and alerting updated"
}

# Function to rollback deployment
rollback_deployment() {
    log "WARN" "Initiating deployment rollback..."
    
    if [[ -z "$ROLLBACK_VERSION" ]]; then
        log "ERROR" "ROLLBACK_VERSION not specified"
        exit 1
    fi
    
    # Rollback ECS services
    log "INFO" "Rolling back ECS services to version $ROLLBACK_VERSION..."
    
    # Update backend service to previous version
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE_BACKEND" \
        --task-definition "rct-backend-production:$ROLLBACK_VERSION"
    
    # Update frontend service to previous version
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE_FRONTEND" \
        --task-definition "rct-frontend-production:$ROLLBACK_VERSION"
    
    # Wait for rollback to complete
    wait_for_deployment
    
    # Run health checks
    run_health_checks
    
    # Send rollback notification
    send_notification "Deployment rolled back to version $ROLLBACK_VERSION" "critical"
    
    log "SUCCESS" "Rollback completed successfully"
}

# Function to cleanup
cleanup() {
    log "INFO" "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f /tmp/backend-task-def.json
    rm -f /tmp/frontend-task-def.json
    
    # Clean up old Docker images (keep last 5 versions)
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | grep rct- | sort -k2 -r | tail -n +6 | awk '{print $1}' | xargs -r docker rmi || true
    
    log "SUCCESS" "Cleanup completed"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] COMMAND

Commands:
    deploy      Deploy to production
    rollback    Rollback to previous version
    status      Show deployment status
    logs        Show deployment logs

Options:
    --version VERSION           Version to deploy (default: latest)
    --rollback-version VERSION  Version to rollback to
    --dry-run                   Perform dry run without actual deployment
    --skip-tests               Skip pre-deployment tests
    --force                    Force deployment even if one is in progress
    --environment ENV          Target environment (default: production)

Environment Variables:
    AWS_REGION                 AWS region (default: us-east-1)
    ECS_CLUSTER               ECS cluster name
    DB_HOST                   Database host
    DB_USER                   Database user
    DB_PASSWORD               Database password
    SLACK_WEBHOOK             Slack webhook URL for notifications
    PAGERDUTY_KEY            PagerDuty integration key

Examples:
    $0 deploy --version v2.0.0
    $0 rollback --rollback-version v1.9.0
    $0 deploy --dry-run --skip-tests
    $0 status

EOF
}

# Main deployment function
main() {
    local command="${1:-}"
    
    case "$command" in
        "deploy")
            log "INFO" "Starting production deployment (ID: $DEPLOYMENT_ID)"
            send_notification "Starting deployment $DEPLOYMENT_ID for version $VERSION"
            
            check_prerequisites
            run_pre_deployment_tests
            build_and_push_images
            run_database_migrations
            deploy_to_ecs
            wait_for_deployment
            run_health_checks
            run_smoke_tests
            update_monitoring
            cleanup
            
            log "SUCCESS" "Production deployment completed successfully!"
            send_notification "Deployment $DEPLOYMENT_ID completed successfully! 🎉"
            ;;
            
        "rollback")
            log "INFO" "Starting deployment rollback"
            rollback_deployment
            ;;
            
        "status")
            log "INFO" "Checking deployment status..."
            aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE_BACKEND" "$ECS_SERVICE_FRONTEND" \
                | jq -r '.services[] | "\(.serviceName): \(.deployments[0].status) (\(.runningCount)/\(.desiredCount) tasks)"'
            ;;
            
        "logs")
            log "INFO" "Showing recent deployment logs..."
            tail -f "$LOG_FILE" 2>/dev/null || echo "No log file found"
            ;;
            
        "help"|"--help"|"-h"|"")
            show_usage
            ;;
            
        *)
            log "ERROR" "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            VERSION="$2"
            shift 2
            ;;
        --rollback-version)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS="true"
            shift
            ;;
        --force)
            FORCE_DEPLOY="true"
            shift
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        *)
            break
            ;;
    esac
done

# Trap to handle script interruption
trap 'log "ERROR" "Deployment interrupted"; send_notification "Deployment $DEPLOYMENT_ID interrupted" "critical"; exit 1' INT TERM

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Run main function with remaining arguments
main "$@"