# Build Stage
FROM eclipse-temurin:23-jdk-alpine AS build
WORKDIR /app

# Copy project files
COPY . .

# Senior Developer Fix: Strip Windows carriage returns (CRLF) from gradlew to prevent Linux container build failures
RUN tr -d '\r' < gradlew > gradlew-unix && chmod +x gradlew-unix

# Build the Spring Boot application jar (skipping unit tests for deployment speed)
RUN ./gradlew-unix build -x test --no-daemon

# Run Stage
FROM eclipse-temurin:23-jre-alpine
WORKDIR /app

# Copy the built jar from the build stage (uses wildcard to match whatever name Gradle outputs)
COPY --from=build /app/build/libs/*.jar app.jar

# Expose Tomcat default port
EXPOSE 8080

# Execute Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
