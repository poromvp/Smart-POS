package com.smartpos.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * GlobalFilter xác thực và phân giải JWT của API Gateway:
 * 1. Chống Header Spoofing: Xóa sạch mọi header X-User-* và header nội bộ X-Internal-* do client bên ngoài tự gửi vào.
 * 2. Kiểm tra tính hợp lệ của Bearer JWT Token.
 * 3. Phân tách Public Routes (Login, Refresh, Menu, QR Ordering theo bàn, Ảnh tĩnh, WebSocket)
 *    với Protected Routes (Quản trị, Danh sách/Tra cứu đơn hàng, Kho, Bếp, Thu ngân, Báo cáo).
 *    Từ chối ngay với HTTP 401 JSON nếu Protected Route thiếu hoặc sai token.
 * 4. Làm giàu request (Enrich Request) với X-User-Id, X-User-Role, X-User-Name, X-User-Permissions.
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_ROLE = "X-User-Role";
    public static final String HEADER_USER_NAME = "X-User-Name";
    public static final String HEADER_USER_PERMISSIONS = "X-User-Permissions";
    public static final String HEADER_INTERNAL_SERVICE = "X-Internal-Service";
    public static final String HEADER_INTERNAL_SECRET = "X-Internal-Secret";

    private static final Pattern ORDER_ADD_ITEMS_PATTERN = Pattern.compile("^/api/(?:sales/)?orders/\\d+/items$");
    private static final Pattern VALID_TABLE_NUMBER_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{1,20}$");
    private static final Set<String> ADMIN_ORDER_QUERY_PARAMS = Set.of(
            "page", "size", "sort", "startDate", "endDate", "search"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

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
        HttpMethod method = request.getMethod();
        String path = request.getURI().getRawPath();

        // 1. Luôn cho phép CORS preflight OPTIONS
        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(exchange);
        }

        ServerHttpRequest.Builder requestBuilder = request.mutate();

        // 2. Chống Header Spoofing: Luôn xóa sạch các header X-User-* và X-Internal-* do client bên ngoài gửi vào
        requestBuilder.headers(headers -> {
            headers.remove(HEADER_USER_ID);
            headers.remove(HEADER_USER_ROLE);
            headers.remove(HEADER_USER_NAME);
            headers.remove(HEADER_USER_PERMISSIONS);
            headers.remove(HEADER_INTERNAL_SERVICE);
            headers.remove(HEADER_INTERNAL_SECRET);
        });

        boolean isPublic = isPublicEndpoint(method, path, request.getQueryParams());
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        boolean hasBearerToken = authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7);

        if (!hasBearerToken) {
            if (isPublic) {
                return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
            }
            return writeUnauthorizedResponse(exchange, "Vui lòng đăng nhập để truy cập tài nguyên này.");
        }

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
            String resolvedName = resolveAsciiSafeUserName(username, fullName);
            if (!resolvedName.isBlank()) {
                requestBuilder.header(HEADER_USER_NAME, resolvedName);
            }
            if (!permissions.isBlank()) {
                requestBuilder.header(HEADER_USER_PERMISSIONS, permissions);
            }

            log.debug("Đã xác thực JWT cho user: {}, userId: {}, role: {}", username, userId, role);
            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());

        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT không hợp lệ tại {} {}: {}", method, path, e.getMessage());
            if (isPublic) {
                // Nếu là route công khai (VD: khách xem menu có dính token cũ), vẫn cho qua ở chế độ ẩn danh
                return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
            }
            return writeUnauthorizedResponse(exchange, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }
    }

    /**
     * Xác định các endpoint công khai (không bắt buộc JWT) phục vụ Đăng nhập, Khách QR tại bàn, WebSocket và Ảnh tĩnh.
     */
    boolean isPublicEndpoint(HttpMethod method, String path, MultiValueMap<String, String> queryParams) {
        if (path == null) {
            return false;
        }

        // Auth public endpoints
        if (HttpMethod.POST.equals(method) && (path.equals("/api/auth/login") || path.equals("/api/auth/refresh"))) {
            return true;
        }

        // Healthcheck & WebSocket (chặn /actuator/gateway/** không cho public)
        if (path.equals("/actuator/health")
                || path.startsWith("/actuator/health/")
                || path.equals("/actuator/info")
                || path.equals("/api/sales/health")
                || path.equals("/ws-pos")
                || path.startsWith("/ws-pos/")) {
            return true;
        }

        // Static uploaded files (thống nhất 1 đường /uploads/**)
        if (HttpMethod.GET.equals(method) && path.startsWith("/uploads/")) {
            return true;
        }

        // Public Catalog read endpoint (chỉ mở /products/menu phục vụ QR Menu)
        if (HttpMethod.GET.equals(method)) {
            if (path.equals("/api/products/menu") || path.equals("/api/catalog/products/menu")) {
                return true;
            }

            // Khách QR chỉ được kiểm tra đơn đang hoạt động của đúng 1 bàn (?tableNumber=...) và KHÔNG kèm tham số quản trị
            if (path.equals("/api/orders") || path.equals("/api/sales/orders")) {
                return isPublicTableOrderLookup(queryParams);
            }
        }

        // Public QR Ordering & Promotion check endpoints
        if (HttpMethod.POST.equals(method)) {
            if (path.equals("/api/orders")
                    || path.equals("/api/sales/orders")
                    || ORDER_ADD_ITEMS_PATTERN.matcher(path).matches()
                    || path.equals("/api/promotions/apply")
                    || path.equals("/api/sales/promotions/apply")) {
                return true;
            }
        }

        return false;
    }

    private boolean isPublicTableOrderLookup(MultiValueMap<String, String> queryParams) {
        if (queryParams == null || queryParams.isEmpty()) {
            return false;
        }
        String tableNumber = queryParams.getFirst("tableNumber");
        if (tableNumber == null || !VALID_TABLE_NUMBER_PATTERN.matcher(tableNumber.trim()).matches()) {
            return false;
        }
        for (String adminParam : ADMIN_ORDER_QUERY_PARAMS) {
            if (queryParams.containsKey(adminParam)) {
                return false;
            }
        }
        return true;
    }

    private String resolveAsciiSafeUserName(String username, String fullName) {
        if (username != null && !username.isBlank()) {
            return toHeaderSafeValue(username.trim());
        }
        if (fullName != null && !fullName.isBlank()) {
            return toHeaderSafeValue(fullName.trim());
        }
        return "";
    }

    private String toHeaderSafeValue(String value) {
        boolean isAsciiPrintable = value.chars().allMatch(c -> c >= 0x20 && c <= 0x7E);
        if (isAsciiPrintable) {
            return value;
        }
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private Mono<Void> writeUnauthorizedResponse(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String path = exchange.getRequest().getURI().getRawPath();
        String correlationId = resolveCorrelationId(exchange);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", message);
        body.put("data", null);
        body.put("path", path);
        if (correlationId != null && !correlationId.isBlank()) {
            body.put("correlationId", correlationId);
        }
        body.put("timestamp", LocalDateTime.now().toString());

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (Exception e) {
            bytes = ("{\"success\":false,\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    private String resolveCorrelationId(ServerWebExchange exchange) {
        Object attrCid = exchange.getAttribute(CorrelationIdAndLoggingFilter.ATTR_CORRELATION_ID);
        if (attrCid instanceof String str && !str.isBlank()) {
            return str;
        }
        String reqCid = exchange.getRequest().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
        if (reqCid != null && !reqCid.isBlank()) {
            return reqCid.trim();
        }
        return exchange.getResponse().getHeaders()
                .getFirst(CorrelationIdAndLoggingFilter.HEADER_CORRELATION_ID);
    }

    @Override
    public int getOrder() {
        // Chạy sau CorrelationIdAndLoggingFilter và trước NettyRoutingFilter
        return -1;
    }
}
