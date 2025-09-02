# Development Setup Guide

## Overview

This guide provides comprehensive instructions for setting up the RemindCodeTyping development environment. The project consists of a Java Spring Boot backend and a vanilla JavaScript frontend with comprehensive testing and quality assurance tools.

## Prerequisites

### Required Software

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| **Java** | 17+ | Backend runtime | [Download OpenJDK](https://adoptium.net/) |
| **Node.js** | 18+ | Frontend tooling | [Download Node.js](https://nodejs.org/) |
| **Git** | Latest | Version control | [Download Git](https://git-scm.com/) |
| **Docker** | Latest | Integration testing | [Download Docker](https://www.docker.com/) |
| **Maven** | 3.8+ | Build tool (optional) | [Download Maven](https://maven.apache.org/) |

### Optional Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **IntelliJ IDEA** | Java IDE | [Download IntelliJ](https://www.jetbrains.com/idea/) |
| **VS Code** | Lightweight editor | [Download VS Code](https://code.visualstudio.com/) |
| **Postman** | API testing | [Download Postman](https://www.postman.com/) |
| **pgAdmin** | PostgreSQL management | [Download pgAdmin](https://www.pgadmin.org/) |

### System Requirements

- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/RemindCodeTyping.git
cd RemindCodeTyping
```

### 2. Backend Setup (H2 Database)

```bash
cd rct-backend

# Start with embedded H2 database (fastest setup)
./mvnw spring-boot:run

# Or on Windows
mvnw.cmd spring-boot:run
```

### 3. Verify Installation

```bash
# Check backend health
curl http://localhost:8080/actuator/health

# Test demo login
curl -X POST http://localhost:8080/api/auth/demo

# Access Swagger UI
open http://localhost:8080/swagger-ui/index.html
```

### 4. Frontend Setup

```bash
cd ../Rct

# Install dependencies
npm install

# Start development server (if applicable)
npm start

# Or serve static files
python -m http.server 8000
# Then open http://localhost:8000
```

## Detailed Setup Instructions

### Backend Development Environment

#### 1. Java Configuration

Verify Java installation:

```bash
java -version
# Should show Java 17 or higher

javac -version
# Should show matching version
```

Set JAVA_HOME (if needed):

```bash
# Linux/macOS
export JAVA_HOME=/path/to/java17
echo 'export JAVA_HOME=/path/to/java17' >> ~/.bashrc

# Windows (PowerShell)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "User")
```

#### 2. IDE Configuration

**IntelliJ IDEA Setup:**

1. Open project from `rct-backend` folder
2. Configure Project SDK to Java 17
3. Enable annotation processing for Lombok
4. Install recommended plugins:
   - Lombok Plugin
   - Spring Boot Plugin
   - SonarLint

**VS Code Setup:**

1. Install Java Extension Pack
2. Install Spring Boot Extension Pack
3. Configure settings.json:

```json
{
  "java.home": "/path/to/java17",
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "/path/to/java17"
    }
  ],
  "spring-boot.ls.java.home": "/path/to/java17"
}
```

#### 3. Database Setup Options

**Option A: H2 Database (Recommended for Development)**

No setup required - runs in memory.

Access H2 Console:
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:rctdb`
- Username: `sa`
- Password: (empty)

**Option B: PostgreSQL with Docker**

```bash
# Start PostgreSQL container
docker run --name rct-postgres \
  -e POSTGRES_DB=rctdb \
  -e POSTGRES_USER=rctuser \
  -e POSTGRES_PASSWORD=rctpass \
  -p 5432:5432 \
  -d postgres:15

# Run backend with PostgreSQL profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=docker
```

**Option C: Local PostgreSQL Installation**

1. Install PostgreSQL 15+
2. Create database and user:

```sql
CREATE DATABASE rctdb;
CREATE USER rctuser WITH PASSWORD 'rctpass';
GRANT ALL PRIVILEGES ON DATABASE rctdb TO rctuser;
```

3. Update `application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/rctdb
    username: rctuser
    password: rctpass
```

### Frontend Development Environment

#### 1. Node.js Setup

Verify Node.js installation:

```bash
node --version
# Should show v18 or higher

npm --version
# Should show npm version
```

#### 2. Frontend Dependencies

```bash
cd Rct

# Install development dependencies
npm install --save-dev jest @testing-library/jest-dom
npm install --save-dev eslint prettier
npm install --save-dev cypress

# Install runtime dependencies (if any)
npm install
```

#### 3. Frontend Development Server

**Option A: Simple HTTP Server**

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

**Option B: Live Reload Server**

```bash
# Install live-server globally
npm install -g live-server

# Start with live reload
live-server --port=8000 --host=localhost
```

## Build and Test Configuration

### Backend Build System

#### Maven Configuration

The project uses Maven with the following key configurations:

```xml
<!-- Key properties -->
<properties>
    <java.version>17</java.version>
    <spring-boot.version>3.2.12</spring-boot.version>
    <testcontainers.version>1.19.3</testcontainers.version>
</properties>
```

#### Build Commands

```bash
# Clean and compile
./mvnw clean compile

# Run tests
./mvnw test

# Run integration tests
./mvnw verify -P integration-tests

# Build JAR
./mvnw package

# Skip tests (for faster builds)
./mvnw package -DskipTests

# Run with specific profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Quality Checks

```bash
# Code formatting check
./mvnw spotless:check

# Apply code formatting
./mvnw spotless:apply

# Checkstyle validation
./mvnw checkstyle:check

# PMD static analysis
./mvnw pmd:check

# All quality checks
./mvnw verify
```

### Frontend Build System

#### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint Rct/js/**/*.js",
    "lint:fix": "eslint Rct/js/**/*.js --fix",
    "format": "prettier --write Rct/js/**/*.js",
    "format:check": "prettier --check Rct/js/**/*.js",
    "e2e": "cypress run",
    "e2e:open": "cypress open"
  }
}
```

#### Quality Commands

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint JavaScript
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run E2E tests
npm run e2e

# Open Cypress UI
npm run e2e:open
```

## Environment Configuration

### Environment Variables

Create `.env` file in the backend directory:

```bash
# Database Configuration
SPRING_DATASOURCE_URL=jdbc:h2:mem:rctdb
SPRING_DATASOURCE_USERNAME=sa
SPRING_DATASOURCE_PASSWORD=

# Security Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=3600

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000

# Logging Configuration
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_RCT=DEBUG
```

### Application Profiles

| Profile | Purpose | Database | Use Case |
|---------|---------|----------|----------|
| `default` | Development | H2 in-memory | Quick development |
| `dev` | Development | H2 file-based | Persistent development |
| `docker` | Docker | PostgreSQL | Container testing |
| `test` | Testing | H2 in-memory | Unit/Integration tests |
| `prod` | Production | PostgreSQL | Production deployment |

Activate profiles:

```bash
# Via command line
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Via environment variable
export SPRING_PROFILES_ACTIVE=dev

# Via application.yml
spring:
  profiles:
    active: dev
```

## Development Workflow

### 1. Daily Development

```bash
# Start development session
cd RemindCodeTyping

# Pull latest changes
git pull origin main

# Start backend
cd rct-backend
./mvnw spring-boot:run

# In another terminal, start frontend
cd ../Rct
live-server --port=8000

# Run tests before committing
./mvnw test
npm test
```

### 2. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
./mvnw test
npm test

# Run quality checks
./mvnw verify
npm run lint

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 3. Code Quality Workflow

```bash
# Before committing, run all checks
cd rct-backend
./mvnw spotless:apply  # Fix formatting
./mvnw verify          # Run all checks

cd ../
npm run lint:fix       # Fix JS linting
npm run format         # Format JS code
npm test               # Run JS tests
```

## Troubleshooting

### Common Issues

#### Java Issues

**Problem**: `JAVA_HOME` not set
```bash
# Solution: Set JAVA_HOME
export JAVA_HOME=/path/to/java17
```

**Problem**: Wrong Java version
```bash
# Check current version
java -version

# Use specific Java version (Linux/macOS)
export PATH=/path/to/java17/bin:$PATH
```

**Problem**: Maven wrapper not executable
```bash
# Make executable
chmod +x mvnw
```

#### Database Issues

**Problem**: H2 console not accessible
```bash
# Check if application is running
curl http://localhost:8080/actuator/health

# Verify H2 configuration in application.yml
```

**Problem**: PostgreSQL connection failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -p 5432 -U rctuser -d rctdb
```

#### Port Conflicts

**Problem**: Port 8080 already in use
```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process or use different port
./mvnw spring-boot:run -Dserver.port=8081
```

#### Build Issues

**Problem**: Tests failing
```bash
# Run tests with more verbose output
./mvnw test -X

# Skip tests temporarily
./mvnw package -DskipTests
```

**Problem**: Out of memory during build
```bash
# Increase Maven memory
export MAVEN_OPTS="-Xmx2g -XX:MaxPermSize=512m"
```

### Performance Optimization

#### Development Performance

```bash
# Use parallel builds
./mvnw -T 4 package

# Skip unnecessary plugins in development
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=false"

# Use incremental compilation
./mvnw compile -Dmaven.compiler.useIncrementalCompilation=true
```

#### IDE Performance

**IntelliJ IDEA:**
- Increase heap size: Help → Edit Custom VM Options
- Disable unused plugins
- Exclude target directories from indexing

**VS Code:**
- Disable Java validation for large files
- Increase Java language server memory

### Debugging

#### Backend Debugging

```bash
# Debug mode
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

# Remote debugging in IDE
# IntelliJ: Run → Edit Configurations → Remote JVM Debug
# Port: 5005
```

#### Frontend Debugging

```bash
# Enable browser dev tools
# Chrome: F12 → Sources tab

# Use console logging
console.log('Debug info:', variable);

# Use debugger statement
debugger;
```

## IDE-Specific Setup

### IntelliJ IDEA

#### Project Import

1. File → Open → Select `rct-backend` folder
2. Import as Maven project
3. Configure Project SDK (Java 17)
4. Enable annotation processing

#### Recommended Settings

```
File → Settings → Build → Compiler → Annotation Processors
☑ Enable annotation processing

File → Settings → Editor → Code Style → Java
Import scheme: GoogleStyle (from Spotless)

File → Settings → Plugins
☑ Lombok Plugin
☑ Spring Boot Plugin
☑ SonarLint
```

#### Run Configurations

Create run configuration:
- Main class: `com.rct.RctBackendApplication`
- VM options: `-Dspring.profiles.active=dev`
- Environment variables: `SPRING_DATASOURCE_URL=jdbc:h2:mem:rctdb`

### VS Code

#### Extensions

Install recommended extensions:

```json
{
  "recommendations": [
    "vscjava.vscode-java-pack",
    "pivotal.vscode-spring-boot",
    "gabrielbb.vscode-lombok",
    "sonarsource.sonarlint-vscode",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

#### Settings

Create `.vscode/settings.json`:

```json
{
  "java.home": "/path/to/java17",
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "/path/to/java17"
    }
  ],
  "spring-boot.ls.java.home": "/path/to/java17",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## Testing Setup

### Backend Testing

#### Test Configuration

```yaml
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
```

#### Running Tests

```bash
# Unit tests only
./mvnw test

# Integration tests
./mvnw verify -P integration-tests

# Specific test class
./mvnw test -Dtest=UserServiceTest

# Specific test method
./mvnw test -Dtest=UserServiceTest#shouldCreateUser

# With coverage
./mvnw test jacoco:report
```

### Frontend Testing

#### Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'Rct/js/**/*.js',
    '!Rct/js/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- UserService.test.js
```

## Next Steps

After completing the setup:

1. **Explore the API**: Visit http://localhost:8080/swagger-ui/index.html
2. **Run the frontend**: Open http://localhost:8000
3. **Read the code**: Start with `AuthController.java` and `main.html`
4. **Make a change**: Try adding a new endpoint or frontend feature
5. **Run tests**: Ensure everything works with `./mvnw test` and `npm test`

## Getting Help

- **Documentation**: Check `/docs` folder for detailed guides
- **API Reference**: http://localhost:8080/swagger-ui/index.html
- **Issues**: Create GitHub issues for bugs or questions
- **Discussions**: Use GitHub Discussions for general questions

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.