package com.smartpos.gateway.config;

import org.springframework.cloud.gateway.config.GlobalCorsProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

/**
 * Đảm bảo mọi response từ Gateway (kể cả 401, 404, 429, 503, 504 trước hoặc ngoài routing)
 * đều mang đầy đủ header CORS theo cấu hình globalcors.
 */
@Configuration
public class GatewayCorsConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsWebFilter corsWebFilter(GlobalCorsProperties globalCorsProperties) {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        globalCorsProperties.getCorsConfigurations().forEach(source::registerCorsConfiguration);
        return new CorsWebFilter(source);
    }
}
