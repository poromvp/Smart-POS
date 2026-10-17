package com.smartpos.auth_service.service;

import com.smartpos.auth_service.entity.RefreshToken;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${app.jwt.refresh-token-expiration-days:7}")
    private long refreshTokenTtlDays;

    private final RefreshTokenRepository refreshTokenRepository;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public String createRefreshToken(User user) {
        String rawToken = generateRefreshTokenValue();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashToken(rawToken));
        refreshToken.setExpiresAt(Instant.now().plus(refreshTokenTtlDays, ChronoUnit.DAYS));

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    public RefreshToken verifyAndGetValidToken(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        return refreshTokenRepository
                .findByTokenHashAndRevokedAtIsNull(tokenHash)
                .filter(token -> !token.isExpired())
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
    }

    public void revokeToken(String rawRefreshToken, String username) {
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash)
                .filter(token -> token.getUser().getUsername().equals(username))
                .ifPresent(RefreshToken::revoke);
    }

    private String generateRefreshTokenValue() {
        byte[] bytes = new byte[64];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
