package com.smartpos.gateway.exception;

import com.smartpos.gateway.filter.CorrelationIdAndLoggingFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ResponseStatusException;

import java.net.ConnectException;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalGatewayExceptionHandlerTest {

    private final GlobalGatewayExceptionHandler handler = new GlobalGatewayExceptionHandler();

    @Test
    @DisplayName("Trả 503 Service Unavailable chuẩn JSON khi downstream service chưa khởi động")
    void shouldReturn503OnConnectException() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/orders")
                .header(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID, "cid-503")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        handler.handle(exchange, new ConnectException("Connection refused")).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(exchange.getResponse().getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        assertThat(exchange.getResponse().getHeaders().getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID))
                .isEqualTo("cid-503");
        String body = exchange.getResponse().getBodyAsString().block();
        assertThat(body).contains("\"success\":false");
        assertThat(body).contains("\"correlationId\":\"cid-503\"");
    }

    @Test
    @DisplayName("Trả 504 Gateway Timeout chuẩn JSON kèm fallback correlationId khi downstream quá thời gian chờ")
    void shouldReturn504OnTimeoutException() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/products").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        handler.handle(exchange, new TimeoutException("Read timed out")).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.GATEWAY_TIMEOUT);
        String headerCid = exchange.getResponse().getHeaders().getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
        assertThat(headerCid).isNotBlank();
        String body = exchange.getResponse().getBodyAsString().block();
        assertThat(body).contains("\"success\":false");
        assertThat(body).contains("\"correlationId\":\"" + headerCid + "\"");
    }

    @Test
    @DisplayName("Trả 404 Not Found chuẩn JSON kèm correlationId khi route không tồn tại")
    void shouldReturn404OnNotFound() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/unknown").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        handler.handle(exchange, new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found")).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        String headerCid = exchange.getResponse().getHeaders().getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
        assertThat(headerCid).isNotBlank();
        String body = exchange.getResponse().getBodyAsString().block();
        assertThat(body).contains("\"success\":false");
        assertThat(body).contains("/api/unknown");
        assertThat(body).contains("\"correlationId\":\"" + headerCid + "\"");
    }
}
