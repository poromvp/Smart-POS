package com.smartpos.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * WebFilter sinh X-Correlation-Id phục vụ Distributed Tracing
 * và ghi nhật ký thời gian xử lý của mọi request qua API Gateway (bao gồm cả lỗi 404/401/429).
 */
@Component
public class CorrelationIdAndLoggingFilter implements WebFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(CorrelationIdAndLoggingFilter.class);
    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";
    public static final String ATTR_CORRELATION_ID = "smartpos.correlationId";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        long startTime = System.currentTimeMillis();
        ServerHttpRequest request = exchange.getRequest();

        String existingId = request.getHeaders().getFirst(HEADER_CORRELATION_ID);
        String correlationId = (existingId != null && !existingId.isBlank())
                ? existingId.trim()
                : UUID.randomUUID().toString();

        ServerHttpRequest mutatedRequest = request.mutate()
                .header(HEADER_CORRELATION_ID, correlationId)
                .build();

        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(mutatedRequest)
                .build();

        mutatedExchange.getAttributes().put(ATTR_CORRELATION_ID, correlationId);
        mutatedExchange.getResponse().getHeaders().set(HEADER_CORRELATION_ID, correlationId);

        String method = request.getMethod() != null ? request.getMethod().name() : "UNKNOWN";
        String path = request.getURI().getRawPath();

        return chain.filter(mutatedExchange)
                .doFinally(signalType -> {
                    long duration = System.currentTimeMillis() - startTime;
                    var statusCode = mutatedExchange.getResponse().getStatusCode();
                    int status = statusCode != null ? statusCode.value() : 200;
                    log.info("[Gateway] {} {} -> {} ({} ms) [cid={}]",
                            method, path, status, duration, correlationId);
                });
    }

    @Override
    public int getOrder() {
        // Chạy ngay sau CorsWebFilter (HIGHEST_PRECEDENCE) nhưng trước RateLimitFilter & DispatcherHandler
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
