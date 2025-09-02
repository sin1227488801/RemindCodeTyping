# Quality Gates and Testing Infrastructure

This document describes the comprehensive quality gates and testing infrastructure implemented for the RemindCodeTyping project.

## Overview

The project now includes:
- **Backend Quality Tools**: Spotless, Checkstyle, PMD, JaCoCo
- **Frontend Quality Tools**: ESLint, Prettier, Jest
- **Testing Infrastructure**: TestContainers, comprehensive test utilities
- **CI/CD Pipeline**: GitHub Actions with automated quality checks
- **Pre-commit Hooks**: Automated quality checks before commits

## Backend Quality Tools

### 1. Spotless (Code Formatting)
- **Purpose**: Ensures consistent code formatting across the project
- **Configuration**: Uses Google Java Format
- **Usage**:
  ```bash
  cd rct-backend
  ./mvnw spotless:check    # Check formatting
  ./mvnw spotless:apply    # Fix formatting issues
  ```

### 2. Checkstyle (Code Style)
- **Purpose**: Enforces coding standards and best practices
- **Configuration**: Custom rules in `checkstyle.xml`
- **Key Rules**:
  - Line length: 120 characters
  - Method length: 50 lines maximum
  - Cyclomatic complexity: 10 maximum
  - Parameter count: 7 maximum
- **Usage**:
  ```bash
  cd rct-backend
  ./mvnw checkstyle:check
  ```

### 3. PMD (Static Code Analysis)
- **Purpose**: Detects code smells, bugs, and performance issues
- **Configuration**: Custom rules in `pmd-rules.xml`
- **Key Rules**:
  - Cyclomatic complexity: 10 maximum
  - Method length: 50 lines maximum
  - Parameter count: 7 maximum
  - N-Path complexity: 200 maximum
- **Usage**:
  ```bash
  cd rct-backend
  ./mvnw pmd:check
  ```

### 4. JaCoCo (Code Coverage)
- **Purpose**: Measures test coverage and enforces minimum thresholds
- **Thresholds**:
  - Line coverage: 80% minimum
  - Branch coverage: 70% minimum
- **Usage**:
  ```bash
  cd rct-backend
  ./mvnw test                    # Run tests with coverage
  ./mvnw jacoco:report          # Generate coverage report
  ```

## Frontend Quality Tools

### 1. ESLint (JavaScript Linting)
- **Purpose**: Identifies and fixes JavaScript code issues
- **Configuration**: `.eslintrc.js` with comprehensive rules
- **Key Rules**:
  - Complexity: 10 maximum
  - Function length: 50 lines maximum
  - Parameter count: 5 maximum
  - No magic numbers (with exceptions)
- **Usage**:
  ```bash
  npm run lint:check    # Check for issues
  npm run lint          # Fix auto-fixable issues
  ```

### 2. Prettier (Code Formatting)
- **Purpose**: Ensures consistent code formatting
- **Configuration**: `.prettierrc.js` with project-specific rules
- **Usage**:
  ```bash
  npm run format:check  # Check formatting
  npm run format        # Fix formatting issues
  ```

### 3. Jest (Testing Framework)
- **Purpose**: JavaScript testing with coverage reporting
- **Configuration**: Comprehensive setup in `package.json` and `tests/setup.js`
- **Coverage Thresholds**:
  - Lines: 80%
  - Functions: 80%
  - Branches: 70%
  - Statements: 80%
- **Usage**:
  ```bash
  npm test              # Run tests
  npm run test:watch    # Run tests in watch mode
  npm run test:ci       # Run tests for CI
  ```

## Testing Infrastructure

### 1. TestContainers (Backend)
- **Purpose**: Integration testing with real databases
- **Configuration**: `BaseIntegrationTest.java`
- **Features**:
  - PostgreSQL container for database tests
  - Automatic container lifecycle management
  - Test-specific configuration

### 2. Test Utilities
- **TestDataBuilder**: Fluent API for creating test data
- **TestConfig**: Consistent test configuration
- **Custom Matchers**: Enhanced assertions for frontend tests

### 3. Test Profiles
- **Backend**: `application-test.yml` with test-specific configuration
- **Frontend**: `tests/setup.js` with mocks and utilities

## CI/CD Pipeline

### GitHub Actions Workflow
The `.github/workflows/ci-cd.yml` includes:

1. **Backend Quality Checks**:
   - Spotless format check
   - Checkstyle validation
   - PMD analysis
   - Unit and integration tests
   - Coverage reporting

2. **Frontend Quality Checks**:
   - ESLint validation
   - Prettier format check
   - Jest tests with coverage

3. **Security Scanning**:
   - Trivy vulnerability scanner
   - CodeQL analysis

4. **Build and Deploy**:
   - Application build
   - Docker image creation
   - Deployment to staging/production

### Quality Gates
- All quality checks must pass before merge
- Minimum coverage thresholds enforced
- Security scans must pass
- No critical vulnerabilities allowed

## Pre-commit Hooks

### Setup
```bash
# Install pre-commit (requires Python)
pip install pre-commit

# Install hooks
pre-commit install
```

### Hooks Included
- File formatting checks
- Java code quality (Spotless, Checkstyle, PMD)
- JavaScript quality (ESLint, Prettier)
- Security checks (detect-secrets)
- YAML validation

## Quality Check Scripts

### Cross-platform Scripts
- **Unix/Linux/Mac**: `quality-check.sh`
- **Windows**: `quality-check.bat`

### Usage
```bash
# Unix/Linux/Mac
./quality-check.sh

# Windows
quality-check.bat
```

These scripts run all quality checks in sequence and provide a comprehensive report.

## IDE Integration

### IntelliJ IDEA
1. Install plugins:
   - Checkstyle-IDEA
   - PMDPlugin
   - Spotless Gradle
   - ESLint
   - Prettier

2. Configure code style:
   - Import Checkstyle configuration
   - Enable Spotless formatting
   - Configure ESLint and Prettier

### VS Code
1. Install extensions:
   - Extension Pack for Java
   - ESLint
   - Prettier
   - Jest

2. Configure workspace settings for consistent formatting

## Troubleshooting

### Common Issues

1. **Spotless formatting failures**:
   ```bash
   cd rct-backend
   ./mvnw spotless:apply
   ```

2. **ESLint issues**:
   ```bash
   npm run lint
   ```

3. **Test failures**:
   - Check test logs for specific failures
   - Ensure TestContainers Docker is running
   - Verify test data setup

### Performance Tips
- Use `--parallel` flag for Maven builds
- Enable Jest cache for faster test runs
- Use incremental builds in CI

## Metrics and Reporting

### Coverage Reports
- **Backend**: `rct-backend/target/site/jacoco/index.html`
- **Frontend**: `coverage/lcov-report/index.html`

### Quality Reports
- **Checkstyle**: `rct-backend/target/checkstyle-result.xml`
- **PMD**: `rct-backend/target/pmd.xml`
- **ESLint**: Console output with detailed error descriptions

## Continuous Improvement

### Regular Tasks
1. Update dependency versions monthly
2. Review and update quality rules quarterly
3. Analyze coverage reports and improve test coverage
4. Monitor CI/CD pipeline performance

### Quality Metrics Tracking
- Track coverage trends over time
- Monitor build times and optimize as needed
- Review and address recurring quality issues

This comprehensive quality setup ensures code consistency, reliability, and maintainability across the entire project.