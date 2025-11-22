@echo off
echo Running Frontend Test Suite...
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    exit /b 1
)

echo.
echo Running unit tests with coverage...
call npm run test:ci
if %errorlevel% neq 0 (
    echo Unit tests failed
    exit /b 1
)

echo.
echo Running linting checks...
call npm run lint:check
if %errorlevel% neq 0 (
    echo Linting failed
    exit /b 1
)

echo.
echo Running format checks...
call npm run format:check
if %errorlevel% neq 0 (
    echo Format check failed
    exit /b 1
)

echo.
echo All frontend tests passed successfully!
echo Coverage report available at: coverage/lcov-report/index.html
echo.

echo To run E2E tests, use:
echo   npm run test:e2e:open  (interactive)
echo   npm run test:e2e       (headless)
echo.

pause