package com.smartpos.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-Memory Rate Limiter WebFilter (không phụ thuộc Redis).
 * Bảo vệ endpoint đăng nhập (chống brute-force) và tạo đơn QR (chống spam).
 */
@Component
public class InMemoryRateLimitFilter implements WebFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(InMemoryRateLimitFilter.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final AtomicInteger cleanupTick = new AtomicInteger(0);

    @Value("${app.gateway.rate-limit.enabled:true}")
    private boolean enabled = true;

    @Value("${app.gateway.rate-limit.login-max-requests:15}")
    private int loginMaxRequests = 15;

    @Value("${app.gateway.rate-limit.login-window-seconds:60}")
    private long loginWindowSeconds = 60;

    @Value("${app.gateway.rate-limit.order-max-requests:30}")
    private int orderMaxRequests = 30;

    @Value("${app.gateway.rate-limit.order-window-seconds:60}")
    private long orderWindowSeconds = 60;

    @Value("${app.gateway.rate-limit.trust-forwarded-headers:false}")
    private boolean trustForwardedHeaders = false;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (!enabled) {
            return chain.filter(exchange);
        }

        ServerHttpRequest request = exchange.getRequest();
        HttpMethod method = request.getMethod();
        String path = request.getURI().getRawPath();

        if (!HttpMethod.POST.equals(method) || path == null) {
            return chain.filter(exchange);
        }

        RateLimitRule rule = resolveRule(path);
        if (rule == null) {
            return chain.filter(exchange);
        }

        String clientIp = extractClientIp(request);
        String key = rule.bucketPrefix() + ":" + clientIp;
        long nowMillis = System.currentTimeMillis();
        long windowMillis = rule.windowSeconds() * 1000L;

        WindowCounter counter = counters.compute(key, (k, existing) -> {
            if (existing == null || nowMillis - existing.windowStartMillis >= windowMillis) {
                return new WindowCounter(nowMillis, 1);
            }
            existing.count.incrementAndGet();
            return existing;
        });

        // Dọn dẹp định kỳ tránh tích tụ key cũ
        if (cleanupTick.incrementAndGet() % 500 == 0) {
            evictExpiredEntries(nowMillis, Math.max(loginWindowSeconds, orderWindowSeconds) * 2000L);
        }

        if (counter.count.get() > rule.maxRequests()) {
            long retryAfterSeconds = Math.max(1L,
                    (counter.windowStartMillis + windowMillis - nowMillis + 999L) / 1000L);
            log.warn("[Gateway RateLimit] Vượt giới hạn {} cho IP={} tại {} {} ({}/{})",
                    rule.bucketPrefix(), clientIp, method, path, counter.count.get(), rule.maxRequests());
            return writeTooManyRequestsResponse(exchange, path, retryAfterSeconds, rule.message());
        }

        return chain.filter(exchange);
    }

    private RateLimitRule resolveRule(String path) {
        if ("/api/auth/login".equals(path)) {
            return new RateLimitRule("login", loginMaxRequests, loginWindowSeconds,
                    "Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.");
        }
        if ("/api/orders".equals(path) || "/api/sales/orders".equals(path)) {
            return new RateLimitRule("order", orderMaxRequests, orderWindowSeconds,
                    "Bạn đang gửi quá nhiều yêu cầu tạo đơn. Vui lòng thử lại sau.");
        }
        return null;
    }

    private String extractClientIp(ServerHttpRequest request) {
        if (trustForwardedHeaders) {
            String forwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                int commaIdx = forwardedFor.indexOf(',');
                String candidate = (commaIdx > 0 ? forwardedFor.substring(0, commaIdx) : forwardedFor).trim();
                if (!candidate.isBlank()) {
                    return candidate;
                }
            }
        }
        InetSocketAddress remoteAddr = request.getRemoteAddress();
        if (remoteAddr != null) {
            if (remoteAddr.getAddress() != null) {
                return remoteAddr.getAddress().getHostAddress();
            }
            if (remoteAddr.getHostString() != null && !remoteAddr.getHostString().isBlank()) {
                return remoteAddr.getHostString().trim();
            }
        }
        return "unknown";
    }

    private void evictExpiredEntries(long nowMillis, long maxAgeMillis) {
        counters.entrySet().removeIf(entry -> nowMillis - entry.getValue().windowStartMillis > maxAgeMillis);
    }

    private Mono<Void> writeTooManyRequestsResponse(
            ServerWebExchange exchange,
            String path,
            long retryAfterSeconds,
            String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set("Retry-After", String.valueOf(retryAfterSeconds));

        String correlationId = resolveCorrelationId(exchange);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", message);
        body.put("data", null);
        body.put("path", path);
        if (correlationId != null) {
            body.put("correlationId", correlationId);
        }
        body.put("timestamp", LocalDateTime.now().toString());

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (Exception e) {
            bytes = ("{\"success\":false,\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    private String resolveCorrelationId(ServerWebExchange exchange) {
        Object attrCid = exchange.getAttribute(CorrelationIdAndLoggingFilter.ATTR_CORRELATION_ID);
        if (attrCid instanceof String str && !str.isBlank()) {
            return str;
        }
        String reqCid = exchange.getRequest().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
        if (reqCid != null && !reqCid.isBlank()) {
            return reqCid.trim();
        }
        return exchange.getResponse().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }

    private record RateLimitRule(String bucketPrefix, int maxRequests, long windowSeconds, String message) {}

    private static final class WindowCounter {
        final long windowStartMillis;
        final AtomicInteger count;

        WindowCounter(long windowStartMillis, int initialCount) {
            this.windowStartMillis = windowStartMillis;
            this.count = new AtomicInteger(initialCount);
        }
    }
}
