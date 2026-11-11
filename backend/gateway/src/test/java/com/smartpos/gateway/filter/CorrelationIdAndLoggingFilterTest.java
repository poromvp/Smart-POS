package com.smartpos.gateway.filter;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class CorrelationIdAndLoggingFilterTest {

    private final CorrelationIdAndLoggingFilter filter = new CorrelationIdAndLoggingFilter();

    @Test
    @DisplayName("Tự động sinh X-Correlation-Id và gắn vào cả request downstream, exchange attribute lẫn response")
    void shouldGenerateCorrelationIdWhenMissing() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/unknown-404").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        WebFilterChain chain = ex -> {
            forwarded.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isNotNull();
        String reqCid = forwarded.get().getRequest().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
        String resCid = exchange.getResponse().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
        Object attrCid = forwarded.get().getAttribute(CorrelationIdAndLoggingFilter.ATTR_CORRELATION_ID);

        assertThat(reqCid).isNotBlank();
        assertThat(resCid).isEqualTo(reqCid);
        assertThat(attrCid).isEqualTo(reqCid);
    }

    @Test
    @DisplayName("Giữ nguyên X-Correlation-Id nếu client đã truyền sẵn")
    void shouldPreserveExistingCorrelationId() {
        String customCid = "trace-smartpos-12345";
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/products/menu")
                .header(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID, customCid)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        filter.filter(exchange, ex -> {
            forwarded.set(ex);
            return Mono.empty();
        }).block();

        assertThat(forwarded.get().getRequest().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID)).isEqualTo(customCid);
        assertThat(exchange.getResponse().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID)).isEqualTo(customCid);
    }
}
