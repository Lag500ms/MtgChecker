# Runtime image only. Build the jar first:
#   .\mvnw.cmd -DskipTests package
# then:
#   docker compose up --build -d

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd --system app \
    && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app

COPY target/MtgChecker-0.0.1-SNAPSHOT.jar /app/app.jar
COPY tessdata /app/tessdata

USER app
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
