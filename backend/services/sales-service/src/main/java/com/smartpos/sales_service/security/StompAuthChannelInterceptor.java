package com.smartpos.sales_service.security;

import com.smartpos.sales_service.exception.ForbiddenException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Bảo vệ STOMP WebSocket tại /ws-pos:
 * - CONNECT: xác thực Bearer JWT từ STOMP native header Authorization (cho phép ẩn danh cho khách QR bàn).
 * - SUBSCRIBE: cho phép ẩn danh /topic/tables/{tableNumber}; yêu cầu JWT + quyền hợp lệ cho /topic/orders và /topic/kds.
 */
@Slf4j
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secret;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (Exception e) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            handleConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            handleSubscribe(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }
        if (authHeader == null || authHeader.isBlank()) {
            // Kết nối ẩn danh phục vụ khách QR theo dõi /topic/tables/{tableNumber}
            return;
        }

        if (!authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new IllegalArgumentException("Định dạng Authorization STOMP không hợp lệ.");
        }

        String token = authHeader.substring(7).trim();
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            Set<String> permissions = new HashSet<>();
            Object permsObj = claims.get("permissions");
            if (permsObj instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null) {
                        permissions.add(item.toString().toUpperCase(Locale.ROOT).trim());
                    }
                }
            }

            accessor.setUser(new StompPrincipal(
                    username != null ? username : "staff",
                    role != null ? role : "",
                    permissions
            ));
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Từ chối kết nối STOMP WebSocket do JWT không hợp lệ: {}", e.getMessage());
            throw new IllegalArgumentException("Phiên đăng nhập WebSocket không hợp lệ hoặc đã hết hạn.");
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            return;
        }

        if (destination.startsWith("/topic/tables/")) {
            return;
        }

        boolean isOrdersTopic = destination.equals("/topic/orders") || destination.startsWith("/topic/orders/");
        boolean isKdsTopic = destination.equals("/topic/kds") || destination.startsWith("/topic/kds/");

        if (!isOrdersTopic && !isKdsTopic) {
            return;
        }

        Principal user = accessor.getUser();
        if (!(user instanceof StompPrincipal principal)) {
            throw new ForbiddenException("Vui lòng đăng nhập để đăng ký kênh realtime nội bộ.");
        }

        if (principal.isAdmin()) {
            return;
        }

        if (isOrdersTopic && !principal.hasAnyPermission("POS_ACCESS", "ORDER_READ", "ADMIN_DASHBOARD")) {
            throw new ForbiddenException("Bạn không có quyền theo dõi kênh đơn hàng realtime.");
        }

        if (isKdsTopic && !principal.hasAnyPermission("KDS_VIEW", "KDS_UPDATE", "ADMIN_DASHBOARD")) {
            throw new ForbiddenException("Bạn không có quyền theo dõi kênh bếp KDS realtime.");
        }
    }

    public static final class StompPrincipal implements Principal {
        private final String name;
        private final String role;
        private final Set<String> permissions;

        public StompPrincipal(String name, String role, Set<String> permissions) {
            this.name = name;
            this.role = role.toUpperCase(Locale.ROOT).replaceFirst("^ROLE_", "").trim();
            this.permissions = permissions;
        }

        @Override
        public String getName() {
            return name;
        }

        public boolean isAdmin() {
            return "ADMIN".equals(role);
        }

        public boolean hasAnyPermission(String... required) {
            for (String perm : required) {
                if (permissions.contains(perm.toUpperCase(Locale.ROOT).trim())) {
                    return true;
                }
            }
            return false;
        }
    }
}
