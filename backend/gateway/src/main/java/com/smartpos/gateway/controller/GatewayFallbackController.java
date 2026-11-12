package com.smartpos.gateway.controller;

import com.smartpos.gateway.filter.CorrelationIdAndLoggingFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Fallback Controller cho Circuit Breaker của Gateway khi dịch vụ downstream tạm thời không khả dụng.
 */
@RestController
public class GatewayFallbackController {

    @RequestMapping(value = "/fallback/catalog", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> catalogFallback(ServerWebExchange exchange) {
        String path = exchange.getRequest().getURI().getRawPath();
        String correlationId = exchange.getAttribute(CorrelationIdAndLoggingFilter.ATTR_CORRELATION_ID);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = exchange.getRequest().getHeaders()
                    .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", "Dịch vụ thực đơn tạm thời không khả dụng. Vui lòng thử lại sau.");
        body.put("data", null);
        body.put("path", path);
        if (correlationId != null && !correlationId.isBlank()) {
            body.put("correlationId", correlationId);
        }
        body.put("timestamp", LocalDateTime.now().toString());

        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body));
    }
}
