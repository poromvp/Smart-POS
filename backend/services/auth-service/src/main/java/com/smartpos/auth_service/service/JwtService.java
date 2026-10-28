package com.smartpos.auth_service.service;

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

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("role", user.getRole().getName())
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

    // 6. Get access token lifetime in seconds
    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpiration / 1000;
    }

    // 7. Validate token against expected username
    public boolean isTokenValid(String token, String username) {
        try {
            Claims claims = extractClaims(token);

            return username.equals(claims.getSubject());
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }
}
