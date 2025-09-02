#!/bin/bash

# Functional Tests Script for Production Deployment
# This script runs comprehensive functional tests against the deployed application

set -euo pipefail

# Configuration
ALB_DNS="${1:-localhost:8080}"
API_URL="https://$ALB_DNS/api"
TIMEOUT=30
MAX_RETRIES=3

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "PASS")
            echo -e "${GREEN}[PASS]${NC} $message"
            ((TESTS_PASSED++))
            ;;
        "FAIL")
            echo -e "${RED}[FAIL]${NC} $message"
            ((TESTS_FAILED++))
            FAILED_TESTS+=("$message")
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
    esac
}

# Function to make HTTP requests with retry logic
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    local headers="${4:-}"
    local expected_status="${5:-200}"
    
    local url="$API_URL$endpoint"
    local attempt=1
    
    while [[ $attempt -le $MAX_RETRIES ]]; do
        local response
        local status_code
        
        if [[ -n "$data" ]]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
                -H "Content-Type: application/json" \
                ${headers:+-H "$headers"} \
                -d "$data" \
                --connect-timeout $TIMEOUT \
                --max-time $TIMEOUT) || true
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
                ${headers:+-H "$headers"} \
                --connect-timeout $TIMEOUT \
                --max-time $TIMEOUT) || true
        fi
        
        if [[ -n "$response" ]]; then
            status_code=$(echo "$response" | tail -n1)
            local body=$(echo "$response" | head -n -1)
            
            if [[ "$status_code" == "$expected_status" ]]; then
                echo "$body"
                return 0
            fi
        fi
        
        log "WARN" "Request attempt $attempt failed (status: ${status_code:-unknown}), retrying..."
        ((attempt++))
        sleep 2
    done
    
    return 1
}

# Test 1: Health Check
test_health_check() {
    log "INFO" "Testing health check endpoint..."
    
    local response
    if response=$(make_request "GET" "/actuator/health"); then
        if echo "$response" | jq -e '.status == "UP"' > /dev/null 2>&1; then
            log "PASS" "Health check endpoint is healthy"
        else
            log "FAIL" "Health check endpoint returned unhealthy status"
        fi
    else
        log "FAIL" "Health check endpoint is not accessible"
    fi
}

# Test 2: Database Health Check
test_database_health() {
    log "INFO" "Testing database health..."
    
    local response
    if response=$(make_request "GET" "/actuator/health/db"); then
        if echo "$response" | jq -e '.status == "UP"' > /dev/null 2>&1; then
            log "PASS" "Database health check passed"
        else
            log "FAIL" "Database health check failed"
        fi
    else
        log "FAIL" "Database health endpoint is not accessible"
    fi
}

# Test 3: Cache Health Check
test_cache_health() {
    log "INFO" "Testing cache health..."
    
    local response
    if response=$(make_request "GET" "/actuator/health/redis"); then
        if echo "$response" | jq -e '.status == "UP"' > /dev/null 2>&1; then
            log "PASS" "Cache health check passed"
        else
            log "FAIL" "Cache health check failed"
        fi
    else
        log "FAIL" "Cache health endpoint is not accessible"
    fi
}

# Test 4: User Registration
test_user_registration() {
    log "INFO" "Testing user registration..."
    
    local test_user="functest_$(date +%s)"
    local test_password="FuncTest123!"
    local registration_data="{\"loginId\":\"$test_user\",\"password\":\"$test_password\"}"
    
    local response
    if response=$(make_request "POST" "/auth/register" "$registration_data" "" "201"); then
        if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
            log "PASS" "User registration successful"
            echo "$test_user:$test_password" # Return credentials for other tests
        else
            log "FAIL" "User registration returned unexpected response"
        fi
    else
        log "FAIL" "User registration failed"
    fi
}

# Test 5: User Authentication
test_user_authentication() {
    log "INFO" "Testing user authentication..."
    
    local credentials="$1"
    if [[ -z "$credentials" ]]; then
        log "FAIL" "No credentials provided for authentication test"
        return 1
    fi
    
    local test_user=$(echo "$credentials" | cut -d: -f1)
    local test_password=$(echo "$credentials" | cut -d: -f2)
    local auth_data="{\"loginId\":\"$test_user\",\"password\":\"$test_password\"}"
    
    local response
    if response=$(make_request "POST" "/auth/login" "$auth_data"); then
        local token=$(echo "$response" | jq -r '.token // empty')
        if [[ -n "$token" && "$token" != "null" ]]; then
            log "PASS" "User authentication successful"
            echo "$token" # Return token for other tests
        else
            log "FAIL" "Authentication did not return valid token"
        fi
    else
        log "FAIL" "User authentication failed"
    fi
}

# Test 6: Study Book Creation
test_study_book_creation() {
    log "INFO" "Testing study book creation..."
    
    local token="$1"
    if [[ -z "$token" ]]; then
        log "FAIL" "No authentication token provided for study book creation test"
        return 1
    fi
    
    local study_book_data='{
        "language": "JavaScript",
        "question": "console.log(\"Hello, World!\");",
        "explanation": "This is a basic console.log statement in JavaScript"
    }'
    
    local response
    if response=$(make_request "POST" "/studybooks" "$study_book_data" "Authorization: Bearer $token" "201"); then
        local study_book_id=$(echo "$response" | jq -r '.id // empty')
        if [[ -n "$study_book_id" && "$study_book_id" != "null" ]]; then
            log "PASS" "Study book creation successful"
            echo "$study_book_id" # Return ID for other tests
        else
            log "FAIL" "Study book creation did not return valid ID"
        fi
    else
        log "FAIL" "Study book creation failed"
    fi
}

# Test 7: Study Book Retrieval
test_study_book_retrieval() {
    log "INFO" "Testing study book retrieval..."
    
    local token="$1"
    local study_book_id="$2"
    
    if [[ -z "$token" ]]; then
        log "FAIL" "No authentication token provided for study book retrieval test"
        return 1
    fi
    
    local response
    if response=$(make_request "GET" "/studybooks" "" "Authorization: Bearer $token"); then
        if echo "$response" | jq -e '.content | length > 0' > /dev/null 2>&1; then
            log "PASS" "Study book retrieval successful"
        else
            log "FAIL" "Study book retrieval returned empty results"
        fi
    else
        log "FAIL" "Study book retrieval failed"
    fi
}

# Test 8: Typing Session Recording
test_typing_session_recording() {
    log "INFO" "Testing typing session recording..."
    
    local token="$1"
    local study_book_id="$2"
    
    if [[ -z "$token" || -z "$study_book_id" ]]; then
        log "FAIL" "Missing token or study book ID for typing session test"
        return 1
    fi
    
    local session_data="{
        \"studyBookId\": \"$study_book_id\",
        \"typedText\": \"console.log(\\\"Hello, World!\\\");\",
        \"targetText\": \"console.log(\\\"Hello, World!\\\");\",
        \"totalCharacters\": 32,
        \"correctCharacters\": 32,
        \"durationMs\": 5000
    }"
    
    local response
    if response=$(make_request "POST" "/typing/results" "$session_data" "Authorization: Bearer $token" "201"); then
        if echo "$response" | jq -e '.success == true or .id != null' > /dev/null 2>&1; then
            log "PASS" "Typing session recording successful"
        else
            log "FAIL" "Typing session recording returned unexpected response"
        fi
    else
        log "FAIL" "Typing session recording failed"
    fi
}

# Test 9: User Statistics Retrieval
test_user_statistics() {
    log "INFO" "Testing user statistics retrieval..."
    
    local token="$1"
    if [[ -z "$token" ]]; then
        log "FAIL" "No authentication token provided for statistics test"
        return 1
    fi
    
    local response
    if response=$(make_request "GET" "/typing/statistics" "" "Authorization: Bearer $token"); then
        if echo "$response" | jq -e 'type == "object"' > /dev/null 2>&1; then
            log "PASS" "User statistics retrieval successful"
        else
            log "FAIL" "User statistics retrieval returned invalid response"
        fi
    else
        log "FAIL" "User statistics retrieval failed"
    fi
}

# Test 10: Invalid Authentication
test_invalid_authentication() {
    log "INFO" "Testing invalid authentication handling..."
    
    local invalid_auth_data='{"loginId":"invalid_user","password":"invalid_password"}'
    
    local response
    if response=$(make_request "POST" "/auth/login" "$invalid_auth_data" "" "401"); then
        log "PASS" "Invalid authentication properly rejected"
    else
        log "FAIL" "Invalid authentication not properly handled"
    fi
}

# Test 11: Unauthorized Access
test_unauthorized_access() {
    log "INFO" "Testing unauthorized access protection..."
    
    local response
    if response=$(make_request "GET" "/studybooks" "" "" "401"); then
        log "PASS" "Unauthorized access properly blocked"
    else
        log "FAIL" "Unauthorized access not properly blocked"
    fi
}

# Test 12: Input Validation
test_input_validation() {
    log "INFO" "Testing input validation..."
    
    local invalid_registration_data='{"loginId":"","password":"123"}'
    
    local response
    if response=$(make_request "POST" "/auth/register" "$invalid_registration_data" "" "400"); then
        log "PASS" "Input validation working correctly"
    else
        log "FAIL" "Input validation not working properly"
    fi
}

# Test 13: Performance Test
test_performance() {
    log "INFO" "Testing response time performance..."
    
    local start_time=$(date +%s.%N)
    local response
    if response=$(make_request "GET" "/actuator/health"); then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        
        if (( $(echo "$duration < 2.0" | bc -l) )); then
            log "PASS" "Response time within acceptable limits (${duration}s)"
        else
            log "FAIL" "Response time too slow (${duration}s)"
        fi
    else
        log "FAIL" "Performance test failed - endpoint not accessible"
    fi
}

# Test 14: Concurrent Request Handling
test_concurrent_requests() {
    log "INFO" "Testing concurrent request handling..."
    
    local pids=()
    local results_file="/tmp/concurrent_test_results"
    rm -f "$results_file"
    
    # Start 5 concurrent requests
    for i in {1..5}; do
        (
            if make_request "GET" "/actuator/health" > /dev/null 2>&1; then
                echo "success" >> "$results_file"
            else
                echo "failure" >> "$results_file"
            fi
        ) &
        pids+=($!)
    done
    
    # Wait for all requests to complete
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    local success_count=$(grep -c "success" "$results_file" 2>/dev/null || echo "0")
    local total_count=$(wc -l < "$results_file" 2>/dev/null || echo "0")
    
    if [[ "$success_count" -eq 5 ]]; then
        log "PASS" "Concurrent request handling successful ($success_count/$total_count)"
    else
        log "FAIL" "Concurrent request handling failed ($success_count/$total_count)"
    fi
    
    rm -f "$results_file"
}

# Main test execution
main() {
    log "INFO" "Starting functional tests against $ALB_DNS"
    log "INFO" "API URL: $API_URL"
    
    # Basic health checks
    test_health_check
    test_database_health
    test_cache_health
    
    # User workflow tests
    local credentials
    credentials=$(test_user_registration)
    
    if [[ -n "$credentials" ]]; then
        local token
        token=$(test_user_authentication "$credentials")
        
        if [[ -n "$token" ]]; then
            local study_book_id
            study_book_id=$(test_study_book_creation "$token")
            
            test_study_book_retrieval "$token" "$study_book_id"
            
            if [[ -n "$study_book_id" ]]; then
                test_typing_session_recording "$token" "$study_book_id"
            fi
            
            test_user_statistics "$token"
        fi
    fi
    
    # Security tests
    test_invalid_authentication
    test_unauthorized_access
    test_input_validation
    
    # Performance tests
    test_performance
    test_concurrent_requests
    
    # Test summary
    log "INFO" "Functional test summary:"
    log "INFO" "Tests passed: $TESTS_PASSED"
    log "INFO" "Tests failed: $TESTS_FAILED"
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log "FAIL" "Failed tests:"
        for failed_test in "${FAILED_TESTS[@]}"; do
            log "FAIL" "  - $failed_test"
        done
        exit 1
    else
        log "PASS" "All functional tests passed successfully!"
        exit 0
    fi
}

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    echo "Warning: bc is not installed, performance tests may not work properly"
fi

# Run main function
main "$@"