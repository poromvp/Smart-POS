package com.smartpos.auth_service.service;

import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private User sampleUser;

    private static final String SECRET_RAW = "my-ultra-secure-and-ultra-long-test-secret-key-smartpos-2026";
    private static final String SECRET_BASE64 = Base64.getEncoder().encodeToString(SECRET_RAW.getBytes());
    private static final long EXPIRATION_MS = 3_600_000L; // 1 giờ

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET_BASE64, EXPIRATION_MS);

        Role role = new Role("CASHIER", "Thu ngân");
        role.setId(1L);

        sampleUser = new User();
        sampleUser.setId(10L);
        sampleUser.setUsername("cashier01");
        sampleUser.setRole(role);
    }

    @Test
    @DisplayName("Sinh JWT Access Token chứa đúng các Claims (username, userId, role)")
    void testGenerateToken_ContainsClaims() {
        String token = jwtService.generateAccessToken(sampleUser);

        assertThat(token).isNotBlank();

        Claims claims = jwtService.extractClaims(token);
        assertThat(claims.getSubject()).isEqualTo("cashier01");
        assertThat(claims.get("userId", Long.class)).isEqualTo(10L);
        assertThat(claims.get("role", String.class)).isEqualTo("CASHIER");
    }

    @Test
    @DisplayName("Kiểm tra tính hợp lệ của Token với đúng username")
    void testValidateToken_ValidToken_ReturnsTrue() {
        String token = jwtService.generateAccessToken(sampleUser);

        boolean isValid = jwtService.isTokenValid(token, "cashier01");
        assertThat(isValid).isTrue();

        boolean isInvalidUser = jwtService.isTokenValid(token, "another_user");
        assertThat(isInvalidUser).isFalse();
    }

    @Test
    @DisplayName("Kiểm tra Token bị chỉnh sửa chữ ký hoặc payload bằng tay sẽ trả về false")
    void testValidateToken_TamperedSignature_ReturnsFalse() {
        String token = jwtService.generateAccessToken(sampleUser);
        String tamperedToken = token + "xyz_tampered";

        boolean isValid = jwtService.isTokenValid(tamperedToken, "cashier01");
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Trích xuất thông tin user ID, role, thời hạn token chính xác")
    void testExtractHelperMethods() {
        String token = jwtService.generateAccessToken(sampleUser);

        assertThat(jwtService.extractUsername(token)).isEqualTo("cashier01");
        assertThat(jwtService.extractUserId(token)).isEqualTo(10L);
        assertThat(jwtService.extractRole(token)).isEqualTo("CASHIER");
        assertThat(jwtService.getAccessTokenExpirationSeconds()).isEqualTo(3600);
    }
}
