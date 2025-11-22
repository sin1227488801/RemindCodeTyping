@echo off
REM Comprehensive Build Script for RemindCodeTyping Project (Windows)
REM This script handles both frontend and backend builds with quality checks

setlocal enabledelayedexpansion

REM Configuration
set BUILD_MODE=%1
if "%BUILD_MODE%"=="" set BUILD_MODE=production

set SKIP_TESTS=%2
if "%SKIP_TESTS%"=="" set SKIP_TESTS=false

set SKIP_QUALITY=%3
if "%SKIP_QUALITY%"=="" set SKIP_QUALITY=false

set DOCKER_BUILD=%4
if "%DOCKER_BUILD%"=="" set DOCKER_BUILD=false

echo.
echo ======================================================
echo 🚀 Starting RemindCodeTyping Build Pipeline
echo ======================================================
echo Build Mode: %BUILD_MODE%
echo Skip Tests: %SKIP_TESTS%
echo Skip Quality Checks: %SKIP_QUALITY%
echo Docker Build: %DOCKER_BUILD%
echo.

REM Check prerequisites
echo ======================================================
echo 📋 Checking Prerequisites
echo ======================================================

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    exit /b 1
)
echo ✅ Node.js version: 
node --version

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed
    exit /b 1
)
echo ✅ npm version:
npm --version

REM Check Java
java --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java is not installed
    exit /b 1
)
echo ✅ Java version:
java --version | findstr /C:"openjdk"

REM Check Maven wrapper
if not exist "rct-backend\mvnw.cmd" (
    echo ❌ Maven wrapper not found
    exit /b 1
)
echo ✅ Maven wrapper found

REM Check Docker (if needed)
if "%DOCKER_BUILD%"=="true" (
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker is not installed but Docker build was requested
        exit /b 1
    )
    echo ✅ Docker version:
    docker --version
)

REM Clean previous builds
echo.
echo ======================================================
echo 🧹 Cleaning Previous Builds
echo ======================================================

call npm run clean
if errorlevel 1 (
    echo ❌ Frontend clean failed
    exit /b 1
)

cd rct-backend
call mvnw.cmd clean
if errorlevel 1 (
    echo ❌ Backend clean failed
    exit /b 1
)
cd ..
echo ✅ Clean completed

REM Install dependencies
echo.
echo ======================================================
echo 📦 Installing Dependencies
echo ======================================================

echo Installing frontend dependencies...
call npm ci
if errorlevel 1 (
    echo ❌ Frontend dependency installation failed
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo Downloading backend dependencies...
cd rct-backend
call mvnw.cmd dependency:go-offline -B
if errorlevel 1 (
    echo ❌ Backend dependency download failed
    exit /b 1
)
cd ..
echo ✅ Backend dependencies downloaded

REM Security checks
if not "%SKIP_QUALITY%"=="true" (
    echo.
    echo ======================================================
    echo 🔒 Security Checks
    echo ======================================================
    
    echo Running frontend security audit...
    call npm run security:audit
    if errorlevel 1 (
        echo ❌ Frontend security audit failed
        exit /b 1
    )
    echo ✅ Frontend security audit passed
    
    echo Running backend dependency vulnerability check...
    cd rct-backend
    call mvnw.cmd org.owasp:dependency-check-maven:check -P security-scan
    if errorlevel 1 (
        echo ❌ Backend security scan failed
        exit /b 1
    )
    cd ..
    echo ✅ Backend security scan passed
)

REM Quality checks
if not "%SKIP_QUALITY%"=="true" (
    echo.
    echo ======================================================
    echo 🔍 Quality Checks
    echo ======================================================
    
    echo Running frontend quality checks...
    call npm run quality:check
    if errorlevel 1 (
        echo ❌ Frontend quality checks failed
        exit /b 1
    )
    echo ✅ Frontend quality checks passed
    
    echo Running backend quality checks...
    cd rct-backend
    call mvnw.cmd spotless:check checkstyle:check pmd:check
    if errorlevel 1 (
        echo ❌ Backend quality checks failed
        exit /b 1
    )
    cd ..
    echo ✅ Backend quality checks passed
)

REM Run tests
if not "%SKIP_TESTS%"=="true" (
    echo.
    echo ======================================================
    echo 🧪 Running Tests
    echo ======================================================
    
    echo Running frontend tests...
    call npm run test:ci
    if errorlevel 1 (
        echo ❌ Frontend tests failed
        exit /b 1
    )
    echo ✅ Frontend tests passed
    
    echo Running backend unit tests...
    cd rct-backend
    call mvnw.cmd test -P ci
    if errorlevel 1 (
        echo ❌ Backend unit tests failed
        exit /b 1
    )
    cd ..
    echo ✅ Backend unit tests passed
    
    echo Running backend integration tests...
    cd rct-backend
    call mvnw.cmd verify -P integration-tests
    if errorlevel 1 (
        echo ❌ Backend integration tests failed
        exit /b 1
    )
    cd ..
    echo ✅ Backend integration tests passed
)

REM Build applications
echo.
echo ======================================================
echo 🏗️ Building Applications
echo ======================================================

echo Building frontend...
if "%BUILD_MODE%"=="production" (
    call npm run build
) else (
    call npm run build:dev
)
if errorlevel 1 (
    echo ❌ Frontend build failed
    exit /b 1
)
echo ✅ Frontend build completed

echo Building backend...
cd rct-backend
if "%BUILD_MODE%"=="production" (
    call mvnw.cmd package -DskipTests -P production
) else (
    call mvnw.cmd package -DskipTests
)
if errorlevel 1 (
    echo ❌ Backend build failed
    exit /b 1
)
cd ..
echo ✅ Backend build completed

REM Bundle size check
if "%BUILD_MODE%"=="production" if not "%SKIP_QUALITY%"=="true" (
    echo.
    echo ======================================================
    echo 📊 Bundle Size Analysis
    echo ======================================================
    
    echo Checking bundle sizes...
    call npx bundlesize
    if errorlevel 1 (
        echo ❌ Bundle size check failed
        exit /b 1
    )
    echo ✅ Bundle size check passed
)

REM Docker build
if "%DOCKER_BUILD%"=="true" (
    echo.
    echo ======================================================
    echo 🐳 Building Docker Images
    echo ======================================================
    
    echo Building backend Docker image...
    cd rct-backend
    docker build -t rct-backend:latest --target production .
    if errorlevel 1 (
        echo ❌ Backend Docker build failed
        exit /b 1
    )
    cd ..
    echo ✅ Backend Docker image built
    
    echo Building frontend Docker image...
    docker build -f Dockerfile.frontend -t rct-frontend:latest .
    if errorlevel 1 (
        echo ❌ Frontend Docker build failed
        exit /b 1
    )
    echo ✅ Frontend Docker image built
)

REM Generate build report
echo.
echo ======================================================
echo 📋 Build Report
echo ======================================================

echo ✅ Build completed successfully!
echo.
echo Build Summary:
echo   Build Mode: %BUILD_MODE%
echo   Build Time: %date% %time%
echo   Tests: %SKIP_TESTS%
echo   Quality Checks: %SKIP_QUALITY%
echo   Docker Images: %DOCKER_BUILD%
echo.
echo Build Artifacts:
echo   Frontend: .\dist\
echo   Backend: .\rct-backend\target\
if "%DOCKER_BUILD%"=="true" (
    echo   Docker Images: rct-backend:latest, rct-frontend:latest
)
echo.
echo 🎉 Build pipeline completed successfully!

endlocal