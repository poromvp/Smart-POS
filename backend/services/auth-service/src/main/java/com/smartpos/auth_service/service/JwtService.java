package com.smartpos.auth_service.service;

import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpiration;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration}")
            long accessTokenExpiration
    ) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpiration = accessTokenExpiration;
    }

    // 1. Generate access token
    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(accessTokenExpiration);

        List<String> permissions = (user.getRole() != null && user.getRole().getPermissions() != null)
                ? user.getRole().getPermissions().stream()
                        .map(Permission::getCode)
                        .toList()
                : List.of();

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole() != null ? user.getRole().getName() : "")
                .claim("permissions", permissions)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(signingKey)
                .compact();
    }

    // 2. Parse token and verify signature
    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // 3. Extract username
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    // 4. Extract user ID
    public Long extractUserId(String token) {
        return extractClaims(token).get("userId", Long.class);
    }

    // 5. Extract role
    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    // 6. Extract full name
    public String extractFullName(String token) {
        return extractClaims(token).get("fullName", String.class);
    }

    // 7. Extract permissions
    @SuppressWarnings("unchecked")
    public List<String> extractPermissions(String token) {
        Object raw = extractClaims(token).get("permissions");
        if (raw instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }

    // 8. Get access token lifetime in seconds
    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpiration / 1000;
    }

    // 9. Validate token against expected username
    public boolean isTokenValid(String token, String username) {
        try {
            Claims claims = extractClaims(token);
            return username.equals(claims.getSubject());
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }
}
