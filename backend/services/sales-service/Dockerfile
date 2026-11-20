# Multi-stage Dockerfile cho Sales Service (Spring Boot WebSocket STOMP · JDK 21)
FROM maven:3.9.11-eclipse-temurin-21-alpine AS builder
WORKDIR /build

COPY pom.xml ./pom.xml
COPY shared/pom.xml ./shared/pom.xml
COPY gateway/pom.xml ./gateway/pom.xml
COPY services/auth-service/pom.xml ./services/auth-service/pom.xml
COPY services/catalog-inventory-service/pom.xml ./services/catalog-inventory-service/pom.xml
COPY services/sales-service/pom.xml ./services/sales-service/pom.xml

COPY services/sales-service/src ./services/sales-service/src

RUN mvn -f pom.xml -pl services/sales-service -am clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache wget \
    && addgroup -S smartpos && adduser -S smartpos -G smartpos

COPY --from=builder /build/services/sales-service/target/*.jar /app/sales-service.jar
RUN chown -R smartpos:smartpos /app

USER smartpos
EXPOSE 8083

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8083/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/sales-service.jar"]
