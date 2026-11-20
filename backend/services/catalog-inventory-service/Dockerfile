# Multi-stage Dockerfile cho Catalog & Inventory Service (Spring Boot · JDK 21)
FROM maven:3.9.11-eclipse-temurin-21-alpine AS builder
WORKDIR /build

COPY pom.xml ./pom.xml
COPY shared/pom.xml ./shared/pom.xml
COPY gateway/pom.xml ./gateway/pom.xml
COPY services/auth-service/pom.xml ./services/auth-service/pom.xml
COPY services/catalog-inventory-service/pom.xml ./services/catalog-inventory-service/pom.xml
COPY services/sales-service/pom.xml ./services/sales-service/pom.xml

COPY shared/src ./shared/src
COPY services/catalog-inventory-service/src ./services/catalog-inventory-service/src

RUN mvn -f pom.xml -pl services/catalog-inventory-service -am clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache wget \
    && addgroup -S smartpos && adduser -S smartpos -G smartpos \
    && mkdir -p /app/uploads/products && chown -R smartpos:smartpos /app

COPY --from=builder /build/services/catalog-inventory-service/target/*.jar /app/catalog-inventory-service.jar
RUN chown -R smartpos:smartpos /app

USER smartpos
EXPOSE 8082

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8082/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/catalog-inventory-service.jar"]
