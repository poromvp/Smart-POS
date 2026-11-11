package com.smartpos.gateway;

import com.smartpos.gateway.exception.GlobalGatewayExceptionHandler;
import com.smartpos.gateway.filter.CorrelationIdAndLoggingFilter;
import com.smartpos.gateway.filter.InMemoryRateLimitFilter;
import com.smartpos.gateway.filter.JwtAuthenticationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.config.GatewayProperties;
import org.springframework.cloud.gateway.config.GlobalCorsProperties;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteLocator;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class GatewayConfigLoadTest {

    @Autowired
    private GatewayProperties gatewayProperties;

    @Autowired
    private GlobalCorsProperties globalCorsProperties;

    @Autowired
    private RouteLocator routeLocator;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private CorrelationIdAndLoggingFilter correlationIdFilter;

    @Autowired
    private InMemoryRateLimitFilter rateLimitFilter;

    @Autowired
    private GlobalGatewayExceptionHandler exceptionHandler;

    @Test
    @DisplayName("Nạp đầy đủ các Routes, CORS siết chặt, Filters và Exception Handler của Gateway từ application.yml")
    void shouldLoadGatewayRoutesAndSecurityBeans() {
        assertThat(jwtAuthenticationFilter).isNotNull();
        assertThat(correlationIdFilter).isNotNull();
        assertThat(rateLimitFilter).isNotNull();
        assertThat(exceptionHandler).isNotNull();

        List<String> routeIds = gatewayProperties.getRoutes().stream()
                .map(RouteDefinition::getId)
                .toList();

        assertThat(routeIds).containsExactlyInAnyOrder(
                "auth-service-route",
                "sales-service-health-route",
                "sales-service-frontend-route",
                "sales-service-route",
                "sales-service-websocket",
                "catalog-menu-frontend-route",
                "catalog-menu-direct-route",
                "catalog-inventory-frontend-route",
                "catalog-inventory-service-route"
        );

        var resolvedRoutes = routeLocator.getRoutes().collectList().block();
        assertThat(resolvedRoutes).isNotNull();
        assertThat(resolvedRoutes).hasSize(9);

        var corsConfig = globalCorsProperties.getCorsConfigurations().get("/**");
        assertThat(corsConfig).isNotNull();
        assertThat(corsConfig.getAllowCredentials()).isTrue();
        assertThat(corsConfig.getAllowedOriginPatterns())
                .containsExactlyInAnyOrder("http://localhost:*", "http://127.0.0.1:*")
                .doesNotContain("*");
    }
}
