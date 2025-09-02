# Multi-stage Dockerfile for optimized production builds
FROM eclipse-temurin:17-jdk-alpine AS builder

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml first for better layer caching
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests -P production

# Extract layers for better Docker layer caching
RUN java -Djarmode=layertools -jar target/*.jar extract

# Production stage
FROM eclipse-temurin:17-jre-alpine AS production

# Install security updates and create non-root user
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy application layers from builder stage
COPY --from=builder --chown=appuser:appgroup app/dependencies/ ./
COPY --from=builder --chown=appuser:appgroup app/spring-boot-loader/ ./
COPY --from=builder --chown=appuser:appgroup app/snapshot-dependencies/ ./
COPY --from=builder --chown=appuser:appgroup app/application/ ./

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Set JVM options for production
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.JarLauncher"]

# Development stage (for local development)
FROM eclipse-temurin:17-jdk-alpine AS development

WORKDIR /app

# Install development tools
RUN apk add --no-cache curl bash

# Copy Maven wrapper
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Expose port and debug port
EXPOSE 8080 5005

# Run in development mode with hot reload
ENTRYPOINT ["./mvnw", "spring-boot:run", "-Dspring-boot.run.jvmArguments=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"]