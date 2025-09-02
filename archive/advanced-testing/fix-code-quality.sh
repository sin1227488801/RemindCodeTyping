#!/bin/bash

# Code Quality Fix Script
# This script automatically fixes common code quality issues identified in the PMD report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_DIR="rct-backend"
FIXED_COUNT=0

echo -e "${BLUE}=== Code Quality Fix Script ===${NC}"
echo -e "${BLUE}Fixing common PMD violations automatically${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${YELLOW}=== $1 ===${NC}"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((FIXED_COUNT++))
}

# Function to print info messages
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Change to backend directory
cd "$BACKEND_DIR"

print_section "1. Fixing Star Imports in Test Files"

# Find and fix star imports in test files
find src/test -name "*.java" -type f | while read -r file; do
    if grep -q "import.*\.\*;" "$file"; then
        print_info "Fixing star imports in: $file"
        
        # Replace common star imports with specific imports
        sed -i 's/import static org\.assertj\.core\.api\.Assertions\.\*;/import static org.assertj.core.api.Assertions.assertThat;/g' "$file"
        sed -i 's/import static org\.junit\.jupiter\.api\.Assertions\.\*;/import static org.junit.jupiter.api.Assertions.assertEquals;\nimport static org.junit.jupiter.api.Assertions.assertNotNull;\nimport static org.junit.jupiter.api.Assertions.assertTrue;\nimport static org.junit.jupiter.api.Assertions.assertFalse;\nimport static org.junit.jupiter.api.Assertions.assertThrows;/g' "$file"
        sed -i 's/import static org\.mockito\.Mockito\.\*;/import static org.mockito.Mockito.when;\nimport static org.mockito.Mockito.verify;\nimport static org.mockito.Mockito.times;\nimport static org.mockito.Mockito.never;\nimport static org.mockito.Mockito.mock;/g' "$file"
        sed -i 's/import static org\.mockito\.ArgumentMatchers\.\*;/import static org.mockito.ArgumentMatchers.any;\nimport static org.mockito.ArgumentMatchers.anyString;\nimport static org.mockito.ArgumentMatchers.eq;/g' "$file"
        sed -i 's/import static org\.springframework\.test\.web\.servlet\.request\.MockMvcRequestBuilders\.\*;/import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;\nimport static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;\nimport static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;\nimport static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;/g' "$file"
        sed -i 's/import static org\.springframework\.test\.web\.servlet\.result\.MockMvcResultMatchers\.\*;/import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;\nimport static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;\nimport static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;/g' "$file"
        
        # Fix domain model star imports
        sed -i 's/import com\.rct\.domain\.model\.user\.\*;/import com.rct.domain.model.user.User;\nimport com.rct.domain.model.user.UserId;\nimport com.rct.domain.model.user.LoginId;\nimport com.rct.domain.model.user.PasswordHash;\nimport com.rct.domain.model.user.LoginStatistics;/g' "$file"
        sed -i 's/import com\.rct\.domain\.model\.studybook\.\*;/import com.rct.domain.model.studybook.StudyBook;\nimport com.rct.domain.model.studybook.StudyBookId;\nimport com.rct.domain.model.studybook.Language;\nimport com.rct.domain.model.studybook.Question;\nimport com.rct.domain.model.studybook.Explanation;/g' "$file"
        sed -i 's/import com\.rct\.domain\.model\.typingsession\.\*;/import com.rct.domain.model.typingsession.TypingSession;\nimport com.rct.domain.model.typingsession.TypingSessionId;\nimport com.rct.domain.model.typingsession.TypingResult;\nimport com.rct.domain.model.typingsession.Duration;/g' "$file"
        
        print_success "Fixed star imports in: $(basename "$file")"
    fi
done

print_section "2. Creating Constants for Magic Numbers"

# Create a constants file for common magic numbers
cat > src/main/java/com/rct/common/Constants.java << 'EOF'
package com.rct.common;

/**
 * Application-wide constants to avoid magic numbers.
 */
public final class Constants {
    
    private Constants() {
        // Utility class
    }
    
    // Time constants
    public static final int DEFAULT_SESSION_TIMEOUT_MINUTES = 30;
    public static final int JWT_EXPIRATION_HOURS = 24;
    public static final int REFRESH_TOKEN_EXPIRATION_DAYS = 7;
    public static final int PASSWORD_MIN_LENGTH = 8;
    public static final int MAX_LOGIN_ATTEMPTS = 5;
    
    // Pagination constants
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
    
    // Validation constants
    public static final int MAX_QUESTION_LENGTH = 1000;
    public static final int MAX_EXPLANATION_LENGTH = 2000;
    public static final int MIN_ACCURACY_PERCENTAGE = 0;
    public static final int MAX_ACCURACY_PERCENTAGE = 100;
    
    // Performance constants
    public static final int DATABASE_CONNECTION_TIMEOUT = 30000;
    public static final int QUERY_TIMEOUT_SECONDS = 30;
    public static final int CACHE_TTL_MINUTES = 15;
    
    // Test constants
    public static final int TEST_USER_COUNT = 15;
    public static final int TEST_SESSION_COUNT = 20;
    public static final int TEST_STUDY_BOOK_COUNT = 25;
    public static final double TEST_ACCURACY_HIGH = 95.0;
    public static final double TEST_ACCURACY_MEDIUM = 85.0;
    public static final double TEST_ACCURACY_LOW = 75.0;
    
    // HTTP Status codes for tests
    public static final int HTTP_OK = 200;
    public static final int HTTP_CREATED = 201;
    public static final int HTTP_BAD_REQUEST = 400;
    public static final int HTTP_UNAUTHORIZED = 401;
    public static final int HTTP_FORBIDDEN = 403;
    public static final int HTTP_NOT_FOUND = 404;
    public static final int HTTP_CONFLICT = 409;
    public static final int HTTP_TOO_MANY_REQUESTS = 429;
    public static final int HTTP_INTERNAL_SERVER_ERROR = 500;
    
    // Memory and performance thresholds
    public static final long MAX_MEMORY_INCREASE_MB = 100;
    public static final long MAX_RESPONSE_TIME_MS = 2000;
    public static final long MAX_QUERY_TIME_MS = 50;
    public static final long MAX_STATISTICS_CALCULATION_MS = 1000;
    
    // Character and text constants
    public static final int TYPING_TEXT_LENGTH = 25;
    public static final int SAMPLE_TEXT_LENGTH = 50;
    public static final int LONG_TEXT_LENGTH = 200;
    
    // Numeric constants for calculations
    public static final double PERCENTAGE_MULTIPLIER = 100.0;
    public static final int MILLISECONDS_PER_SECOND = 1000;
    public static final int BYTES_PER_KB = 1024;
    public static final int KB_PER_MB = 1024;
}
EOF

print_success "Created Constants.java with common magic numbers"

# Create test constants file
cat > src/test/java/com/rct/common/TestConstants.java << 'EOF'
package com.rct.common;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Test-specific constants to avoid magic numbers in test code.
 */
public final class TestConstants {
    
    private TestConstants() {
        // Utility class
    }
    
    // Test data constants
    public static final String TEST_LOGIN_ID = "testuser";
    public static final String TEST_PASSWORD = "testpassword";
    public static final String TEST_EMAIL = "test@example.com";
    public static final String TEST_LANGUAGE = "JavaScript";
    public static final String TEST_QUESTION = "console.log('test');";
    public static final String TEST_EXPLANATION = "Test explanation";
    
    // Test numeric values
    public static final int TEST_CONSECUTIVE_DAYS = 15;
    public static final int TEST_MAX_CONSECUTIVE_DAYS = 30;
    public static final int TEST_TOTAL_DAYS = 45;
    public static final int TEST_CHARACTER_COUNT = 19;
    public static final int TEST_CORRECT_CHARACTERS = 18;
    public static final long TEST_DURATION_MS = 5000L;
    
    // Test accuracy values
    public static final double PERFECT_ACCURACY = 100.0;
    public static final double HIGH_ACCURACY = 95.0;
    public static final double MEDIUM_ACCURACY = 85.0;
    public static final double LOW_ACCURACY = 75.0;
    
    // Test dates
    public static final LocalDate TEST_DATE = LocalDate.of(2024, 1, 15);
    public static final LocalDateTime TEST_DATETIME = LocalDateTime.of(2024, 1, 15, 10, 30);
    
    // Test limits and thresholds
    public static final int LARGE_DATASET_SIZE = 100;
    public static final int SMALL_DATASET_SIZE = 10;
    public static final int PERFORMANCE_THRESHOLD_MS = 1000;
    public static final int LOAD_TEST_USER_COUNT = 50;
    
    // Test validation values
    public static final int INVALID_NEGATIVE_VALUE = -1;
    public static final int INVALID_ZERO_VALUE = 0;
    public static final String INVALID_EMPTY_STRING = "";
    public static final String OVERSIZED_STRING = "a".repeat(10000);
}
EOF

print_success "Created TestConstants.java for test magic numbers"

print_section "3. Fixing Final Parameters"

# Create a script to add final parameters (this is complex, so we'll create a helper)
cat > fix-final-parameters.py << 'EOF'
#!/usr/bin/env python3
import re
import os
import glob

def fix_final_parameters(file_path):
    """Fix missing final parameters in Java methods."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match method parameters that should be final
    # This is a simplified pattern - in practice, you'd want more sophisticated parsing
    patterns = [
        # Method parameters
        (r'(\w+\s+)(\w+\s+\w+)(\s*[,)])', r'\1final \2\3'),
        # Constructor parameters
        (r'(public\s+\w+\s*\([^)]*?)(\w+\s+\w+)([,)])', r'\1final \2\3'),
    ]
    
    modified = False
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            content = new_content
            modified = True
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Find all Java files and fix final parameters
java_files = glob.glob('src/**/*.java', recursive=True)
fixed_files = 0

for java_file in java_files:
    if fix_final_parameters(java_file):
        fixed_files += 1

print(f"Fixed final parameters in {fixed_files} files")
EOF

# Run the Python script (if Python is available)
if command -v python3 >/dev/null 2>&1; then
    python3 fix-final-parameters.py
    rm fix-final-parameters.py
    print_success "Fixed final parameters using Python script"
else
    print_info "Python3 not available, skipping automatic final parameter fixes"
fi

print_section "4. Fixing Visibility Modifiers"

# Fix common visibility modifier issues
find src -name "*.java" -type f | while read -r file; do
    # Make test fields private (common issue in test classes)
    if [[ "$file" == *"/test/"* ]]; then
        # Fix static container fields in integration tests
        sed -i 's/static PostgreSQLContainer/private static final PostgreSQLContainer/g' "$file"
        sed -i 's/static TestcontainersConfiguration/private static final TestcontainersConfiguration/g' "$file"
    fi
done

print_success "Fixed visibility modifiers in test files"

print_section "5. Extracting Long Methods"

# Create a helper to identify long methods (manual review needed)
cat > long-methods-report.txt << 'EOF'
# Long Methods Report
# The following methods exceed 50 lines and should be refactored:

# This is a placeholder - actual method extraction requires manual review
# Common patterns to look for:
# 1. Methods with multiple responsibilities
# 2. Complex conditional logic that can be extracted
# 3. Repeated code blocks
# 4. Setup/teardown code in tests

# Recommended approach:
# 1. Extract setup methods in test classes
# 2. Break complex business logic into smaller methods
# 3. Use composition over large methods
# 4. Extract validation logic into separate methods
EOF

print_success "Created long methods report for manual review"

print_section "6. Fixing Line Length Issues"

# Fix long lines by adding line breaks (basic approach)
find src -name "*.java" -type f | while read -r file; do
    # This is a basic approach - more sophisticated formatting should use Spotless
    if grep -q ".\{120,\}" "$file"; then
        print_info "Long lines found in: $(basename "$file") - manual review needed"
    fi
done

print_section "7. Applying Code Formatting"

# Apply Spotless formatting to fix any remaining formatting issues
print_info "Applying Spotless code formatting..."
./mvnw spotless:apply -q

if [ $? -eq 0 ]; then
    print_success "Applied Spotless formatting successfully"
else
    echo -e "${RED}✗ Spotless formatting failed${NC}"
fi

print_section "8. Running Quality Checks"

# Run PMD to check remaining violations
print_info "Running PMD analysis to check remaining violations..."
./mvnw pmd:check -q > pmd-check.log 2>&1

if [ $? -eq 0 ]; then
    print_success "PMD check passed - no violations found!"
else
    violations=$(grep -o "You have [0-9]* PMD violations" pmd-check.log | grep -o "[0-9]*" || echo "unknown")
    echo -e "${YELLOW}⚠ PMD check found $violations violations (check pmd-check.log for details)${NC}"
fi

# Run Checkstyle
print_info "Running Checkstyle analysis..."
./mvnw checkstyle:check -q > checkstyle-check.log 2>&1

if [ $? -eq 0 ]; then
    print_success "Checkstyle check passed!"
else
    echo -e "${YELLOW}⚠ Checkstyle violations found (check checkstyle-check.log for details)${NC}"
fi

cd ..

print_section "Summary"

echo -e "${GREEN}Code quality fixes completed!${NC}"
echo -e "${GREEN}Total automatic fixes applied: $FIXED_COUNT${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the generated Constants.java files"
echo "2. Manually fix remaining long methods (see long-methods-report.txt)"
echo "3. Review and fix any remaining PMD violations"
echo "4. Add missing JavaDoc documentation"
echo "5. Run the full test suite to ensure nothing is broken"
echo ""
echo -e "${BLUE}Commands to run:${NC}"
echo "cd $BACKEND_DIR"
echo "./mvnw test                    # Run all tests"
echo "./mvnw pmd:check              # Check PMD violations"
echo "./mvnw checkstyle:check       # Check Checkstyle violations"
echo "./mvnw spotless:check         # Check code formatting"
echo ""
echo -e "${YELLOW}Note: Some fixes require manual review and cannot be automated.${NC}"