# Multi-stage build for Spring Boot application
FROM openjdk:17-jdk-slim AS builder

WORKDIR /app

# Copy only backend files
COPY rct-backend/gradle rct-backend/gradle
COPY rct-backend/gradlew rct-backend/gradlew
COPY rct-backend/gradlew.bat rct-backend/gradlew.bat
COPY rct-backend/build.gradle rct-backend/build.gradle
COPY rct-backend/settings.gradle rct-backend/settings.gradle

# Copy source code
COPY rct-backend/src rct-backend/src

# Build the application
WORKDIR /app/rct-backend
RUN chmod +x gradlew
RUN ./gradlew clean bootJar --no-daemon --stacktrace

# Runtime stage
FROM openjdk:17-jre-slim

WORKDIR /app

# Copy the built JAR
COPY --from=builder /app/rct-backend/build/libs/rct-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-Dspring.profiles.active=railway", "-Dserver.port=8080", "-jar", "app.jar"]