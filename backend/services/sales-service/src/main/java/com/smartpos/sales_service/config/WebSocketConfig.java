package com.smartpos.sales_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic broadcast cho clients: /topic/orders, /topic/kds, /topic/tables/{tableNumber}
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Hỗ trợ cả Native WebSocket và SockJS fallback
        registry.addEndpoint("/ws-pos")
                .setAllowedOriginPatterns("*");

        registry.addEndpoint("/ws-pos")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
