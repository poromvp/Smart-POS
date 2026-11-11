package com.smartpos.sales_service.client;

import com.smartpos.sales_service.security.CorrelationIdFilter;
import com.smartpos.sales_service.security.UserContext;
import com.smartpos.sales_service.security.UserContextFilter;
import com.smartpos.sales_service.security.UserContextHolder;
import feign.RequestTemplate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FeignTraceAndInternalInterceptorTest {

    @AfterEach
    void tearDown() {
        MDC.clear();
        UserContextHolder.clear();
    }

    @Test
    @DisplayName("Gắn X-Correlation-Id, X-Internal-Service, X-Internal-Secret và X-User-* vào Feign RequestTemplate")
    void shouldPropagateTracingAndInternalHeaders() {
        FeignTraceAndInternalInterceptor interceptor = new FeignTraceAndInternalInterceptor();
        ReflectionTestUtils.setField(interceptor, "internalSecret", "secret-xyz");

        MDC.put(CorrelationIdFilter.MDC_CORRELATION_ID, "cid-feign-999");
        UserContextHolder.setContext(UserContext.builder()
                .userId("7")
                .username("cashier01")
                .role("CASHIER")
                .permissions(List.of("POS_ACCESS", "PAYMENT_PROCESS"))
                .build());

        RequestTemplate template = new RequestTemplate();
        interceptor.apply(template);

        assertThat(template.headers().get(CorrelationIdFilter.HEADER_CORRELATION_ID)).contains("cid-feign-999");
        assertThat(template.headers().get(FeignTraceAndInternalInterceptor.HEADER_INTERNAL_SERVICE)).contains("sales-service");
        assertThat(template.headers().get(FeignTraceAndInternalInterceptor.HEADER_INTERNAL_SECRET)).contains("secret-xyz");
        assertThat(template.headers().get(UserContextFilter.HEADER_USER_ID)).contains("7");
        assertThat(template.headers().get(UserContextFilter.HEADER_USER_ROLE)).contains("CASHIER");
        assertThat(template.headers().get(UserContextFilter.HEADER_USER_NAME)).contains("cashier01");
        assertThat(template.headers().get(UserContextFilter.HEADER_USER_PERMISSIONS)).contains("POS_ACCESS,PAYMENT_PROCESS");
    }
}
