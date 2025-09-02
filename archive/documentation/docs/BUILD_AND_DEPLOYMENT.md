# Build and Deployment Guide

## Overview

This guide covers the complete build and deployment process for the RemindCodeTyping application, including local builds, CI/CD pipelines, and deployment to various environments.

## Build Process

### Backend Build (Maven)

#### Local Build Commands

```bash
cd rct-backend

# Clean build
./mvnw clean

# Compile only
./mvnw compile

# Run tests and build
./mvnw package

# Skip tests (faster build)
./mvnw package -DskipTests

# Build with all quality checks
./mvnw verify

# Install to local repository
./mvnw install
```

#### Build Profiles

| Profile | Purpose | Command |
|---------|---------|---------|
| `default` | Development build | `./mvnw package` |
| `production` | Production build | `./mvnw package -P production` |
| `integration-tests` | With integration tests | `./mvnw verify -P integration-tests` |
| `performance-tests` | With performance tests | `./mvnw verify -P performance-tests` |

#### Build Artifacts

```
target/
├── rct-backend-1.0.0.jar           # Executable JAR
├── rct-backend-1.0.0-sources.jar   # Source code
├── rct-backend-1.0.0-javadoc.jar   # Documentation
├── classes/                         # Compiled classes
├── test-classes/                    # Test classes
├── site/                           # Generated reports
│   ├── jacoco/                     # Coverage reports
│   ├── checkstyle.html             # Style check report
│   └── pmd.html                    # PMD analysis report
└── surefire-reports/               # Test reports
```

### Frontend Build

#### Build Commands

```bash
cd Rct

# Install dependencies
npm install

# Run linting
npm run lint

# Run tests
npm test

# Build for production (if build script exists)
npm run build

# Create distribution package
npm run package
```

#### Build Optimization

```bash
# Minify JavaScript files
npx terser js/main.js -o js/main.min.js

# Optimize CSS
npx csso css/style.css --output css/style.min.css

# Compress images
npx imagemin images/* --out-dir=images/optimized
```

## Quality Gates

### Backend Quality Checks

#### Code Formatting (Spotless)

```bash
# Check formatting
./mvnw spotless:check

# Apply formatting
./mvnw spotless:apply

# Configuration in pom.xml
<plugin>
  <groupId>com.diffplug.spotless</groupId>
  <artifactId>spotless-maven-plugin</artifactId>
  <configuration>
    <java>
      <googleJavaFormat>
        <version>1.17.0</version>
        <style>GOOGLE</style>
      </googleJavaFormat>
    </java>
  </configuration>
</plugin>
```

#### Code Style (Checkstyle)

```bash
# Run Checkstyle
./mvnw checkstyle:check

# Generate report
./mvnw checkstyle:checkstyle

# View report
open target/site/checkstyle.html
```

#### Static Analysis (PMD)

```bash
# Run PMD analysis
./mvnw pmd:check

# Generate report
./mvnw pmd:pmd

# View report
open target/site/pmd.html
```

#### Test Coverage (JaCoCo)

```bash
# Run tests with coverage
./mvnw test jacoco:report

# Check coverage thresholds
./mvnw jacoco:check

# View coverage report
open target/site/jacoco/index.html
```

### Frontend Quality Checks

#### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'prefer-const': 'error'
  }
};
```

#### Prettier Configuration

```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2
};
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Cache Maven dependencies
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        restore-keys: ${{ runner.os }}-m2
    
    - name: Run backend tests
      run: |
        cd rct-backend
        ./mvnw verify
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: rct-backend/target/site/jacoco/jacoco.xml
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: rct-backend/target/surefire-reports/

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test -- --coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: coverage/lcov.info

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  build-and-deploy:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Build application
      run: |
        cd rct-backend
        ./mvnw package -DskipTests
    
    - name: Build Docker image
      run: |
        docker build -t rct-backend:${{ github.sha }} .
        docker tag rct-backend:${{ github.sha }} rct-backend:latest
    
    - name: Deploy to staging
      if: github.ref == 'refs/heads/develop'
      run: |
        # Deploy to staging environment
        echo "Deploying to staging..."
    
    - name: Deploy to production
      if: github.ref == 'refs/heads/main'
      run: |
        # Deploy to production environment
        echo "Deploying to production..."
```

### Quality Gates Configuration

```yaml
# Quality gates in CI
quality-gates:
  code-coverage:
    minimum: 80%
    fail-build: true
  
  security-scan:
    severity-threshold: HIGH
    fail-build: true
  
  performance-tests:
    response-time-threshold: 500ms
    fail-build: true
  
  code-quality:
    sonar-quality-gate: PASSED
    fail-build: true
```

## Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build for backend
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app
COPY rct-backend/pom.xml .
COPY rct-backend/mvnw .
COPY rct-backend/.mvn .mvn
RUN ./mvnw dependency:go-offline

COPY rct-backend/src src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine AS runtime

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy JAR file
COPY --from=builder /app/target/rct-backend-*.jar app.jar

# Copy frontend files
COPY Rct/ static/

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  rct-backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/rctdb
      - SPRING_DATASOURCE_USERNAME=rctuser
      - SPRING_DATASOURCE_PASSWORD=rctpass
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=rctdb
      - POSTGRES_USER=rctuser
      - POSTGRES_PASSWORD=rctpass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rctuser -d rctdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - rct-backend

volumes:
  postgres_data:
```

### Docker Commands

```bash
# Build image
docker build -t rct-backend:latest .

# Run container
docker run -p 8080:8080 rct-backend:latest

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f rct-backend

# Scale services
docker-compose up -d --scale rct-backend=3

# Stop services
docker-compose down

# Clean up
docker system prune -a
```

## Cloud Deployment

### AWS Deployment

#### Elastic Beanstalk

```yaml
# .ebextensions/01-java.config
option_settings:
  aws:elasticbeanstalk:container:java:
    JVMOptions: '-Xmx512m -XX:MaxMetaspaceSize=128m'
  aws:elasticbeanstalk:application:environment:
    SPRING_PROFILES_ACTIVE: production
    SPRING_DATASOURCE_URL: jdbc:postgresql://rct-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432/rctdb
```

#### ECS Fargate

```json
{
  "family": "rct-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "rct-backend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/rct-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SPRING_PROFILES_ACTIVE",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "SPRING_DATASOURCE_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:rct-db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/rct-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Deployment Script

```bash
#!/bin/bash
# deploy-aws.sh

set -e

# Configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY="your-account.dkr.ecr.us-east-1.amazonaws.com/rct-backend"
ECS_CLUSTER="rct-cluster"
ECS_SERVICE="rct-service"

# Build and tag image
echo "Building Docker image..."
docker build -t rct-backend:latest .
docker tag rct-backend:latest $ECR_REPOSITORY:latest
docker tag rct-backend:latest $ECR_REPOSITORY:$GITHUB_SHA

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

# Push image
echo "Pushing image to ECR..."
docker push $ECR_REPOSITORY:latest
docker push $ECR_REPOSITORY:$GITHUB_SHA

# Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --region $AWS_REGION

echo "Deployment completed successfully!"
```

### Azure Deployment

#### App Service

```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  azureSubscription: 'your-subscription'
  appName: 'rct-backend-app'
  resourceGroup: 'rct-rg'

stages:
- stage: Build
  jobs:
  - job: BuildJob
    steps:
    - task: Maven@3
      inputs:
        mavenPomFile: 'rct-backend/pom.xml'
        goals: 'package'
        options: '-DskipTests'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'rct-backend/target/rct-backend-*.jar'
        artifactName: 'jar'

- stage: Deploy
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployJob
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: $(azureSubscription)
              appType: 'webAppLinux'
              appName: $(appName)
              package: '$(Pipeline.Workspace)/jar/rct-backend-*.jar'
```

#### Container Instances

```bash
# Deploy to Azure Container Instances
az container create \
  --resource-group rct-rg \
  --name rct-backend \
  --image your-registry.azurecr.io/rct-backend:latest \
  --cpu 1 \
  --memory 1 \
  --registry-login-server your-registry.azurecr.io \
  --registry-username your-username \
  --registry-password your-password \
  --dns-name-label rct-backend \
  --ports 8080 \
  --environment-variables \
    SPRING_PROFILES_ACTIVE=production \
    SPRING_DATASOURCE_URL=jdbc:postgresql://rct-postgres.postgres.database.azure.com:5432/rctdb
```

### Google Cloud Platform

#### Cloud Run

```yaml
# cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/rct-backend:$COMMIT_SHA', '.']

- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'gcr.io/$PROJECT_ID/rct-backend:$COMMIT_SHA']

- name: 'gcr.io/cloud-builders/gcloud'
  args:
  - 'run'
  - 'deploy'
  - 'rct-backend'
  - '--image'
  - 'gcr.io/$PROJECT_ID/rct-backend:$COMMIT_SHA'
  - '--region'
  - 'us-central1'
  - '--platform'
  - 'managed'
  - '--allow-unauthenticated'
  - '--set-env-vars'
  - 'SPRING_PROFILES_ACTIVE=production'
```

## Environment-Specific Configurations

### Development Environment

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:file:./data/rctdb
    username: sa
    password: 
  jpa:
    show-sql: true
  h2:
    console:
      enabled: true

logging:
  level:
    com.rct: DEBUG
    org.springframework.web: DEBUG
```

### Staging Environment

```yaml
# application-staging.yml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  jpa:
    show-sql: false
    hibernate:
      ddl-auto: validate

logging:
  level:
    com.rct: INFO
    root: WARN

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
```

### Production Environment

```yaml
# application-prod.yml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
  jpa:
    show-sql: false
    hibernate:
      ddl-auto: validate

logging:
  level:
    com.rct: INFO
    root: WARN
  file:
    name: /var/log/rct-backend.log

management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: never

server:
  error:
    include-stacktrace: never
    include-message: never
```

## Monitoring and Observability

### Health Checks

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(1)) {
                return Health.up()
                    .withDetail("database", "Available")
                    .withDetail("validationQuery", "SELECT 1")
                    .build();
            }
        } catch (Exception e) {
            return Health.down()
                .withDetail("database", "Unavailable")
                .withException(e)
                .build();
        }
        return Health.down().withDetail("database", "Validation failed").build();
    }
}
```

### Metrics Collection

```yaml
# Prometheus metrics
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
```

### Logging Configuration

```xml
<!-- logback-spring.xml -->
<configuration>
    <springProfile name="!prod">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>
    
    <springProfile name="prod">
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>/var/log/rct-backend.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>/var/log/rct-backend.%d{yyyy-MM-dd}.gz</fileNamePattern>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
            <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
                <providers>
                    <timestamp/>
                    <logLevel/>
                    <loggerName/>
                    <message/>
                    <mdc/>
                    <stackTrace/>
                </providers>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="FILE"/>
        </root>
    </springProfile>
</configuration>
```

## Rollback Procedures

### Application Rollback

```bash
# Docker rollback
docker service update --rollback rct-backend

# Kubernetes rollback
kubectl rollout undo deployment/rct-backend

# AWS ECS rollback
aws ecs update-service \
  --cluster rct-cluster \
  --service rct-service \
  --task-definition rct-backend:previous-revision
```

### Database Rollback

```bash
# Flyway rollback (if supported)
./mvnw flyway:undo

# Manual rollback with backup
pg_restore -h localhost -U rctuser -d rctdb backup_before_deployment.sql
```

### Blue-Green Deployment

```bash
# Switch traffic to green environment
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:account:listener/app/rct-alb/listener-id \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:account:targetgroup/rct-green

# Verify green environment
curl -f https://api.remindcodetyping.com/actuator/health

# If issues, switch back to blue
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:account:listener/app/rct-alb/listener-id \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:account:targetgroup/rct-blue
```

## Performance Optimization

### Build Performance

```bash
# Parallel builds
./mvnw -T 4 package

# Incremental compilation
./mvnw compile -Dmaven.compiler.useIncrementalCompilation=true

# Skip unnecessary plugins
./mvnw package -Dcheckstyle.skip -Dpmd.skip -Dspotless.check.skip
```

### Runtime Performance

```yaml
# JVM tuning for production
JAVA_OPTS: >
  -Xms512m
  -Xmx1024m
  -XX:+UseG1GC
  -XX:MaxGCPauseMillis=200
  -XX:+UseStringDeduplication
  -XX:+OptimizeStringConcat
```

This comprehensive build and deployment guide ensures reliable, automated, and scalable deployment processes for the RemindCodeTyping application across different environments and cloud platforms.