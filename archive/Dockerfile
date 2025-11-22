# Single-stage build - simpler and more reliable
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Install curl and bash for better shell support
RUN apk add --no-cache curl bash

# Copy the entire rct-backend directory
COPY rct-backend/ ./

# Make gradlew executable and verify
RUN chmod +x gradlew && ls -la gradlew

# Use bash to run gradlew (more reliable than sh)
RUN bash ./gradlew clean bootJar --no-daemon --stacktrace

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application with optimized JVM settings
ENTRYPOINT ["java", \
    "-Dspring.profiles.active=railway", \
    "-Dserver.port=8080", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "build/libs/rct-backend-0.0.1-SNAPSHOT.jar"]