package com.smartpos.sales_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class UserContextFilter extends OncePerRequestFilter {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_ROLE = "X-User-Role";
    public static final String HEADER_USER_PERMISSIONS = "X-User-Permissions";
    public static final String HEADER_USER_NAME = "X-User-Name";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
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

        // Fallback an toàn cho dev/guest mode
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
                .build();

        UserContextHolder.setContext(context);
        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContextHolder.clear();
        }
    }
}
