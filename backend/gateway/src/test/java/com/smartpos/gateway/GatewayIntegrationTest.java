package com.smartpos.gateway;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.netty.DisposableServer;
import reactor.netty.http.server.HttpServer;

import javax.crypto.SecretKey;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class GatewayIntegrationTest {

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static DisposableServer mockAuthServer;
    private static DisposableServer mockSalesServer;
    private static DisposableServer mockCatalogServer;
    private static SecretKey signingKey;

    @LocalServerPort
    private int gatewayPort;

    private WebTestClient client() {
        return WebTestClient.bindToServer()
                .baseUrl("http://localhost:" + gatewayPort)
                .responseTimeout(Duration.ofSeconds(10))
                .build();
    }

    @BeforeAll
    static void startMockBackends() {
        signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(TEST_SECRET));

        mockAuthServer = HttpServer.create()
                .port(0)
                .route(routes -> routes
                        .post("/api/auth/login", (req, res) -> {
                            String origin = req.requestHeaders().get("Origin");
                            if (origin != null) {
                                res.header("Access-Control-Allow-Origin", origin);
                            }
                            return res.status(200)
                                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                    .header(HttpHeaders.SET_COOKIE, "refreshToken=rt-demo-123; Path=/; HttpOnly")
                                    .sendString(Mono.just("{\"accessToken\":\"at-123\"}"));
                        })
                        .post("/api/auth/refresh", (req, res) -> {
                            String cookie = req.requestHeaders().get(HttpHeaders.COOKIE);
                            return res.status(200)
                                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                    .sendString(Mono.just("{\"receivedCookie\":\"" + (cookie != null ? cookie : "") + "\"}"));
                        })
                        .get("/api/users", (req, res) -> {
                            String uid = req.requestHeaders().get("X-User-Id");
                            String role = req.requestHeaders().get("X-User-Role");
                            String uname = req.requestHeaders().get("X-User-Name");
                            String perms = req.requestHeaders().get("X-User-Permissions");
                            String cid = req.requestHeaders().get("X-Correlation-Id");
                            String internalService = req.requestHeaders().get("X-Internal-Service");
                            String internalSecret = req.requestHeaders().get("X-Internal-Secret");
                            String json = String.format(
                                    "{\"userId\":\"%s\",\"role\":\"%s\",\"username\":\"%s\",\"permissions\":\"%s\",\"cid\":\"%s\",\"internalService\":\"%s\",\"internalSecret\":\"%s\"}",
                                    safe(uid), safe(role), safe(uname), safe(perms), safe(cid),
                                    safe(internalService), safe(internalSecret));
                            return res.status(200)
                                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                    .sendString(Mono.just(json));
                        })
                )
                .bindNow();

        mockSalesServer = HttpServer.create()
                .port(0)
                .route(routes -> routes
                        .get("/api/sales/health", (req, res) -> res.status(200)
                                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                .sendString(Mono.just("{\"path\":\"" + req.uri() + "\"}")))
                        .get("/api/orders", (req, res) -> {
                            String uri = req.uri();
                            if (uri.contains("slow=true")) {
                                return Mono.delay(Duration.ofMillis(1200))
                                        .then(res.status(200).sendString(Mono.just("{\"slow\":true}")).then());
                            }
                            return res.status(200)
                                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                    .sendString(Mono.just("{\"downstreamPath\":\"" + uri + "\"}"));
                        })
                        .get("/ws-pos", (req, res) -> res.sendWebsocket((inbound, outbound) ->
                                outbound.sendString(inbound.receive().asString().map(msg -> "ECHO:" + msg))
                        ))
                )
                .bindNow();

        mockCatalogServer = HttpServer.create()
                .port(0)
                .route(routes -> routes
                        .get("/api/products/menu", (req, res) -> {
                            // Cố tình trả thêm Access-Control-Allow-Origin để test DedupeResponseHeader
                            return res.status(200)
                                    .header("Access-Control-Allow-Origin", "http://localhost:3000")
                                    .header(HttpHeaders.CONNECTION, "close")
                                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                    .sendString(Mono.just("{\"menuPath\":\"" + req.uri() + "\"}"));
                        })
                        .get("/api/ingredients", (req, res) -> res.status(200)
                                .header(HttpHeaders.CONNECTION, "close")
                                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                                .sendString(Mono.just("{\"ingredients\":[]}")))
                )
                .bindNow();
    }

    @AfterAll
    static void stopMockBackends() {
        if (mockAuthServer != null && !mockAuthServer.isDisposed()) mockAuthServer.disposeNow();
        if (mockSalesServer != null && !mockSalesServer.isDisposed()) mockSalesServer.disposeNow();
        if (mockCatalogServer != null && !mockCatalogServer.isDisposed()) mockCatalogServer.disposeNow();
    }

    @DynamicPropertySource
    static void registerDynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("AUTH_SERVICE_URL", () -> "http://localhost:" + mockAuthServer.port());
        registry.add("SALES_SERVICE_URL", () -> "http://localhost:" + mockSalesServer.port());
        registry.add("SALES_WS_URL", () -> "http://localhost:" + mockSalesServer.port());
        registry.add("CATALOG_INVENTORY_URL", () -> "http://localhost:" + mockCatalogServer.port());
        registry.add("spring.cloud.gateway.server.webflux.httpclient.response-timeout", () -> "600ms");
        registry.add("resilience4j.timelimiter.instances.catalogMenuCB.timeoutDuration", () -> "2s");
        registry.add("app.gateway.rate-limit.login-max-requests", () -> "4");
        registry.add("app.gateway.rate-limit.login-window-seconds", () -> "60");
        registry.add("app.gateway.rate-limit.trust-forwarded-headers", () -> "false");
    }

    private static String safe(String s) {
        return s != null ? s : "";
    }

    private String createJwt(Long userId, String username, String role, List<String> permissions) {
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("fullName", "Admin Test")
                .claim("role", role)
                .claim("permissions", permissions)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(signingKey)
                .compact();
    }

    @Test
    @Order(1)
    @DisplayName("RewritePath & Health route hoạt động đúng qua HTTP thực tế")
    void shouldRewritePathsAndRouteCorrectly() {
        client().get().uri("/api/sales/health")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .value(body -> assertThat(body).contains("/api/sales/health"));

        client().get().uri("/api/sales/orders?tableNumber=11")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .value(body -> assertThat(body).contains("/api/orders?tableNumber=11"));

        client().get().uri("/api/catalog/products/menu")
                .header("Origin", "http://localhost:3000")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().value("Access-Control-Allow-Origin", val -> assertThat(val).isEqualTo("http://localhost:3000"))
                .expectBody(String.class)
                .value(body -> assertThat(body).contains("/api/products/menu"))
                .returnResult();

        EntityExchangeResult<byte[]> result = client().get().uri("/api/catalog/products/menu")
                .header("Origin", "http://localhost:3000")
                .exchange()
                .expectStatus().isOk()
                .expectBody().returnResult();
        assertThat(result.getResponseHeaders().get("Access-Control-Allow-Origin"))
                .containsExactly("http://localhost:3000");
    }

    @Test
    @Order(2)
    @DisplayName("Chống giả mạo X-User-* và X-Internal-*, truyền đúng claims từ JWT kèm X-Correlation-Id xuống downstream")
    void shouldStripSpoofedHeadersAndInjectVerifiedUserHeaders() {
        String jwt = createJwt(42L, "manager01", "MANAGER", List.of("ADMIN_DASHBOARD", "USER_READ"));

        client().get().uri("/api/users")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                .header("X-User-Id", "999")
                .header("X-User-Role", "ADMIN")
                .header("X-Internal-Service", "sales-service")
                .header("X-Internal-Secret", "smartpos-internal-secret-2026")
                .header("X-Correlation-Id", "cid-e2e-users")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals("X-Correlation-Id", "cid-e2e-users")
                .expectBody()
                .jsonPath("$.userId").isEqualTo("42")
                .jsonPath("$.role").isEqualTo("MANAGER")
                .jsonPath("$.username").isEqualTo("manager01")
                .jsonPath("$.permissions").isEqualTo("ADMIN_DASHBOARD,USER_READ")
                .jsonPath("$.cid").isEqualTo("cid-e2e-users")
                .jsonPath("$.internalService").isEqualTo("")
                .jsonPath("$.internalSecret").isEqualTo("");
    }

    @Test
    @Order(3)
    @DisplayName("Truyền tiếp Set-Cookie khi login và Cookie khi refresh qua Gateway")
    void shouldForwardCookiesOnAuthLoginAndRefresh() {
        client().post().uri("/api/auth/login")
                .header("X-Forwarded-For", "192.168.10.10")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"username\":\"admin\",\"password\":\"12345678\"}")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().value(HttpHeaders.SET_COOKIE, cookie -> assertThat(cookie).contains("refreshToken=rt-demo-123"));

        client().post().uri("/api/auth/refresh")
                .header(HttpHeaders.COOKIE, "refreshToken=rt-demo-123")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .value(body -> assertThat(body).contains("refreshToken=rt-demo-123"));
    }

    @Test
    @Order(4)
    @DisplayName("Trả 401 và 404 kèm X-Correlation-Id và header CORS hợp lệ cho localhost, chặn origin lạ")
    void shouldIncludeCorrelationIdAndCorsOn401And404AndRejectUnknownOrigin() {
        // 401 giữ CORS cho localhost và có X-Correlation-Id
        client().get().uri("/api/sales/orders?page=0&size=20")
                .header("Origin", "http://localhost:3000")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().exists("X-Correlation-Id")
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:3000")
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.correlationId").isNotEmpty();

        // 404 giữ CORS cho localhost và có X-Correlation-Id
        client().get().uri("/api/non-existent-route")
                .header("Origin", "http://127.0.0.1:3000")
                .exchange()
                .expectStatus().isNotFound()
                .expectHeader().exists("X-Correlation-Id")
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://127.0.0.1:3000")
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.correlationId").isNotEmpty();

        // CORS chặn origin lạ
        client().options().uri("/api/catalog/products/menu")
                .header("Origin", "https://evil.example.com")
                .header("Access-Control-Request-Method", "GET")
                .exchange()
                .expectStatus().isForbidden();
    }

    @Test
    @Order(5)
    @DisplayName("Trả 504 Gateway Timeout khi downstream xử lý vượt response-timeout")
    void shouldReturn504WhenDownstreamTimesOut() {
        client().get().uri("/api/sales/orders?tableNumber=11&slow=true")
                .header("Origin", "http://localhost:3000")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.GATEWAY_TIMEOUT)
                .expectHeader().exists("X-Correlation-Id")
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:3000")
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.correlationId").isNotEmpty();
    }

    @Test
    @Order(6)
    @DisplayName("Rate Limit trả 429 khi vượt ngưỡng POST /api/auth/login dù client gửi X-Forwarded-For giả")
    void shouldEnforceRateLimitOnLogin() {
        for (int i = 0; i < 3; i++) {
            client().post().uri("/api/auth/login")
                    .header("X-Forwarded-For", "198.51.100." + (i + 1))
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue("{\"username\":\"admin\",\"password\":\"12345678\"}")
                    .exchange()
                    .expectStatus().isOk();
        }

        client().post().uri("/api/auth/login")
                .header("X-Forwarded-For", "198.51.100.99")
                .header("Origin", "http://localhost:3000")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"username\":\"admin\",\"password\":\"12345678\"}")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.TOO_MANY_REQUESTS)
                .expectHeader().exists("Retry-After")
                .expectHeader().exists("X-Correlation-Id")
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:3000")
                .expectBody()
                .jsonPath("$.success").isEqualTo(false);
    }

    @Test
    @Order(7)
    @DisplayName("WebSocket Upgrade thành công qua Gateway tới /ws-pos")
    void shouldProxyWebSocketUpgradeThroughGateway() throws Exception {
        CompletableFuture<String> receivedFuture = new CompletableFuture<>();
        HttpClient httpClient = HttpClient.newHttpClient();

        WebSocket ws = httpClient.newWebSocketBuilder()
                .buildAsync(URI.create("ws://localhost:" + gatewayPort + "/ws-pos"), new WebSocket.Listener() {
                    @Override
                    public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
                        receivedFuture.complete(data.toString());
                        return WebSocket.Listener.super.onText(webSocket, data, last);
                    }
                })
                .get(5, TimeUnit.SECONDS);

        ws.sendText("ping-smartpos", true).get(5, TimeUnit.SECONDS);
        String echo = receivedFuture.get(5, TimeUnit.SECONDS);
        assertThat(echo).isEqualTo("ECHO:ping-smartpos");
        ws.sendClose(WebSocket.NORMAL_CLOSURE, "done").get(5, TimeUnit.SECONDS);
    }

    @Test
    @Order(8)
    @DisplayName("Circuit Breaker fallback cho menu và 503 Service Unavailable khi backend tắt")
    void shouldTriggerCircuitBreakerFallbackAnd503WhenCatalogStops() {
        mockCatalogServer.disposeNow(Duration.ofSeconds(5));

        // Route menu có CircuitBreaker fallback -> trả JSON 503 từ GatewayFallbackController
        client().get().uri("/api/catalog/products/menu")
                .header("Origin", "http://localhost:3000")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.SERVICE_UNAVAILABLE)
                .expectHeader().exists("X-Correlation-Id")
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:3000")
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.message").value(msg -> assertThat(msg.toString()).contains("thực đơn"));

        // Route protected không có CircuitBreaker -> trả 503 từ GlobalGatewayExceptionHandler
        String jwt = createJwt(1L, "admin", "ADMIN", List.of("INVENTORY_VIEW"));
        client().get().uri("/api/catalog/ingredients")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                .header("Origin", "http://localhost:3000")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.SERVICE_UNAVAILABLE)
                .expectHeader().exists("X-Correlation-Id")
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:3000")
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.correlationId").isNotEmpty();
    }
}
