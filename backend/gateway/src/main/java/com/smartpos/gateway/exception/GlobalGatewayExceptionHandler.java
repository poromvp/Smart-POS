package com.smartpos.gateway.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.gateway.filter.CorrelationIdAndLoggingFilter;
import io.netty.channel.ConnectTimeoutException;
import io.netty.handler.timeout.ReadTimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.webflux.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeoutException;

/**
 * Xử lý ngoại lệ tập trung trên API Gateway.
 * Trả về JSON đồng nhất theo chuẩn ApiResponse của Smart-POS thay vì trang lỗi mặc định.
 */
@Component
@Order(-2)
public class GlobalGatewayExceptionHandler implements ErrorWebExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalGatewayExceptionHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        HttpStatusCode status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = "Lỗi hệ thống tại API Gateway. Vui lòng thử lại sau.";

        if (ex instanceof ResponseStatusException rse) {
            status = rse.getStatusCode();
            if (status.value() == HttpStatus.NOT_FOUND.value()) {
                message = "Không tìm thấy đường dẫn API yêu cầu trên Gateway.";
            } else {
                message = rse.getReason() != null ? rse.getReason() : "Yêu cầu không hợp lệ.";
            }
        } else if (hasCause(ex, ConnectException.class) || hasCause(ex, ConnectTimeoutException.class)) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = "Dịch vụ đích hiện không khả dụng hoặc chưa khởi động. Vui lòng thử lại sau.";
        } else if (hasCause(ex, TimeoutException.class) || hasCause(ex, ReadTimeoutException.class)) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            message = "Quá thời gian chờ phản hồi từ dịch vụ backend.";
        }

        String path = exchange.getRequest().getURI().getRawPath();
        String correlationId = resolveCorrelationId(exchange);

        log.error("[Gateway Error] {} {} -> {} ({}) [cid={}]",
                exchange.getRequest().getMethod(), path, status.value(), ex.getMessage(), correlationId);

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID, correlationId);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", message);
        body.put("data", null);
        body.put("path", path);
        body.put("correlationId", correlationId);
        body.put("timestamp", LocalDateTime.now().toString());

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (Exception serializeEx) {
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
        String resCid = exchange.getResponse().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
        if (resCid != null && !resCid.isBlank()) {
            return resCid.trim();
        }
        return UUID.randomUUID().toString();
    }

    private boolean hasCause(Throwable ex, Class<? extends Throwable> targetType) {
        Throwable current = ex;
        while (current != null) {
            if (targetType.isInstance(current)) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
