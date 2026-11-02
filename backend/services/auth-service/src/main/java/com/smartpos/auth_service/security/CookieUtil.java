package com.smartpos.auth_service.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    @Value("${app.jwt.refresh-cookie-name:refreshToken}")
    private String cookieName;

    @Value("${app.jwt.refresh-token-expiration-days:7}")
    private long refreshTokenTtlDays;

    public ResponseCookie createRefreshTokenCookie(String refreshToken) {
        long maxAgeSeconds = refreshTokenTtlDays * 24 * 60 * 60;

        return ResponseCookie.from(cookieName, refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/api/auth")
                .maxAge(maxAgeSeconds)
                .sameSite("Strict")
                .build();
    }

    public ResponseCookie cleanRefreshTokenCookie() {
        return ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(true)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Strict")
                .build();
    }

    public String extractRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
