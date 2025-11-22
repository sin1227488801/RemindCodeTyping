@echo off
REM Quality Check Script for RCT Project (Windows)
REM This script runs all quality checks for both backend and frontend

setlocal enabledelayedexpansion

echo 🔍 Starting comprehensive quality checks...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the project root directory
    exit /b 1
)

if not exist "rct-backend" (
    echo ❌ rct-backend directory not found. Please run this script from the project root directory
    exit /b 1
)

REM Backend Quality Checks
echo 🔧 Running backend quality checks...

cd rct-backend

REM Check if Maven wrapper exists
if not exist "mvnw.cmd" (
    echo ❌ Maven wrapper not found. Please ensure mvnw.cmd exists.
    exit /b 1
)

echo ✅ Running Spotless format check...
call mvnw.cmd spotless:check
if !errorlevel! neq 0 (
    echo ⚠️  Code formatting issues found. Run 'mvnw.cmd spotless:apply' to fix them.
    exit /b 1
)

echo ✅ Running Checkstyle...
call mvnw.cmd checkstyle:check
if !errorlevel! neq 0 (
    echo ❌ Checkstyle violations found. Please fix them before proceeding.
    exit /b 1
)

echo ✅ Running PMD analysis...
call mvnw.cmd pmd:check
if !errorlevel! neq 0 (
    echo ❌ PMD violations found. Please fix them before proceeding.
    exit /b 1
)

echo ✅ Running backend unit tests...
call mvnw.cmd test
if !errorlevel! neq 0 (
    echo ❌ Backend unit tests failed.
    exit /b 1
)

echo ✅ Running backend integration tests...
call mvnw.cmd verify -P integration-tests
if !errorlevel! neq 0 (
    echo ❌ Backend integration tests failed.
    exit /b 1
)

cd ..

REM Frontend Quality Checks
echo 🎨 Running frontend quality checks...

REM Check if Node.js dependencies are installed
if not exist "node_modules" (
    echo ✅ Installing Node.js dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo ❌ Failed to install Node.js dependencies.
        exit /b 1
    )
)

echo ✅ Running ESLint...
call npm run lint:check
if !errorlevel! neq 0 (
    echo ⚠️  ESLint issues found. Run 'npm run lint' to fix auto-fixable issues.
    exit /b 1
)

echo ✅ Running Prettier format check...
call npm run format:check
if !errorlevel! neq 0 (
    echo ⚠️  Code formatting issues found. Run 'npm run format' to fix them.
    exit /b 1
)

echo ✅ Running frontend tests...
call npm run test:ci
if !errorlevel! neq 0 (
    echo ❌ Frontend tests failed.
    exit /b 1
)

REM Summary
echo.
echo 🎉 All quality checks passed successfully!
echo.
echo 📊 Summary:
echo   ✅ Backend code formatting (Spotless)
echo   ✅ Backend code style (Checkstyle)
echo   ✅ Backend code analysis (PMD)
echo   ✅ Backend unit tests
echo   ✅ Backend integration tests
echo   ✅ Frontend code linting (ESLint)
echo   ✅ Frontend code formatting (Prettier)
echo   ✅ Frontend unit tests
echo.
echo 🚀 Your code is ready for deployment!

endlocal