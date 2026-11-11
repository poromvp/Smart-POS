package com.smartpos.sales_service.security;

import com.smartpos.sales_service.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class AuthorizationInterceptor implements HandlerInterceptor {

    private static final Pattern VALID_TABLE_NUMBER_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{1,20}$");
    private static final Set<String> ADMIN_ORDER_QUERY_PARAMS = Set.of(
            "page", "size", "sort", "startDate", "endDate", "search"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequirePermissions annotation = AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getMethod(), RequirePermissions.class);
        if (annotation == null) {
            annotation = AnnotatedElementUtils.findMergedAnnotation(
                    handlerMethod.getBeanType(), RequirePermissions.class);
        }
        if (annotation == null || annotation.allowPublic()) {
            return true;
        }

        if (annotation.allowPublicTableLookup() && isPublicTableLookup(request)) {
            return true;
        }

        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) {
            throw new ForbiddenException("Bạn không có quyền truy cập tài nguyên này.");
        }

        String normalizedRole = normalizeRole(ctx.getRole());
        if ("GUEST".equals(normalizedRole) || normalizedRole.isEmpty()) {
            throw new ForbiddenException("Bạn không có quyền truy cập tài nguyên này.");
        }

        if ("ADMIN".equals(normalizedRole)) {
            return true;
        }

        String[] required = annotation.anyOf();
        if (required.length == 0) {
            return true;
        }

        Set<String> userPerms = ctx.getPermissions() == null
                ? Set.of()
                : ctx.getPermissions().stream()
                .map(p -> p.toUpperCase(Locale.ROOT).trim())
                .collect(Collectors.toSet());

        for (String perm : required) {
            if (userPerms.contains(perm.toUpperCase(Locale.ROOT).trim())) {
                return true;
            }
        }

        throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");
    }

    private boolean isPublicTableLookup(HttpServletRequest request) {
        String tableNumber = request.getParameter("tableNumber");
        if (tableNumber == null || !VALID_TABLE_NUMBER_PATTERN.matcher(tableNumber.trim()).matches()) {
            return false;
        }
        for (String param : ADMIN_ORDER_QUERY_PARAMS) {
            if (request.getParameter(param) != null) {
                return false;
            }
        }
        return true;
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        return role.toUpperCase(Locale.ROOT).replaceFirst("^ROLE_", "").trim();
    }
}
