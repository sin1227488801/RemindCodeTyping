@echo off
echo Starting comprehensive test coverage analysis...

echo.
echo Step 1: Cleaning previous build artifacts...
call mvnw.cmd clean

echo.
echo Step 2: Compiling source code...
call mvnw.cmd compile -DskipTests

if %ERRORLEVEL% neq 0 (
    echo ERROR: Compilation failed. Please fix compilation errors before running tests.
    exit /b 1
)

echo.
echo Step 3: Running unit tests with coverage...
call mvnw.cmd test jacoco:report

if %ERRORLEVEL% neq 0 (
    echo ERROR: Tests failed. Please check test results.
    exit /b 1
)

echo.
echo Step 4: Generating coverage report...
call mvnw.cmd jacoco:check

echo.
echo Step 5: Opening coverage report...
if exist "target\site\jacoco\index.html" (
    start target\site\jacoco\index.html
    echo Coverage report opened in browser.
) else (
    echo Coverage report not found. Check build logs for errors.
)

echo.
echo Test coverage analysis complete!
echo Check target\site\jacoco\index.html for detailed coverage report.