@echo off
REM Comprehensive System Testing Script for Windows
REM This script executes all end-to-end system tests including backend integration tests,
REM frontend e2e tests, load tests, and security tests.

setlocal enabledelayedexpansion

REM Test configuration
set BACKEND_DIR=rct-backend
set FRONTEND_DIR=.
set TEST_RESULTS_DIR=test-results
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM Create test results directory
if not exist "%TEST_RESULTS_DIR%" mkdir "%TEST_RESULTS_DIR%"

echo === RemindCodeTyping System Test Suite ===
echo Starting comprehensive system testing at %date% %time%
echo.

REM Function to check if command exists
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    exit /b 1
)
echo SUCCESS: Java found

where mvn >nul 2>&1
if %errorlevel% neq 0 (
    if not exist "%BACKEND_DIR%\mvnw.cmd" (
        echo ERROR: Maven is not installed and mvnw.cmd is not available
        exit /b 1
    )
)
echo SUCCESS: Maven found

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    exit /b 1
)
echo SUCCESS: Node.js found

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    exit /b 1
)
echo SUCCESS: npm found

echo.

REM Start backend application
echo === Starting Backend Application ===

cd "%BACKEND_DIR%"

REM Build the application
echo Building backend application...
if exist "mvnw.cmd" (
    call mvnw.cmd clean compile -q
) else (
    call mvn clean compile -q
)

if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    cd ..
    exit /b 1
)

REM Start the application in background
echo Starting backend server...
if exist "mvnw.cmd" (
    start /b cmd /c "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=test > ..\%TEST_RESULTS_DIR%\backend-startup.log 2>&1"
) else (
    start /b cmd /c "mvn spring-boot:run -Dspring-boot.run.profiles=test > ..\%TEST_RESULTS_DIR%\backend-startup.log 2>&1"
)

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 30 /nobreak >nul

REM Test backend health
set BACKEND_HEALTHY=0
for /l %%i in (1,1,10) do (
    curl -f http://localhost:8080/actuator/health >nul 2>&1
    if !errorlevel! equ 0 (
        echo SUCCESS: Backend is healthy
        set BACKEND_HEALTHY=1
        goto :backend_ready
    )
    timeout /t 3 /nobreak >nul
)

:backend_ready
if %BACKEND_HEALTHY% equ 0 (
    echo ERROR: Backend health check failed
    cd ..
    exit /b 1
)

cd ..

echo.

REM Run Backend Integration Tests
echo === Running Backend Integration Tests ===

cd "%BACKEND_DIR%"

echo Executing unit tests...
if exist "mvnw.cmd" (
    call mvnw.cmd test -Dtest="**/*Test" > "..\%TEST_RESULTS_DIR%\unit-tests.log" 2>&1
) else (
    call mvn test -Dtest="**/*Test" > "..\%TEST_RESULTS_DIR%\unit-tests.log" 2>&1
)

if %errorlevel% equ 0 (
    echo SUCCESS: Unit tests passed
) else (
    echo ERROR: Unit tests failed
)

echo Executing integration tests...
if exist "mvnw.cmd" (
    call mvnw.cmd test -Dtest="**/*IntegrationTest" > "..\%TEST_RESULTS_DIR%\integration-tests.log" 2>&1
) else (
    call mvn test -Dtest="**/*IntegrationTest" > "..\%TEST_RESULTS_DIR%\integration-tests.log" 2>&1
)

if %errorlevel% equ 0 (
    echo SUCCESS: Integration tests passed
) else (
    echo ERROR: Integration tests failed
)

echo Executing end-to-end integration tests...
if exist "mvnw.cmd" (
    call mvnw.cmd test -Dtest="**/*EndToEndIntegrationTest" > "..\%TEST_RESULTS_DIR%\e2e-integration-tests.log" 2>&1
) else (
    call mvn test -Dtest="**/*EndToEndIntegrationTest" > "..\%TEST_RESULTS_DIR%\e2e-integration-tests.log" 2>&1
)

if %errorlevel% equ 0 (
    echo SUCCESS: End-to-end integration tests passed
) else (
    echo ERROR: End-to-end integration tests failed
)

echo Executing system integration test suite...
if exist "mvnw.cmd" (
    call mvnw.cmd test -Dtest="**/*SystemIntegrationTestSuite" > "..\%TEST_RESULTS_DIR%\system-integration-tests.log" 2>&1
) else (
    call mvn test -Dtest="**/*SystemIntegrationTestSuite" > "..\%TEST_RESULTS_DIR%\system-integration-tests.log" 2>&1
)

if %errorlevel% equ 0 (
    echo SUCCESS: System integration tests passed
) else (
    echo ERROR: System integration tests failed
)

cd ..

echo.

REM Run Load Tests
echo === Running Load Tests ===

cd "%BACKEND_DIR%"

echo Executing load test suite...
if exist "mvnw.cmd" (
    call mvnw.cmd test -Dtest="**/*LoadTestSuite" > "..\%TEST_RESULTS_DIR%\load-tests.log" 2>&1
) else (
    call mvn test -Dtest="**/*LoadTestSuite" > "..\%TEST_RESULTS_DIR%\load-tests.log" 2>&1
)

if %errorlevel% equ 0 (
    echo SUCCESS: Load tests passed
) else (
    echo ERROR: Load tests failed
)

cd ..

echo.

REM Run Security Tests
echo === Running Security Penetration Tests ===

cd "%BACKEND_DIR%"

echo Executing security penetration test suite...
if exist "mvnw.cmd" (
    call mvnw.cmd test -Dtest="**/*SecurityPenetrationTestSuite" > "..\%TEST_RESULTS_DIR%\security-tests.log" 2>&1
) else (
    call mvn test -Dtest="**/*SecurityPenetrationTestSuite" > "..\%TEST_RESULTS_DIR%\security-tests.log" 2>&1
)

if %errorlevel% equ 0 (
    echo SUCCESS: Security tests passed
) else (
    echo ERROR: Security tests failed
)

cd ..

echo.

REM Setup Frontend Testing Environment
echo === Setting Up Frontend Testing Environment ===

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install > "%TEST_RESULTS_DIR%\npm-install.log" 2>&1
    if !errorlevel! neq 0 (
        echo ERROR: Failed to install frontend dependencies
        exit /b 1
    )
)

REM Start frontend server if needed
echo Starting frontend server...
where http-server >nul 2>&1
if %errorlevel% equ 0 (
    start /b cmd /c "http-server . -p 3000 -s > %TEST_RESULTS_DIR%\frontend-server.log 2>&1"
    timeout /t 5 /nobreak >nul
) else (
    echo ERROR: http-server not found. Please install it: npm install -g http-server
    exit /b 1
)

echo.

REM Run Frontend Unit Tests
echo === Running Frontend Unit Tests ===

echo Executing Jest unit tests...
call npm test -- --run --coverage > "%TEST_RESULTS_DIR%\frontend-unit-tests.log" 2>&1

if %errorlevel% equ 0 (
    echo SUCCESS: Frontend unit tests passed
) else (
    echo ERROR: Frontend unit tests failed
)

echo.

REM Run Cypress E2E Tests
echo === Running Cypress End-to-End Tests ===

REM Check if Cypress is installed
where cypress >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Cypress...
    call npm install cypress --save-dev > "%TEST_RESULTS_DIR%\cypress-install.log" 2>&1
)

echo Executing authentication tests...
call npx cypress run --spec "cypress/e2e/authentication.cy.js" --browser chrome > "%TEST_RESULTS_DIR%\cypress-auth.log" 2>&1

if %errorlevel% equ 0 (
    echo SUCCESS: Authentication tests passed
) else (
    echo ERROR: Authentication tests failed
)

echo Executing study book management tests...
call npx cypress run --spec "cypress/e2e/studybook-management.cy.js" --browser chrome > "%TEST_RESULTS_DIR%\cypress-studybook.log" 2>&1

if %errorlevel% equ 0 (
    echo SUCCESS: Study book management tests passed
) else (
    echo ERROR: Study book management tests failed
)

echo Executing typing practice tests...
call npx cypress run --spec "cypress/e2e/typing-practice.cy.js" --browser chrome > "%TEST_RESULTS_DIR%\cypress-typing.log" 2>&1

if %errorlevel% equ 0 (
    echo SUCCESS: Typing practice tests passed
) else (
    echo ERROR: Typing practice tests failed
)

echo Executing system integration tests...
call npx cypress run --spec "cypress/e2e/system-integration.cy.js" --browser chrome > "%TEST_RESULTS_DIR%\cypress-system.log" 2>&1

if %errorlevel% equ 0 (
    echo SUCCESS: System integration tests passed
) else (
    echo ERROR: System integration tests failed
)

echo.

REM Performance Testing
echo === Running Performance Tests ===

echo Executing Lighthouse performance audit...
where lighthouse >nul 2>&1
if %errorlevel% equ 0 (
    call lighthouse http://localhost:3000/Rct/main.html --output=json --output-path="%TEST_RESULTS_DIR%\lighthouse-report.json" --chrome-flags="--headless" > "%TEST_RESULTS_DIR%\lighthouse.log" 2>&1
    
    if !errorlevel! equ 0 (
        echo SUCCESS: Lighthouse audit completed
    ) else (
        echo ERROR: Lighthouse audit failed
    )
) else (
    echo INFO: Lighthouse not found, skipping performance audit
)

echo.

REM Cleanup
echo === Cleaning Up ===

echo Stopping servers...
taskkill /f /im java.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

REM Wait for processes to terminate
timeout /t 5 /nobreak >nul

echo.

REM Generate Test Report
echo === Generating Test Report ===

set REPORT_FILE=%TEST_RESULTS_DIR%\test-report-%TIMESTAMP%.html

echo ^<!DOCTYPE html^> > "%REPORT_FILE%"
echo ^<html^> >> "%REPORT_FILE%"
echo ^<head^> >> "%REPORT_FILE%"
echo     ^<title^>RemindCodeTyping System Test Report^</title^> >> "%REPORT_FILE%"
echo     ^<style^> >> "%REPORT_FILE%"
echo         body { font-family: Arial, sans-serif; margin: 20px; } >> "%REPORT_FILE%"
echo         .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; } >> "%REPORT_FILE%"
echo         .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007cba; } >> "%REPORT_FILE%"
echo         .success { color: green; } >> "%REPORT_FILE%"
echo         .error { color: red; } >> "%REPORT_FILE%"
echo     ^</style^> >> "%REPORT_FILE%"
echo ^</head^> >> "%REPORT_FILE%"
echo ^<body^> >> "%REPORT_FILE%"
echo     ^<div class="header"^> >> "%REPORT_FILE%"
echo         ^<h1^>RemindCodeTyping System Test Report^</h1^> >> "%REPORT_FILE%"
echo         ^<p^>^<strong^>Generated:^</strong^> %date% %time%^</p^> >> "%REPORT_FILE%"
echo         ^<p^>^<strong^>Test Suite:^</strong^> Comprehensive End-to-End System Testing^</p^> >> "%REPORT_FILE%"
echo     ^</div^> >> "%REPORT_FILE%"
echo     ^<div class="section"^> >> "%REPORT_FILE%"
echo         ^<h2^>Test Summary^</h2^> >> "%REPORT_FILE%"
echo         ^<p^>All test artifacts have been preserved for analysis.^</p^> >> "%REPORT_FILE%"
echo     ^</div^> >> "%REPORT_FILE%"
echo ^</body^> >> "%REPORT_FILE%"
echo ^</html^> >> "%REPORT_FILE%"

echo SUCCESS: Test report generated: %REPORT_FILE%

echo.
echo === Test Execution Complete ===

echo System testing completed at %date% %time%
echo Test results are available in: %TEST_RESULTS_DIR%
echo Test report: %REPORT_FILE%

echo All critical test suites executed
exit /b 0