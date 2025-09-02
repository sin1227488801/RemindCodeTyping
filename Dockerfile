# Use Eclipse Temurin (AdoptOpenJDK successor) - more reliable
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Install curl for health checks (Alpine needs explicit installation)
RUN apk add --no-cache curl

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
RUN ./gradlew clean bootJar --no-daemon --stacktrace --info

# Runtime stage - use JRE for smaller image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001 -G spring

# Copy the built JAR
COPY --from=builder /app/rct-backend/build/libs/rct-backend-0.0.1-SNAPSHOT.jar app.jar

# Change ownership to spring user
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application with optimized JVM settings for containers
ENTRYPOINT ["java", \
    "-Dspring.profiles.active=railway", \
    "-Dserver.port=8080", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseG1GC", \
    "-XX:+UseStringDeduplication", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]