package com.smartpos.cataloginventory.security;

import com.smartpos.cataloginventory.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AuthorizationInterceptor implements HandlerInterceptor {

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

        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) {
            throw new ForbiddenException("Bạn không có quyền truy cập tài nguyên này.");
        }

        if (annotation.allowInternal() && ctx.isInternalServiceCall()) {
            return true;
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

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        return role.toUpperCase(Locale.ROOT).replaceFirst("^ROLE_", "").trim();
    }
}
