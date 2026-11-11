package com.smartpos.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;

import static org.assertj.core.api.Assertions.assertThat;

class InMemoryRateLimitFilterTest {

    private InMemoryRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new InMemoryRateLimitFilter();
        ReflectionTestUtils.setField(filter, "enabled", true);
        ReflectionTestUtils.setField(filter, "loginMaxRequests", 2);
        ReflectionTestUtils.setField(filter, "loginWindowSeconds", 60L);
        ReflectionTestUtils.setField(filter, "orderMaxRequests", 2);
        ReflectionTestUtils.setField(filter, "orderWindowSeconds", 60L);
        ReflectionTestUtils.setField(filter, "trustForwardedHeaders", false);
    }

    @Test
    @DisplayName("Trả 429 Too Many Requests khi vượt ngưỡng đăng nhập theo remoteAddress và không thể bypass bằng X-Forwarded-For giả")
    void shouldReturn429WhenLoginRateLimitExceeded() {
        WebFilterChain okChain = ex -> {
            ex.getResponse().setStatusCode(HttpStatus.OK);
            return Mono.empty();
        };

        for (int i = 0; i < 2; i++) {
            MockServerHttpRequest req = MockServerHttpRequest.post("/api/auth/login")
                    .remoteAddress(new InetSocketAddress("10.10.1.5", 10000 + i))
                    .header("X-Forwarded-For", "198.51.100." + (i + 1))
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(req);
            filter.filter(exchange, okChain).block();
            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        MockServerHttpRequest blockedReq = MockServerHttpRequest.post("/api/auth/login")
                .remoteAddress(new InetSocketAddress("10.10.1.5", 10099))
                .header("X-Forwarded-For", "203.0.113.250")
                .build();
        MockServerWebExchange blockedExchange = MockServerWebExchange.from(blockedReq);
        blockedExchange.getAttributes().put(CorrelationIdAndLoggingFilter.ATTR_CORRELATION_ID, "cid-429");

        filter.filter(blockedExchange, ex -> Mono.error(new AssertionError("Should be rate limited"))).block();

        assertThat(blockedExchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(blockedExchange.getResponse().getHeaders().getFirst("Retry-After")).isNotBlank();
        String body = blockedExchange.getResponse().getBodyAsString().block();
        assertThat(body).contains("\"success\":false");
        assertThat(body).contains("\"correlationId\":\"cid-429\"");
    }

    @Test
    @DisplayName("Không giới hạn IP khác hoặc các GET endpoint thông thường")
    void shouldAllowDifferentIpAndNonLimitedEndpoints() {
        WebFilterChain okChain = ex -> {
            ex.getResponse().setStatusCode(HttpStatus.OK);
            return Mono.empty();
        };

        for (int i = 0; i < 5; i++) {
            MockServerHttpRequest getReq = MockServerHttpRequest.get("/api/catalog/products/menu")
                    .remoteAddress(new InetSocketAddress("10.10.1.5", 12000 + i))
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(getReq);
            filter.filter(exchange, okChain).block();
            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        MockServerHttpRequest otherIpReq = MockServerHttpRequest.post("/api/sales/orders")
                .remoteAddress(new InetSocketAddress("10.10.1.99", 12001))
                .build();
        MockServerWebExchange otherExchange = MockServerWebExchange.from(otherIpReq);
        filter.filter(otherExchange, okChain).block();
        assertThat(otherExchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Chỉ dùng X-Forwarded-For khi bật trustForwardedHeaders sau reverse proxy tin cậy")
    void shouldUseForwardedForOnlyWhenTrustedProxyEnabled() {
        ReflectionTestUtils.setField(filter, "trustForwardedHeaders", true);
        WebFilterChain okChain = ex -> {
            ex.getResponse().setStatusCode(HttpStatus.OK);
            return Mono.empty();
        };

        for (int i = 0; i < 2; i++) {
            MockServerHttpRequest req = MockServerHttpRequest.post("/api/auth/login")
                    .remoteAddress(new InetSocketAddress("127.0.0.1", 8080))
                    .header("X-Forwarded-For", "203.0.113.10, 127.0.0.1")
                    .build();
            MockServerWebExchange exchange = MockServerWebExchange.from(req);
            filter.filter(exchange, okChain).block();
            assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        MockServerHttpRequest sameClientBlocked = MockServerHttpRequest.post("/api/auth/login")
                .remoteAddress(new InetSocketAddress("127.0.0.1", 8080))
                .header("X-Forwarded-For", "203.0.113.10, 127.0.0.1")
                .build();
        MockServerWebExchange blockedExchange = MockServerWebExchange.from(sameClientBlocked);
        filter.filter(blockedExchange, ex -> Mono.error(new AssertionError("Should be rate limited"))).block();
        assertThat(blockedExchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);

        MockServerHttpRequest otherClientAllowed = MockServerHttpRequest.post("/api/auth/login")
                .remoteAddress(new InetSocketAddress("127.0.0.1", 8080))
                .header("X-Forwarded-For", "203.0.113.11, 127.0.0.1")
                .build();
        MockServerWebExchange allowedExchange = MockServerWebExchange.from(otherClientAllowed);
        filter.filter(allowedExchange, okChain).block();
        assertThat(allowedExchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
