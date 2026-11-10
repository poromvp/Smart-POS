package com.smartpos.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

/**
 * GlobalFilter của API Gateway:
 * 1. Chống Header Injection: Xóa bỏ các header X-User-* do client từ ngoài tự gửi vào.
 * 2. Phân giải JWT từ Authorization: Bearer <token>.
 * 3. Làm giàu request (Enrich Request) với các header định danh người dùng:
 *    - X-User-Id
 *    - X-User-Role
 *    - X-User-Name
 *    - X-User-Permissions
 *    giúp các downstream microservices (sales-service, catalog-inventory-service) nhận diện người dùng.
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_ROLE = "X-User-Role";
    public static final String HEADER_USER_NAME = "X-User-Name";
    public static final String HEADER_USER_PERMISSIONS = "X-User-Permissions";

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
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        ServerHttpRequest.Builder requestBuilder = request.mutate();

        // 1. Chống Header Spoofing: Xóa sạch các header X-User-* từ client bên ngoài
        requestBuilder.headers(headers -> {
            headers.remove(HEADER_USER_ID);
            headers.remove(HEADER_USER_ROLE);
            headers.remove(HEADER_USER_NAME);
            headers.remove(HEADER_USER_PERMISSIONS);
        });

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // 2. Nếu có Authorization Bearer Token, tiến hành giải mã Claims
        if (authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = authHeader.substring(7).trim();
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(signingKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                Object userIdObj = claims.get("userId");
                String userId = userIdObj != null ? userIdObj.toString() : "";

                String role = claims.get("role", String.class);
                String username = claims.getSubject();
                String fullName = claims.get("fullName", String.class);

                Object permsObj = claims.get("permissions");
                String permissions = "";
                if (permsObj instanceof List<?> list) {
                    permissions = list.stream()
                            .map(Object::toString)
                            .collect(Collectors.joining(","));
                }

                // 3. Gắn các headers định danh đã được Gateway chứng thực
                if (!userId.isBlank()) {
                    requestBuilder.header(HEADER_USER_ID, userId);
                }
                if (role != null && !role.isBlank()) {
                    requestBuilder.header(HEADER_USER_ROLE, role);
                }
                String resolvedName = (username != null && !username.isBlank())
                        ? username
                        : (fullName != null ? fullName : "");
                if (!resolvedName.isBlank()) {
                    requestBuilder.header(HEADER_USER_NAME, resolvedName);
                }
                if (!permissions.isBlank()) {
                    requestBuilder.header(HEADER_USER_PERMISSIONS, permissions);
                }

                log.debug("Đã xác thực JWT thành công cho user: {}, userId: {}, role: {}", username, userId, role);
            } catch (JwtException | IllegalArgumentException e) {
                log.warn("Token không hợp lệ hoặc đã hết hạn: {}", e.getMessage());
                // Không gắn header X-User-*, request sẽ được xử lý như Anonymous/Guest
            }
        }

        return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
    }

    @Override
    public int getOrder() {
        // Chạy trước các routing filter của Spring Cloud Gateway
        return -1;
    }
}
