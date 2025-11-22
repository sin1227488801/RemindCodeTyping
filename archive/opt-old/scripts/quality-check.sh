#!/bin/bash

# Quality Check Script for RCT Project
# This script runs all quality checks for both backend and frontend

set -e

echo "🔍 Starting comprehensive quality checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "rct-backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Backend Quality Checks
echo "🔧 Running backend quality checks..."

cd rct-backend

# Check if Maven wrapper exists
if [ ! -f "./mvnw" ]; then
    print_error "Maven wrapper not found. Please ensure mvnw exists and is executable."
    exit 1
fi

# Make mvnw executable (Unix/Linux/Mac)
chmod +x ./mvnw 2>/dev/null || true

print_status "Running Spotless format check..."
./mvnw spotless:check || {
    print_warning "Code formatting issues found. Run './mvnw spotless:apply' to fix them."
    exit 1
}

print_status "Running Checkstyle..."
./mvnw checkstyle:check || {
    print_error "Checkstyle violations found. Please fix them before proceeding."
    exit 1
}

print_status "Running PMD analysis..."
./mvnw pmd:check || {
    print_error "PMD violations found. Please fix them before proceeding."
    exit 1
}

print_status "Running backend unit tests..."
./mvnw test || {
    print_error "Backend unit tests failed."
    exit 1
}

print_status "Running backend integration tests..."
./mvnw verify -P integration-tests || {
    print_error "Backend integration tests failed."
    exit 1
}

cd ..

# Frontend Quality Checks
echo "🎨 Running frontend quality checks..."

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
fi

print_status "Running ESLint..."
npm run lint:check || {
    print_warning "ESLint issues found. Run 'npm run lint' to fix auto-fixable issues."
    exit 1
}

print_status "Running Prettier format check..."
npm run format:check || {
    print_warning "Code formatting issues found. Run 'npm run format' to fix them."
    exit 1
}

print_status "Running frontend tests..."
npm run test:ci || {
    print_error "Frontend tests failed."
    exit 1
}

# Summary
echo ""
echo "🎉 All quality checks passed successfully!"
echo ""
echo "📊 Summary:"
echo "  ✅ Backend code formatting (Spotless)"
echo "  ✅ Backend code style (Checkstyle)"
echo "  ✅ Backend code analysis (PMD)"
echo "  ✅ Backend unit tests"
echo "  ✅ Backend integration tests"
echo "  ✅ Frontend code linting (ESLint)"
echo "  ✅ Frontend code formatting (Prettier)"
echo "  ✅ Frontend unit tests"
echo ""
echo "🚀 Your code is ready for deployment!"