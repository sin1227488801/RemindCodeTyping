# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered during development, testing, and deployment of the RemindCodeTyping application.

## Quick Diagnosis

### Health Check Commands

```bash
# Backend health
curl http://localhost:8080/actuator/health

# Database connectivity
curl http://localhost:8080/actuator/health/db

# Application info
curl http://localhost:8080/actuator/info

# Check if port is in use
netstat -tulpn | grep :8080  # Linux
lsof -i :8080               # macOS
netstat -ano | findstr :8080 # Windows
```

### Log Locations

```bash
# Application logs
tail -f logs/application.log

# Spring Boot logs (if file logging enabled)
tail -f /var/log/rct-backend.log

# Docker logs
docker logs rct-backend

# System logs
journalctl -u rct-backend -f  # systemd
```

## Common Issues

### 1. Application Startup Issues

#### Issue: Application fails to start

**Symptoms:**
- Application exits immediately
- "Port already in use" error
- Database connection failures

**Diagnosis:**
```bash
# Check Java version
java -version

# Check if port is available
telnet localhost 8080

# Check database connectivity
pg_isready -h localhost -p 5432
```

**Solutions:**

**Port Conflict:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
./mvnw spring-boot:run -Dserver.port=8081
```

**Java Version Issues:**
```bash
# Set correct Java version
export JAVA_HOME=/path/to/java17
export PATH=$JAVA_HOME/bin:$PATH

# Verify version
java -version
javac -version
```

**Database Connection Issues:**
```bash
# Check PostgreSQL status
systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Test connection
psql -h localhost -p 5432 -U rctuser -d rctdb

# Check connection string
echo $SPRING_DATASOURCE_URL
```

#### Issue: OutOfMemoryError during startup

**Symptoms:**
- `java.lang.OutOfMemoryError: Java heap space`
- Application crashes during initialization

**Solutions:**
```bash
# Increase heap size
export MAVEN_OPTS="-Xmx2g"
./mvnw spring-boot:run

# Or set JVM arguments directly
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx2g -XX:MaxMetaspaceSize=512m"

# For production deployment
java -Xms512m -Xmx1024m -jar rct-backend.jar
```

### 2. Database Issues

#### Issue: H2 Console not accessible

**Symptoms:**
- 404 error when accessing `/h2-console`
- Console shows but cannot connect

**Solutions:**
```yaml
# Ensure H2 console is enabled in application.yml
spring:
  h2:
    console:
      enabled: true
      path: /h2-console
  datasource:
    url: jdbc:h2:mem:rctdb
    username: sa
    password: 
```

**Connection Settings:**
- JDBC URL: `jdbc:h2:mem:rctdb`
- Username: `sa`
- Password: (leave empty)

#### Issue: PostgreSQL connection refused

**Symptoms:**
- `Connection refused` errors
- `FATAL: database "rctdb" does not exist`

**Diagnosis:**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check if database exists
psql -h localhost -p 5432 -U postgres -l

# Check user permissions
psql -h localhost -p 5432 -U postgres -c "\du"
```

**Solutions:**
```bash
# Start PostgreSQL
systemctl start postgresql  # Linux
brew services start postgresql  # macOS

# Create database and user
psql -h localhost -p 5432 -U postgres
CREATE DATABASE rctdb;
CREATE USER rctuser WITH PASSWORD 'rctpass';
GRANT ALL PRIVILEGES ON DATABASE rctdb TO rctuser;
\q

# Test connection
psql -h localhost -p 5432 -U rctuser -d rctdb
```

#### Issue: Flyway migration failures

**Symptoms:**
- `FlywayException: Migration failed`
- Schema version conflicts

**Solutions:**
```bash
# Check migration status
./mvnw flyway:info

# Repair migration history
./mvnw flyway:repair

# Clean and migrate (CAUTION: destroys data)
./mvnw flyway:clean flyway:migrate

# Skip specific migration
./mvnw flyway:migrate -Dflyway.target=1.2
```

### 3. Build Issues

#### Issue: Maven build failures

**Symptoms:**
- Compilation errors
- Test failures
- Plugin execution failures

**Diagnosis:**
```bash
# Run with debug output
./mvnw clean compile -X

# Check dependency tree
./mvnw dependency:tree

# Verify Java version
./mvnw -version
```

**Solutions:**

**Compilation Errors:**
```bash
# Clean and rebuild
./mvnw clean compile

# Update dependencies
./mvnw versions:use-latest-versions

# Skip tests temporarily
./mvnw package -DskipTests
```

**Test Failures:**
```bash
# Run specific test
./mvnw test -Dtest=UserServiceTest

# Run tests with more memory
export MAVEN_OPTS="-Xmx2g"
./mvnw test

# Skip failing tests temporarily
./mvnw test -Dmaven.test.failure.ignore=true
```

**Plugin Issues:**
```bash
# Skip problematic plugins
./mvnw package -Dcheckstyle.skip -Dpmd.skip

# Update plugin versions
./mvnw versions:display-plugin-updates
```

#### Issue: Spotless formatting failures

**Symptoms:**
- Build fails with formatting violations
- `spotless:check` reports issues

**Solutions:**
```bash
# Apply automatic formatting
./mvnw spotless:apply

# Check what would be changed
./mvnw spotless:check

# Skip formatting check temporarily
./mvnw package -Dspotless.check.skip=true
```

### 4. Testing Issues

#### Issue: Integration tests failing

**Symptoms:**
- TestContainers startup failures
- Database connection issues in tests
- Random test failures

**Solutions:**

**TestContainers Issues:**
```bash
# Check Docker status
docker ps
docker version

# Clean Docker resources
docker system prune -a

# Increase Docker memory
# Docker Desktop → Settings → Resources → Memory: 4GB+
```

**Test Database Issues:**
```yaml
# Use separate test profile
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
```

**Flaky Tests:**
```bash
# Run tests multiple times
./mvnw test -Dsurefire.rerunFailingTestsCount=3

# Run tests in isolation
./mvnw test -Dtest=UserServiceTest -DforkCount=1 -DreuseForks=false
```

#### Issue: Frontend tests failing

**Symptoms:**
- Jest tests timeout
- DOM manipulation errors
- Module import issues

**Solutions:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests with more memory
node --max-old-space-size=4096 node_modules/.bin/jest

# Debug specific test
npm test -- --testNamePattern="should create user" --verbose
```

### 5. Performance Issues

#### Issue: Slow application startup

**Symptoms:**
- Long startup times (>30 seconds)
- High CPU usage during startup

**Solutions:**
```bash
# Profile startup time
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-XX:+PrintGCDetails -XX:+PrintGCTimeStamps"

# Disable unnecessary auto-configurations
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.security.SecurityAutoConfiguration
```

#### Issue: High memory usage

**Symptoms:**
- OutOfMemoryError during runtime
- Gradual memory increase (memory leak)

**Diagnosis:**
```bash
# Monitor memory usage
jstat -gc <PID> 5s

# Generate heap dump
jcmd <PID> GC.run_finalization
jcmd <PID> VM.gc
jmap -dump:format=b,file=heapdump.hprof <PID>

# Analyze with tools like Eclipse MAT or VisualVM
```

**Solutions:**
```bash
# Tune JVM parameters
java -Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar

# Enable memory monitoring
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,heapdump
```

#### Issue: Slow database queries

**Symptoms:**
- High response times
- Database connection pool exhaustion

**Diagnosis:**
```sql
-- PostgreSQL: Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

**Solutions:**
```yaml
# Optimize connection pool
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

# Enable query logging
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### 6. Security Issues

#### Issue: CORS errors

**Symptoms:**
- Browser console shows CORS errors
- API calls fail from frontend

**Solutions:**
```java
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

#### Issue: Authentication failures

**Symptoms:**
- 401 Unauthorized errors
- JWT token validation failures

**Diagnosis:**
```bash
# Check token format
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | base64 -d

# Verify token expiration
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/auth/validate
```

**Solutions:**
```java
// Check JWT configuration
@Value("${jwt.secret}")
private String jwtSecret;

@Value("${jwt.expiration}")
private long jwtExpiration;

// Ensure secret is properly set
logging:
  level:
    com.rct.security: DEBUG
```

### 7. Deployment Issues

#### Issue: Docker build failures

**Symptoms:**
- Docker build stops with errors
- Image size too large

**Solutions:**
```dockerfile
# Multi-stage build to reduce size
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine
COPY --from=builder /app/target/rct-backend-*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Build Optimization:**
```bash
# Use .dockerignore
echo "target/
.git/
*.md
.env" > .dockerignore

# Build with specific platform
docker build --platform linux/amd64 -t rct-backend .
```

#### Issue: Container startup failures

**Symptoms:**
- Container exits immediately
- Health checks failing

**Diagnosis:**
```bash
# Check container logs
docker logs rct-backend

# Run container interactively
docker run -it rct-backend /bin/sh

# Check environment variables
docker exec rct-backend env
```

**Solutions:**
```yaml
# docker-compose.yml with proper health checks
services:
  rct-backend:
    image: rct-backend:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    environment:
      - SPRING_PROFILES_ACTIVE=docker
```

### 8. Network Issues

#### Issue: API endpoints not accessible

**Symptoms:**
- Connection refused errors
- Timeouts when calling APIs

**Diagnosis:**
```bash
# Check if service is listening
netstat -tulpn | grep :8080

# Test connectivity
curl -v http://localhost:8080/actuator/health

# Check firewall rules
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS/RHEL
```

**Solutions:**
```bash
# Open firewall port
sudo ufw allow 8080  # Ubuntu
sudo firewall-cmd --add-port=8080/tcp --permanent  # CentOS/RHEL

# Check application binding
server:
  address: 0.0.0.0  # Bind to all interfaces
  port: 8080
```

## Environment-Specific Issues

### Development Environment

#### Issue: Hot reload not working

**Solutions:**
```xml
<!-- Add Spring Boot DevTools -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

```yaml
# Enable DevTools
spring:
  devtools:
    restart:
      enabled: true
    livereload:
      enabled: true
```

### Production Environment

#### Issue: Application crashes under load

**Symptoms:**
- OutOfMemoryError under high traffic
- Connection pool exhaustion

**Solutions:**
```yaml
# Production tuning
server:
  tomcat:
    max-threads: 200
    min-spare-threads: 10
    max-connections: 8192

spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
```

```bash
# JVM tuning for production
JAVA_OPTS="-Xms1g -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

## Monitoring and Alerting

### Setting up Monitoring

```yaml
# Enable all actuator endpoints for debugging
management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    health:
      show-details: always
```

### Log Analysis

```bash
# Search for errors
grep -i error logs/application.log

# Find memory issues
grep -i "outofmemory\|heap" logs/application.log

# Database connection issues
grep -i "connection\|timeout" logs/application.log

# Performance issues
grep -i "slow\|timeout\|performance" logs/application.log
```

### Performance Monitoring

```bash
# Monitor JVM metrics
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# Monitor HTTP metrics
curl http://localhost:8080/actuator/metrics/http.server.requests

# Monitor database metrics
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

## Getting Help

### Information to Collect

When reporting issues, include:

1. **Environment Information:**
   ```bash
   java -version
   ./mvnw -version
   docker --version
   uname -a  # Linux/macOS
   ```

2. **Application Logs:**
   ```bash
   # Last 100 lines of logs
   tail -n 100 logs/application.log
   
   # Error logs only
   grep -i error logs/application.log | tail -20
   ```

3. **Configuration:**
   ```bash
   # Active profiles
   curl http://localhost:8080/actuator/env | jq '.activeProfiles'
   
   # Configuration properties
   curl http://localhost:8080/actuator/configprops
   ```

4. **System Resources:**
   ```bash
   # Memory usage
   free -h  # Linux
   vm_stat  # macOS
   
   # Disk space
   df -h
   
   # CPU usage
   top -n 1
   ```

### Support Channels

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general help
- **Documentation**: Check `/docs` folder for detailed guides
- **Stack Overflow**: Tag questions with `remindcodetyping`

### Emergency Procedures

#### Application Down

1. **Check health endpoint:**
   ```bash
   curl http://localhost:8080/actuator/health
   ```

2. **Restart application:**
   ```bash
   # Docker
   docker restart rct-backend
   
   # Systemd
   sudo systemctl restart rct-backend
   
   # Manual
   pkill -f rct-backend
   ./mvnw spring-boot:run
   ```

3. **Check logs for errors:**
   ```bash
   tail -f logs/application.log
   ```

#### Database Issues

1. **Check database connectivity:**
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Restart database:**
   ```bash
   sudo systemctl restart postgresql
   ```

3. **Check database logs:**
   ```bash
   tail -f /var/log/postgresql/postgresql-*.log
   ```

This troubleshooting guide should help resolve most common issues encountered during development and deployment of the RemindCodeTyping application.