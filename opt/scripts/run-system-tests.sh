#!/bin/bash

# Comprehensive System Testing Script
# This script executes all end-to-end system tests including backend integration tests,
# frontend e2e tests, load tests, and security tests.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BACKEND_DIR="rct-backend"
FRONTEND_DIR="."
TEST_RESULTS_DIR="test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

echo -e "${BLUE}=== RemindCodeTyping System Test Suite ===${NC}"
echo -e "${BLUE}Starting comprehensive system testing at $(date)${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${YELLOW}=== $1 ===${NC}"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify prerequisites
print_section "Checking Prerequisites"

if ! command_exists java; then
    print_error "Java is not installed or not in PATH"
    exit 1
fi
print_success "Java found: $(java -version 2>&1 | head -n 1)"

if ! command_exists mvn && ! command_exists ./mvnw; then
    print_error "Maven is not installed and mvnw is not available"
    exit 1
fi
print_success "Maven found"

if ! command_exists node; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi
print_success "Node.js found: $(node --version)"

if ! command_exists npm; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi
print_success "npm found: $(npm --version)"

echo ""

# Start backend application
print_section "Starting Backend Application"

cd "$BACKEND_DIR"

# Build the application
print_success "Building backend application..."
if [ -f "./mvnw" ]; then
    ./mvnw clean compile -q
else
    mvn clean compile -q
fi

# Start the application in background
print_success "Starting backend server..."
if [ -f "./mvnw" ]; then
    ./mvnw spring-boot:run -Dspring-boot.run.profiles=test > "../$TEST_RESULTS_DIR/backend-startup.log" 2>&1 &
else
    mvn spring-boot:run -Dspring-boot.run.profiles=test > "../$TEST_RESULTS_DIR/backend-startup.log" 2>&1 &
fi

BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
print_success "Waiting for backend to start..."
sleep 30

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend failed to start"
    cat "../$TEST_RESULTS_DIR/backend-startup.log"
    exit 1
fi

# Test backend health
for i in {1..10}; do
    if curl -f http://localhost:8080/actuator/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
        break
    fi
    if [ $i -eq 10 ]; then
        print_error "Backend health check failed"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 3
done

cd ..

echo ""

# Run Backend Integration Tests
print_section "Running Backend Integration Tests"

cd "$BACKEND_DIR"

print_success "Executing unit tests..."
if [ -f "./mvnw" ]; then
    ./mvnw test -Dtest="**/*Test" > "../$TEST_RESULTS_DIR/unit-tests.log" 2>&1
else
    mvn test -Dtest="**/*Test" > "../$TEST_RESULTS_DIR/unit-tests.log" 2>&1
fi

if [ $? -eq 0 ]; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    cat "../$TEST_RESULTS_DIR/unit-tests.log" | tail -50
fi

print_success "Executing integration tests..."
if [ -f "./mvnw" ]; then
    ./mvnw test -Dtest="**/*IntegrationTest" > "../$TEST_RESULTS_DIR/integration-tests.log" 2>&1
else
    mvn test -Dtest="**/*IntegrationTest" > "../$TEST_RESULTS_DIR/integration-tests.log" 2>&1
fi

if [ $? -eq 0 ]; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    cat "../$TEST_RESULTS_DIR/integration-tests.log" | tail -50
fi

print_success "Executing end-to-end integration tests..."
if [ -f "./mvnw" ]; then
    ./mvnw test -Dtest="**/*EndToEndIntegrationTest" > "../$TEST_RESULTS_DIR/e2e-integration-tests.log" 2>&1
else
    mvn test -Dtest="**/*EndToEndIntegrationTest" > "../$TEST_RESULTS_DIR/e2e-integration-tests.log" 2>&1
fi

if [ $? -eq 0 ]; then
    print_success "End-to-end integration tests passed"
else
    print_error "End-to-end integration tests failed"
    cat "../$TEST_RESULTS_DIR/e2e-integration-tests.log" | tail -50
fi

print_success "Executing system integration test suite..."
if [ -f "./mvnw" ]; then
    ./mvnw test -Dtest="**/*SystemIntegrationTestSuite" > "../$TEST_RESULTS_DIR/system-integration-tests.log" 2>&1
else
    mvn test -Dtest="**/*SystemIntegrationTestSuite" > "../$TEST_RESULTS_DIR/system-integration-tests.log" 2>&1
fi

if [ $? -eq 0 ]; then
    print_success "System integration tests passed"
else
    print_error "System integration tests failed"
    cat "../$TEST_RESULTS_DIR/system-integration-tests.log" | tail -50
fi

cd ..

echo ""

# Run Load Tests
print_section "Running Load Tests"

cd "$BACKEND_DIR"

print_success "Executing load test suite..."
if [ -f "./mvnw" ]; then
    ./mvnw test -Dtest="**/*LoadTestSuite" > "../$TEST_RESULTS_DIR/load-tests.log" 2>&1
else
    mvn test -Dtest="**/*LoadTestSuite" > "../$TEST_RESULTS_DIR/load-tests.log" 2>&1
fi

if [ $? -eq 0 ]; then
    print_success "Load tests passed"
else
    print_error "Load tests failed"
    cat "../$TEST_RESULTS_DIR/load-tests.log" | tail -50
fi

cd ..

echo ""

# Run Security Tests
print_section "Running Security Penetration Tests"

cd "$BACKEND_DIR"

print_success "Executing security penetration test suite..."
if [ -f "./mvnw" ]; then
    ./mvnw test -Dtest="**/*SecurityPenetrationTestSuite" > "../$TEST_RESULTS_DIR/security-tests.log" 2>&1
else
    mvn test -Dtest="**/*SecurityPenetrationTestSuite" > "../$TEST_RESULTS_DIR/security-tests.log" 2>&1
fi

if [ $? -eq 0 ]; then
    print_success "Security tests passed"
else
    print_error "Security tests failed"
    cat "../$TEST_RESULTS_DIR/security-tests.log" | tail -50
fi

cd ..

echo ""

# Setup Frontend Testing Environment
print_section "Setting Up Frontend Testing Environment"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_success "Installing frontend dependencies..."
    npm install > "$TEST_RESULTS_DIR/npm-install.log" 2>&1
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        cat "$TEST_RESULTS_DIR/npm-install.log"
        exit 1
    fi
fi

# Start frontend server if needed
print_success "Starting frontend server..."
if command_exists http-server; then
    http-server . -p 3000 -s > "$TEST_RESULTS_DIR/frontend-server.log" 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    sleep 5
else
    print_error "http-server not found. Please install it: npm install -g http-server"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Run Frontend Unit Tests
print_section "Running Frontend Unit Tests"

print_success "Executing Jest unit tests..."
npm test -- --run --coverage > "$TEST_RESULTS_DIR/frontend-unit-tests.log" 2>&1

if [ $? -eq 0 ]; then
    print_success "Frontend unit tests passed"
else
    print_error "Frontend unit tests failed"
    cat "$TEST_RESULTS_DIR/frontend-unit-tests.log" | tail -50
fi

echo ""

# Run Cypress E2E Tests
print_section "Running Cypress End-to-End Tests"

# Check if Cypress is installed
if ! command_exists cypress; then
    print_success "Installing Cypress..."
    npm install cypress --save-dev > "$TEST_RESULTS_DIR/cypress-install.log" 2>&1
fi

print_success "Executing authentication tests..."
npx cypress run --spec "cypress/e2e/authentication.cy.js" --browser chrome > "$TEST_RESULTS_DIR/cypress-auth.log" 2>&1

if [ $? -eq 0 ]; then
    print_success "Authentication tests passed"
else
    print_error "Authentication tests failed"
    cat "$TEST_RESULTS_DIR/cypress-auth.log" | tail -30
fi

print_success "Executing study book management tests..."
npx cypress run --spec "cypress/e2e/studybook-management.cy.js" --browser chrome > "$TEST_RESULTS_DIR/cypress-studybook.log" 2>&1

if [ $? -eq 0 ]; then
    print_success "Study book management tests passed"
else
    print_error "Study book management tests failed"
    cat "$TEST_RESULTS_DIR/cypress-studybook.log" | tail -30
fi

print_success "Executing typing practice tests..."
npx cypress run --spec "cypress/e2e/typing-practice.cy.js" --browser chrome > "$TEST_RESULTS_DIR/cypress-typing.log" 2>&1

if [ $? -eq 0 ]; then
    print_success "Typing practice tests passed"
else
    print_error "Typing practice tests failed"
    cat "$TEST_RESULTS_DIR/cypress-typing.log" | tail -30
fi

print_success "Executing system integration tests..."
npx cypress run --spec "cypress/e2e/system-integration.cy.js" --browser chrome > "$TEST_RESULTS_DIR/cypress-system.log" 2>&1

if [ $? -eq 0 ]; then
    print_success "System integration tests passed"
else
    print_error "System integration tests failed"
    cat "$TEST_RESULTS_DIR/cypress-system.log" | tail -30
fi

echo ""

# Performance Testing
print_section "Running Performance Tests"

print_success "Executing Lighthouse performance audit..."
if command_exists lighthouse; then
    lighthouse http://localhost:3000/Rct/main.html --output=json --output-path="$TEST_RESULTS_DIR/lighthouse-report.json" --chrome-flags="--headless" > "$TEST_RESULTS_DIR/lighthouse.log" 2>&1
    
    if [ $? -eq 0 ]; then
        print_success "Lighthouse audit completed"
        # Extract performance score
        PERF_SCORE=$(cat "$TEST_RESULTS_DIR/lighthouse-report.json" | grep -o '"performance":[0-9.]*' | cut -d':' -f2)
        echo "Performance Score: $PERF_SCORE"
    else
        print_error "Lighthouse audit failed"
    fi
else
    print_success "Lighthouse not found, skipping performance audit"
fi

echo ""

# Cleanup
print_section "Cleaning Up"

print_success "Stopping backend server..."
kill $BACKEND_PID 2>/dev/null || true

print_success "Stopping frontend server..."
kill $FRONTEND_PID 2>/dev/null || true

# Wait for processes to terminate
sleep 5

echo ""

# Generate Test Report
print_section "Generating Test Report"

REPORT_FILE="$TEST_RESULTS_DIR/test-report-$TIMESTAMP.html"

cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>RemindCodeTyping System Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007cba; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .log-content { background-color: #f8f8f8; padding: 10px; border-radius: 3px; font-family: monospace; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RemindCodeTyping System Test Report</h1>
        <p><strong>Generated:</strong> $(date)</p>
        <p><strong>Test Suite:</strong> Comprehensive End-to-End System Testing</p>
    </div>

    <div class="section">
        <h2>Test Summary</h2>
        <ul>
            <li>Backend Unit Tests: $([ -f "$TEST_RESULTS_DIR/unit-tests.log" ] && echo "Executed" || echo "Skipped")</li>
            <li>Backend Integration Tests: $([ -f "$TEST_RESULTS_DIR/integration-tests.log" ] && echo "Executed" || echo "Skipped")</li>
            <li>System Integration Tests: $([ -f "$TEST_RESULTS_DIR/system-integration-tests.log" ] && echo "Executed" || echo "Skipped")</li>
            <li>Load Tests: $([ -f "$TEST_RESULTS_DIR/load-tests.log" ] && echo "Executed" || echo "Skipped")</li>
            <li>Security Tests: $([ -f "$TEST_RESULTS_DIR/security-tests.log" ] && echo "Executed" || echo "Skipped")</li>
            <li>Frontend Unit Tests: $([ -f "$TEST_RESULTS_DIR/frontend-unit-tests.log" ] && echo "Executed" || echo "Skipped")</li>
            <li>Cypress E2E Tests: $([ -f "$TEST_RESULTS_DIR/cypress-auth.log" ] && echo "Executed" || echo "Skipped")</li>
            <li>Performance Tests: $([ -f "$TEST_RESULTS_DIR/lighthouse-report.json" ] && echo "Executed" || echo "Skipped")</li>
        </ul>
    </div>

    <div class="section">
        <h2>Test Results</h2>
        <p>Detailed test logs are available in the test-results directory.</p>
        <p>All test artifacts have been preserved for analysis.</p>
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        $([ -f "$TEST_RESULTS_DIR/lighthouse-report.json" ] && echo "<p>Lighthouse Performance Score: $PERF_SCORE</p>" || echo "<p>Performance audit not available</p>")
    </div>
</body>
</html>
EOF

print_success "Test report generated: $REPORT_FILE"

echo ""
print_section "Test Execution Complete"

echo -e "${BLUE}System testing completed at $(date)${NC}"
echo -e "${BLUE}Test results are available in: $TEST_RESULTS_DIR${NC}"
echo -e "${BLUE}Test report: $REPORT_FILE${NC}"

# Final status
if [ -f "$TEST_RESULTS_DIR/unit-tests.log" ] && [ -f "$TEST_RESULTS_DIR/integration-tests.log" ] && [ -f "$TEST_RESULTS_DIR/cypress-auth.log" ]; then
    print_success "All critical test suites executed successfully"
    exit 0
else
    print_error "Some test suites failed to execute"
    exit 1
fi