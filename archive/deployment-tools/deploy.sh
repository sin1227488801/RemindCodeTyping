#!/bin/bash

# Deployment Script for RemindCodeTyping Project
# This script handles deployment to different environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
ROLLBACK=${3:-false}
DRY_RUN=${4:-false}

# Environment-specific configurations
case $ENVIRONMENT in
    "staging")
        COMPOSE_FILE="docker-compose.staging.yml"
        ENV_FILE=".env.staging"
        DOMAIN="staging.rct.example.com"
        ;;
    "production")
        COMPOSE_FILE="docker-compose.production.yml"
        ENV_FILE=".env.production"
        DOMAIN="rct.example.com"
        ;;
    "local")
        COMPOSE_FILE="docker-compose.yml"
        ENV_FILE=".env"
        DOMAIN="localhost"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo "Valid environments: staging, production, local"
        exit 1
        ;;
esac

echo -e "${BLUE}🚀 RemindCodeTyping Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Rollback: ${ROLLBACK}${NC}"
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
    echo -e "\n${RED}❌ Deployment failed at: $1${NC}"
    echo -e "${RED}Rolling back changes...${NC}"
    
    # Attempt rollback
    if [ -f "docker-compose.backup.yml" ]; then
        docker-compose -f docker-compose.backup.yml up -d || true
    fi
    
    exit 1
}

# Function to check prerequisites
check_prerequisites() {
    print_section "📋 Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        handle_error "Docker is not installed"
    fi
    echo -e "${GREEN}✅ Docker version: $(docker --version)${NC}"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        handle_error "Docker Compose is not installed"
    fi
    echo -e "${GREEN}✅ Docker Compose version: $(docker-compose --version)${NC}"
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}⚠️  Environment file $ENV_FILE not found, using defaults${NC}"
        cp .env.example "$ENV_FILE"
    fi
    echo -e "${GREEN}✅ Environment file: $ENV_FILE${NC}"
    
    # Check compose file
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${YELLOW}⚠️  Compose file $COMPOSE_FILE not found, using default${NC}"
        COMPOSE_FILE="docker-compose.yml"
    fi
    echo -e "${GREEN}✅ Compose file: $COMPOSE_FILE${NC}"
}

# Function to backup current deployment
backup_current_deployment() {
    print_section "💾 Backing Up Current Deployment"
    
    if [ -f "$COMPOSE_FILE" ]; then
        cp "$COMPOSE_FILE" "docker-compose.backup.yml"
        echo -e "${GREEN}✅ Current deployment backed up${NC}"
    else
        echo -e "${YELLOW}⚠️  No current deployment to backup${NC}"
    fi
}

# Function to pull latest images
pull_images() {
    print_section "📥 Pulling Latest Images"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would pull images for version $VERSION${NC}"
        return
    fi
    
    # Pull images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull || handle_error "Failed to pull images"
    echo -e "${GREEN}✅ Images pulled successfully${NC}"
}

# Function to run database migrations
run_migrations() {
    print_section "🗄️  Running Database Migrations"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would run database migrations${NC}"
        return
    fi
    
    # Start database if not running
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d database
    
    # Wait for database to be ready
    echo -e "${YELLOW}Waiting for database to be ready...${NC}"
    sleep 30
    
    # Run migrations
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend \
        java -jar app.jar --spring.profiles.active=migration || handle_error "Database migration failed"
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Function to deploy services
deploy_services() {
    print_section "🚀 Deploying Services"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would deploy services${NC}"
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config
        return
    fi
    
    # Deploy with zero-downtime strategy
    echo -e "${YELLOW}Starting deployment...${NC}"
    
    # Start database first
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d database redis
    
    # Wait for database
    sleep 10
    
    # Start backend
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backend
    
    # Wait for backend to be healthy
    echo -e "${YELLOW}Waiting for backend to be healthy...${NC}"
    timeout 120 bash -c 'until docker-compose -f "'$COMPOSE_FILE'" --env-file "'$ENV_FILE'" exec backend curl -f http://localhost:8080/actuator/health; do sleep 5; done' || handle_error "Backend health check failed"
    
    # Start frontend
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d frontend
    
    # Start nginx if configured
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config --services | grep -q nginx; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx
    fi
    
    echo -e "${GREEN}✅ Services deployed successfully${NC}"
}

# Function to run health checks
run_health_checks() {
    print_section "🏥 Running Health Checks"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would run health checks${NC}"
        return
    fi
    
    # Check backend health
    echo -e "${YELLOW}Checking backend health...${NC}"
    for i in {1..12}; do
        if curl -f http://localhost:8080/actuator/health &>/dev/null; then
            echo -e "${GREEN}✅ Backend is healthy${NC}"
            break
        fi
        if [ $i -eq 12 ]; then
            handle_error "Backend health check failed after 60 seconds"
        fi
        sleep 5
    done
    
    # Check frontend health
    echo -e "${YELLOW}Checking frontend health...${NC}"
    for i in {1..6}; do
        if curl -f http://localhost:3000/health &>/dev/null; then
            echo -e "${GREEN}✅ Frontend is healthy${NC}"
            break
        fi
        if [ $i -eq 6 ]; then
            handle_error "Frontend health check failed after 30 seconds"
        fi
        sleep 5
    done
    
    # Check database connectivity
    echo -e "${YELLOW}Checking database connectivity...${NC}"
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T database pg_isready -U rct_user -d rct_db; then
        echo -e "${GREEN}✅ Database is accessible${NC}"
    else
        handle_error "Database connectivity check failed"
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    print_section "🧪 Running Smoke Tests"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would run smoke tests${NC}"
        return
    fi
    
    # Test API endpoints
    echo -e "${YELLOW}Testing API endpoints...${NC}"
    
    # Test health endpoint
    if curl -f http://localhost:8080/actuator/health | grep -q "UP"; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        handle_error "Health endpoint test failed"
    fi
    
    # Test info endpoint
    if curl -f http://localhost:8080/actuator/info &>/dev/null; then
        echo -e "${GREEN}✅ Info endpoint working${NC}"
    else
        echo -e "${YELLOW}⚠️  Info endpoint not accessible${NC}"
    fi
    
    # Test frontend
    echo -e "${YELLOW}Testing frontend...${NC}"
    if curl -f http://localhost:3000/ | grep -q "RemindCodeTyping"; then
        echo -e "${GREEN}✅ Frontend is serving content${NC}"
    else
        handle_error "Frontend test failed"
    fi
}

# Function to cleanup old resources
cleanup_old_resources() {
    print_section "🧹 Cleaning Up Old Resources"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would cleanup old resources${NC}"
        return
    fi
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful in production)
    if [ "$ENVIRONMENT" != "production" ]; then
        docker volume prune -f
    fi
    
    # Remove backup files older than 7 days
    find . -name "docker-compose.backup.*.yml" -mtime +7 -delete 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to generate deployment report
generate_deployment_report() {
    print_section "📋 Deployment Report"
    
    DEPLOYMENT_TIME=$(date)
    
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Deployment Summary:${NC}"
    echo -e "  Environment: ${ENVIRONMENT}"
    echo -e "  Version: ${VERSION}"
    echo -e "  Deployment Time: ${DEPLOYMENT_TIME}"
    echo -e "  Domain: ${DOMAIN}"
    echo -e "  Compose File: ${COMPOSE_FILE}"
    echo -e "  Environment File: ${ENV_FILE}"
    echo ""
    
    # Show running services
    echo -e "${BLUE}Running Services:${NC}"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    echo ""
    
    # Show service URLs
    echo -e "${BLUE}Service URLs:${NC}"
    echo -e "  Frontend: http://${DOMAIN}:3000"
    echo -e "  Backend API: http://${DOMAIN}:8080/api"
    echo -e "  Backend Health: http://${DOMAIN}:8080/actuator/health"
    echo -e "  API Documentation: http://${DOMAIN}:8080/swagger-ui.html"
    echo ""
}

# Main deployment flow
main() {
    if [ "$ROLLBACK" = "true" ]; then
        print_section "🔄 Rolling Back Deployment"
        if [ -f "docker-compose.backup.yml" ]; then
            docker-compose -f docker-compose.backup.yml --env-file "$ENV_FILE" up -d
            echo -e "${GREEN}✅ Rollback completed${NC}"
        else
            echo -e "${RED}❌ No backup found for rollback${NC}"
            exit 1
        fi
        return
    fi
    
    check_prerequisites
    backup_current_deployment
    pull_images
    run_migrations
    deploy_services
    run_health_checks
    run_smoke_tests
    cleanup_old_resources
    generate_deployment_report
}

# Run main function
main

echo -e "${GREEN}🎉 Deployment pipeline completed successfully!${NC}"