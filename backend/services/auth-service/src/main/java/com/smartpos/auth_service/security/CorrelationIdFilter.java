package com.smartpos.auth_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter nhận/sinh X-Correlation-Id và gắn vào SLF4J MDC cho Distributed Tracing tại auth-service.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";
    public static final String MDC_CORRELATION_ID = "correlationId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String existingId = request.getHeader(HEADER_CORRELATION_ID);
        String correlationId = (existingId != null && !existingId.isBlank())
                ? existingId.trim()
                : UUID.randomUUID().toString();

        MDC.put(MDC_CORRELATION_ID, correlationId);
        response.setHeader(HEADER_CORRELATION_ID, correlationId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_CORRELATION_ID);
        }
    }
}
