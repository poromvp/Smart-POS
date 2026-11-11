package com.smartpos.gateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationFilterTest {

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private JwtAuthenticationFilter filter;
    private SecretKey signingKey;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter();
        ReflectionTestUtils.setField(filter, "secret", TEST_SECRET);
        filter.init();
        signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(TEST_SECRET));
    }

    private String generateToken(Long userId, String username, String fullName, String role, List<String> permissions, Instant expiration) {
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("fullName", fullName)
                .claim("role", role)
                .claim("permissions", permissions)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiration))
                .signWith(signingKey)
                .compact();
    }

    @Test
    @DisplayName("Chặn giả mạo Header X-User-* và X-Internal-* trên endpoint công khai khi không có JWT")
    void shouldStripSpoofedUserHeadersOnPublicEndpoint() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/catalog/products/menu")
                .header(JwtAuthenticationFilter.HEADER_USER_ID, "999")
                .header(JwtAuthenticationFilter.HEADER_USER_ROLE, "ADMIN")
                .header(JwtAuthenticationFilter.HEADER_USER_NAME, "hacker")
                .header(JwtAuthenticationFilter.HEADER_USER_PERMISSIONS, "ALL")
                .header(JwtAuthenticationFilter.HEADER_INTERNAL_SERVICE, "sales-service")
                .header(JwtAuthenticationFilter.HEADER_INTERNAL_SECRET, "smartpos-internal-secret-2026")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwarded.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isNotNull();
        HttpHeaders downstreamHeaders = forwarded.get().getRequest().getHeaders();
        assertThat(downstreamHeaders.containsHeader(JwtAuthenticationFilter.HEADER_USER_ID)).isFalse();
        assertThat(downstreamHeaders.containsHeader(JwtAuthenticationFilter.HEADER_USER_ROLE)).isFalse();
        assertThat(downstreamHeaders.containsHeader(JwtAuthenticationFilter.HEADER_USER_NAME)).isFalse();
        assertThat(downstreamHeaders.containsHeader(JwtAuthenticationFilter.HEADER_USER_PERMISSIONS)).isFalse();
        assertThat(downstreamHeaders.containsHeader(JwtAuthenticationFilter.HEADER_INTERNAL_SERVICE)).isFalse();
        assertThat(downstreamHeaders.containsHeader(JwtAuthenticationFilter.HEADER_INTERNAL_SECRET)).isFalse();
    }

    @Test
    @DisplayName("Xóa sạch X-Internal-Service và X-Internal-Secret kể cả khi client gửi kèm JWT hợp lệ")
    void shouldStripSpoofedInternalHeadersOnProtectedEndpoint() {
        String waiterToken = generateToken(15L, "waiter01", "Lê Phục Vụ", "WAITER",
                List.of("ORDER_CREATE"), Instant.now().plusSeconds(3600));

        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/catalog/inventory/deduct")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + waiterToken)
                .header(JwtAuthenticationFilter.HEADER_INTERNAL_SERVICE, "sales-service")
                .header(JwtAuthenticationFilter.HEADER_INTERNAL_SECRET, "smartpos-internal-secret-2026")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        filter.filter(exchange, ex -> {
            forwarded.set(ex);
            return Mono.empty();
        }).block();

        assertThat(forwarded.get()).isNotNull();
        HttpHeaders downstreamHeaders = forwarded.get().getRequest().getHeaders();
        assertThat(downstreamHeaders.containsHeader(JwtAuthenticationFilter.HEADER_INTERNAL_SERVICE)).isFalse();
        assertThat(downstreamHeaders.containsHeader(JwtAuthenticationFilter.HEADER_INTERNAL_SECRET)).isFalse();
        assertThat(downstreamHeaders.getFirst(JwtAuthenticationFilter.HEADER_USER_ROLE)).isEqualTo("WAITER");
    }

    @Test
    @DisplayName("Giải mã JWT hợp lệ và truyền đúng header X-User-* xuống downstream")
    void shouldEnrichHeadersWhenValidJwtProvided() {
        String token = generateToken(7L, "cashier01", "Vũ Thu Ngân", "CASHIER",
                List.of("POS_ACCESS", "PAYMENT_PROCESS"), Instant.now().plusSeconds(3600));

        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/sales/orders/1/checkout")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .header(JwtAuthenticationFilter.HEADER_USER_ROLE, "ADMIN")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwarded.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isNotNull();
        HttpHeaders downstreamHeaders = forwarded.get().getRequest().getHeaders();
        assertThat(downstreamHeaders.getFirst(JwtAuthenticationFilter.HEADER_USER_ID)).isEqualTo("7");
        assertThat(downstreamHeaders.getFirst(JwtAuthenticationFilter.HEADER_USER_ROLE)).isEqualTo("CASHIER");
        assertThat(downstreamHeaders.getFirst(JwtAuthenticationFilter.HEADER_USER_NAME)).isEqualTo("cashier01");
        assertThat(downstreamHeaders.getFirst(JwtAuthenticationFilter.HEADER_USER_PERMISSIONS))
                .isEqualTo("POS_ACCESS,PAYMENT_PROCESS");
    }

    @Test
    @DisplayName("Encode an toàn X-User-Name khi sub rỗng và fallback sang fullName có dấu tiếng Việt")
    void shouldEncodeNonAsciiFallbackFullNameInUserNameHeader() {
        String token = generateToken(8L, null, "Nguyễn Văn Bếp", "CHEF",
                List.of("KDS_VIEW"), Instant.now().plusSeconds(3600));

        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/sales/orders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        filter.filter(exchange, ex -> {
            forwarded.set(ex);
            return Mono.empty();
        }).block();

        String headerName = forwarded.get().getRequest().getHeaders().getFirst(JwtAuthenticationFilter.HEADER_USER_NAME);
        assertThat(headerName).isEqualTo(URLEncoder.encode("Nguyễn Văn Bếp", StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("Trả 401 Unauthorized cho các route bảo mật và route quản trị/IDOR đã siết chặt")
    void shouldReturn401WhenProtectedRouteMissingToken() {
        List<MockServerHttpRequest> protectedRequests = List.of(
                MockServerHttpRequest.get("/api/users").build(),
                MockServerHttpRequest.post("/api/inventory/deduct").build(),
                MockServerHttpRequest.get("/api/sales/orders").build(),
                MockServerHttpRequest.get("/api/orders").build(),
                MockServerHttpRequest.get("/api/sales/orders?page=0&size=20").build(),
                MockServerHttpRequest.get("/api/sales/orders?tableNumber=11&page=0").build(),
                MockServerHttpRequest.get("/api/sales/orders?tableNumber=11&startDate=2026-01-01T00:00:00").build(),
                MockServerHttpRequest.get("/api/sales/orders/12").build(),
                MockServerHttpRequest.get("/api/orders/code/ORD-001").build(),
                MockServerHttpRequest.get("/api/sales/orders/statistics").build(),
                MockServerHttpRequest.post("/api/sales/orders/1/checkout").build(),
                MockServerHttpRequest.delete("/api/catalog/products/1").build(),
                MockServerHttpRequest.get("/api/catalog/products").build(),
                MockServerHttpRequest.get("/api/catalog/products/1").build(),
                MockServerHttpRequest.get("/api/catalog/ingredients").build(),
                MockServerHttpRequest.get("/actuator/gateway/routes").build(),
                MockServerHttpRequest.get("/v3/api-docs").build(),
                MockServerHttpRequest.get("/api/catalog/uploads/products/test.jpg").build()
        );

        for (MockServerHttpRequest request : protectedRequests) {
            MockServerWebExchange exchange = MockServerWebExchange.from(request);
            exchange.getAttributes().put(CorrelationIdAndLoggingFilter.ATTR_CORRELATION_ID, "cid-401-test");
            GatewayFilterChain chain = ex -> Mono.error(new AssertionError("Should not reach downstream chain"));

            filter.filter(exchange, chain).block();

            assertThat(exchange.getResponse().getStatusCode())
                    .as("Expected 401 for %s %s", request.getMethod(), request.getURI().toString())
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
            String body = exchange.getResponse().getBodyAsString().block();
            assertThat(body).contains("\"success\":false");
            assertThat(body).contains("\"correlationId\":\"cid-401-test\"");
        }
    }

    @Test
    @DisplayName("Trả 401 Unauthorized khi truy cập route bảo mật với JWT hết hạn")
    void shouldReturn401WhenProtectedRouteHasExpiredToken() {
        String expiredToken = generateToken(1L, "admin", "System Admin", "ADMIN",
                List.of("ADMIN_DASHBOARD"), Instant.now().minusSeconds(60));

        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/orders/statistics")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, ex -> Mono.error(new AssertionError("Should not pass"))).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Cho phép truy cập công khai đúng các endpoint Đăng nhập, Menu QR, Tra cứu đơn theo tableNumber hợp lệ và WebSocket")
    void shouldAllowPublicEndpointsWithoutToken() {
        MultiValueMap<String, String> emptyParams = new LinkedMultiValueMap<>();
        MultiValueMap<String, String> tableParams = new LinkedMultiValueMap<>();
        tableParams.add("tableNumber", "11");

        MultiValueMap<String, String> pagedTableParams = new LinkedMultiValueMap<>();
        pagedTableParams.add("tableNumber", "11");
        pagedTableParams.add("page", "0");

        assertThat(filter.isPublicEndpoint(HttpMethod.POST, "/api/auth/login", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.POST, "/api/auth/refresh", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/actuator/health", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/sales/health", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/catalog/products/menu", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/products/menu", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/uploads/products/test.jpg", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.POST, "/api/sales/orders", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.POST, "/api/sales/orders/12/items", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.POST, "/api/sales/promotions/apply", emptyParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/sales/orders", tableParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/orders", tableParams)).isTrue();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/ws-pos/info", emptyParams)).isTrue();

        // Các trường hợp bị siết chặt phải trả false
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/sales/orders", emptyParams)).isFalse();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/sales/orders", pagedTableParams)).isFalse();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/sales/orders/12", emptyParams)).isFalse();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/sales/orders/code/ORD-01", emptyParams)).isFalse();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/sales/orders/statistics", emptyParams)).isFalse();
        assertThat(filter.isPublicEndpoint(HttpMethod.POST, "/api/sales/orders/12/checkout", emptyParams)).isFalse();
        assertThat(filter.isPublicEndpoint(HttpMethod.POST, "/api/catalog/inventory/deduct", emptyParams)).isFalse();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/api/catalog/products", emptyParams)).isFalse();
        assertThat(filter.isPublicEndpoint(HttpMethod.GET, "/actuator/gateway/routes", emptyParams)).isFalse();
    }
}
