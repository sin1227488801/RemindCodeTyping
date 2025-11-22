#!/bin/bash

# Comprehensive Build Script for RemindCodeTyping Project
# This script handles both frontend and backend builds with quality checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_MODE=${1:-production}
SKIP_TESTS=${2:-false}
SKIP_QUALITY=${3:-false}
DOCKER_BUILD=${4:-false}

echo -e "${BLUE}🚀 Starting RemindCodeTyping Build Pipeline${NC}"
echo -e "${BLUE}Build Mode: ${BUILD_MODE}${NC}"
echo -e "${BLUE}Skip Tests: ${SKIP_TESTS}${NC}"
echo -e "${BLUE}Skip Quality Checks: ${SKIP_QUALITY}${NC}"
echo -e "${BLUE}Docker Build: ${DOCKER_BUILD}${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Function to handle errors
handle_error() {
    echo -e "\n${RED}❌ Build failed at: $1${NC}"
    exit 1
}

# Check prerequisites
print_section "📋 Checking Prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
    handle_error "Node.js is not installed"
fi
echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    handle_error "npm is not installed"
fi
echo -e "${GREEN}✅ npm version: $(npm --version)${NC}"

# Check Java
if ! command -v java &> /dev/null; then
    handle_error "Java is not installed"
fi
echo -e "${GREEN}✅ Java version: $(java --version | head -n 1)${NC}"

# Check Maven
cd rct-backend
if [ ! -f "./mvnw" ]; then
    handle_error "Maven wrapper not found"
fi
echo -e "${GREEN}✅ Maven wrapper found${NC}"
cd ..

# Check Docker (if needed)
if [ "$DOCKER_BUILD" = "true" ]; then
    if ! command -v docker &> /dev/null; then
        handle_error "Docker is not installed but Docker build was requested"
    fi
    echo -e "${GREEN}✅ Docker version: $(docker --version)${NC}"
fi

# Clean previous builds
print_section "🧹 Cleaning Previous Builds"
npm run clean || handle_error "Frontend clean failed"
cd rct-backend
./mvnw clean || handle_error "Backend clean failed"
cd ..
echo -e "${GREEN}✅ Clean completed${NC}"

# Install dependencies
print_section "📦 Installing Dependencies"

# Frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm ci || handle_error "Frontend dependency installation failed"
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Backend dependencies (download)
echo -e "${YELLOW}Downloading backend dependencies...${NC}"
cd rct-backend
./mvnw dependency:go-offline -B || handle_error "Backend dependency download failed"
cd ..
echo -e "${GREEN}✅ Backend dependencies downloaded${NC}"

# Security checks
if [ "$SKIP_QUALITY" != "true" ]; then
    print_section "🔒 Security Checks"
    
    # Frontend security audit
    echo -e "${YELLOW}Running frontend security audit...${NC}"
    npm run security:audit || handle_error "Frontend security audit failed"
    echo -e "${GREEN}✅ Frontend security audit passed${NC}"
    
    # Backend dependency vulnerability check
    echo -e "${YELLOW}Running backend dependency vulnerability check...${NC}"
    cd rct-backend
    ./mvnw org.owasp:dependency-check-maven:check -P security-scan || handle_error "Backend security scan failed"
    cd ..
    echo -e "${GREEN}✅ Backend security scan passed${NC}"
fi

# Quality checks
if [ "$SKIP_QUALITY" != "true" ]; then
    print_section "🔍 Quality Checks"
    
    # Frontend quality checks
    echo -e "${YELLOW}Running frontend quality checks...${NC}"
    npm run quality:check || handle_error "Frontend quality checks failed"
    echo -e "${GREEN}✅ Frontend quality checks passed${NC}"
    
    # Backend quality checks
    echo -e "${YELLOW}Running backend quality checks...${NC}"
    cd rct-backend
    ./mvnw spotless:check checkstyle:check pmd:check || handle_error "Backend quality checks failed"
    cd ..
    echo -e "${GREEN}✅ Backend quality checks passed${NC}"
fi

# Run tests
if [ "$SKIP_TESTS" != "true" ]; then
    print_section "🧪 Running Tests"
    
    # Frontend tests
    echo -e "${YELLOW}Running frontend tests...${NC}"
    npm run test:ci || handle_error "Frontend tests failed"
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
    
    # Backend unit tests
    echo -e "${YELLOW}Running backend unit tests...${NC}"
    cd rct-backend
    ./mvnw test -P ci || handle_error "Backend unit tests failed"
    cd ..
    echo -e "${GREEN}✅ Backend unit tests passed${NC}"
    
    # Backend integration tests
    echo -e "${YELLOW}Running backend integration tests...${NC}"
    cd rct-backend
    ./mvnw verify -P integration-tests || handle_error "Backend integration tests failed"
    cd ..
    echo -e "${GREEN}✅ Backend integration tests passed${NC}"
fi

# Build applications
print_section "🏗️ Building Applications"

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
if [ "$BUILD_MODE" = "production" ]; then
    npm run build || handle_error "Frontend production build failed"
else
    npm run build:dev || handle_error "Frontend development build failed"
fi
echo -e "${GREEN}✅ Frontend build completed${NC}"

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
cd rct-backend
if [ "$BUILD_MODE" = "production" ]; then
    ./mvnw package -DskipTests -P production || handle_error "Backend production build failed"
else
    ./mvnw package -DskipTests || handle_error "Backend development build failed"
fi
cd ..
echo -e "${GREEN}✅ Backend build completed${NC}"

# Bundle size check
if [ "$BUILD_MODE" = "production" ] && [ "$SKIP_QUALITY" != "true" ]; then
    print_section "📊 Bundle Size Analysis"
    echo -e "${YELLOW}Checking bundle sizes...${NC}"
    npx bundlesize || handle_error "Bundle size check failed"
    echo -e "${GREEN}✅ Bundle size check passed${NC}"
fi

# Docker build
if [ "$DOCKER_BUILD" = "true" ]; then
    print_section "🐳 Building Docker Images"
    
    echo -e "${YELLOW}Building backend Docker image...${NC}"
    cd rct-backend
    docker build -t rct-backend:latest --target production . || handle_error "Backend Docker build failed"
    cd ..
    echo -e "${GREEN}✅ Backend Docker image built${NC}"
    
    # Create frontend Docker image (nginx-based)
    echo -e "${YELLOW}Building frontend Docker image...${NC}"
    docker build -f Dockerfile.frontend -t rct-frontend:latest . || handle_error "Frontend Docker build failed"
    echo -e "${GREEN}✅ Frontend Docker image built${NC}"
fi

# Generate build report
print_section "📋 Build Report"

BUILD_TIME=$(date)
FRONTEND_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "N/A")
BACKEND_SIZE=$(du -sh rct-backend/target/*.jar 2>/dev/null | cut -f1 || echo "N/A")

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${BLUE}Build Summary:${NC}"
echo -e "  Build Mode: ${BUILD_MODE}"
echo -e "  Build Time: ${BUILD_TIME}"
echo -e "  Frontend Size: ${FRONTEND_SIZE}"
echo -e "  Backend Size: ${BACKEND_SIZE}"
echo -e "  Tests: $([ "$SKIP_TESTS" = "true" ] && echo "Skipped" || echo "Passed")"
echo -e "  Quality Checks: $([ "$SKIP_QUALITY" = "true" ] && echo "Skipped" || echo "Passed")"
echo -e "  Docker Images: $([ "$DOCKER_BUILD" = "true" ] && echo "Built" || echo "Skipped")"
echo ""

# Artifacts location
echo -e "${BLUE}Build Artifacts:${NC}"
echo -e "  Frontend: ./dist/"
echo -e "  Backend: ./rct-backend/target/"
if [ "$DOCKER_BUILD" = "true" ]; then
    echo -e "  Docker Images: rct-backend:latest, rct-frontend:latest"
fi
echo ""

echo -e "${GREEN}🎉 Build pipeline completed successfully!${NC}"