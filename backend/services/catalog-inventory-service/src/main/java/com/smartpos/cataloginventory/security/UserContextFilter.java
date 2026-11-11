package com.smartpos.cataloginventory.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class UserContextFilter extends OncePerRequestFilter {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_ROLE = "X-User-Role";
    public static final String HEADER_USER_PERMISSIONS = "X-User-Permissions";
    public static final String HEADER_USER_NAME = "X-User-Name";
    public static final String HEADER_INTERNAL_SERVICE = "X-Internal-Service";
    public static final String HEADER_INTERNAL_SECRET = "X-Internal-Secret";

    @Value("${app.internal.secret:smartpos-internal-secret-2026}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String userId = request.getHeader(HEADER_USER_ID);
        String role = request.getHeader(HEADER_USER_ROLE);
        String permissionsHeader = request.getHeader(HEADER_USER_PERMISSIONS);
        String username = request.getHeader(HEADER_USER_NAME);

        List<String> permissions = List.of();
        if (permissionsHeader != null && !permissionsHeader.isBlank()) {
            permissions = Arrays.stream(permissionsHeader.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        String internalService = request.getHeader(HEADER_INTERNAL_SERVICE);
        String providedSecret = request.getHeader(HEADER_INTERNAL_SECRET);
        boolean isInternal = internalService != null
                && !internalService.isBlank()
                && providedSecret != null
                && internalSecret != null
                && !internalSecret.isBlank()
                && MessageDigest.isEqual(
                        providedSecret.getBytes(StandardCharsets.UTF_8),
                        internalSecret.getBytes(StandardCharsets.UTF_8)
                );

        if (userId == null || userId.isBlank()) {
            userId = "anonymous";
        }
        if (role == null || role.isBlank()) {
            role = "GUEST";
        }
        if (username == null || username.isBlank()) {
            username = "Guest User";
        }

        UserContext context = UserContext.builder()
                .userId(userId)
                .username(username)
                .role(role)
                .permissions(permissions)
                .internalServiceCall(isInternal)
                .build();

        UserContextHolder.setContext(context);
        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContextHolder.clear();
        }
    }
}
