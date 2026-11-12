package com.smartpos.sales_service.client;

import com.smartpos.sales_service.security.CorrelationIdFilter;
import com.smartpos.sales_service.security.UserContext;
import com.smartpos.sales_service.security.UserContextFilter;
import com.smartpos.sales_service.security.UserContextHolder;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * OpenFeign RequestInterceptor chuyển tiếp X-Correlation-Id, ngữ cảnh người dùng X-User-*
 * và gắn Internal Service Secret khi sales-service gọi sang catalog-inventory-service.
 */
@Component
public class FeignTraceAndInternalInterceptor implements RequestInterceptor {

    public static final String HEADER_INTERNAL_SERVICE = "X-Internal-Service";
    public static final String HEADER_INTERNAL_SECRET = "X-Internal-Secret";

    @Value("${app.internal.secret:smartpos-internal-secret-2026}")
    private String internalSecret;

    @Override
    public void apply(RequestTemplate template) {
        String correlationId = MDC.get(CorrelationIdFilter.MDC_CORRELATION_ID);
        if (correlationId != null && !correlationId.isBlank()) {
            template.header(CorrelationIdFilter.HEADER_CORRELATION_ID, correlationId);
        }

        template.header(HEADER_INTERNAL_SERVICE, "sales-service");
        if (internalSecret != null && !internalSecret.isBlank()) {
            template.header(HEADER_INTERNAL_SECRET, internalSecret);
        }

        UserContext ctx = UserContextHolder.getContext();
        if (ctx != null) {
            if (ctx.getUserId() != null && !ctx.getUserId().isBlank()) {
                template.header(UserContextFilter.HEADER_USER_ID, ctx.getUserId());
            }
            if (ctx.getRole() != null && !ctx.getRole().isBlank()) {
                template.header(UserContextFilter.HEADER_USER_ROLE, ctx.getRole());
            }
            if (ctx.getUsername() != null && !ctx.getUsername().isBlank()) {
                template.header(UserContextFilter.HEADER_USER_NAME, ctx.getUsername());
            }
            if (ctx.getPermissions() != null && !ctx.getPermissions().isEmpty()) {
                template.header(UserContextFilter.HEADER_USER_PERMISSIONS, String.join(",", ctx.getPermissions()));
            }
        }
    }
}
