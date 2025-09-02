#!/bin/bash

echo "Starting comprehensive test coverage analysis..."

echo ""
echo "Step 1: Cleaning previous build artifacts..."
./mvnw clean

echo ""
echo "Step 2: Compiling source code..."
./mvnw compile -DskipTests

if [ $? -ne 0 ]; then
    echo "ERROR: Compilation failed. Please fix compilation errors before running tests."
    exit 1
fi

echo ""
echo "Step 3: Running unit tests with coverage..."
./mvnw test jacoco:report

if [ $? -ne 0 ]; then
    echo "ERROR: Tests failed. Please check test results."
    exit 1
fi

echo ""
echo "Step 4: Generating coverage report..."
./mvnw jacoco:check

echo ""
echo "Step 5: Opening coverage report..."
if [ -f "target/site/jacoco/index.html" ]; then
    if command -v xdg-open > /dev/null; then
        xdg-open target/site/jacoco/index.html
    elif command -v open > /dev/null; then
        open target/site/jacoco/index.html
    fi
    echo "Coverage report opened in browser."
else
    echo "Coverage report not found. Check build logs for errors."
fi

echo ""
echo "Test coverage analysis complete!"
echo "Check target/site/jacoco/index.html for detailed coverage report."