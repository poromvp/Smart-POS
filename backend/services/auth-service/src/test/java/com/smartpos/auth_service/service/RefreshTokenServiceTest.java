package com.smartpos.auth_service.service;

import com.smartpos.auth_service.entity.RefreshToken;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenTtlDays", 7L);

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setUsername("testuser");
        sampleUser.setRole(new Role("CASHIER", "Cashier"));
    }

    @Test
    @DisplayName("Tạo refresh token ngẫu nhiên, mã hóa SHA-256 lưu chính xác vào DB")
    void testCreateRefreshToken_Success() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        String rawToken = refreshTokenService.createRefreshToken(sampleUser);

        assertThat(rawToken).isNotBlank();

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshToken savedToken = captor.getValue();
        assertThat(savedToken.getUser()).isEqualTo(sampleUser);
        assertThat(savedToken.getTokenHash()).isEqualTo(refreshTokenService.hashToken(rawToken));
        assertThat(savedToken.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    @DisplayName("Kiểm tra token hợp lệ: trả về entity RefreshToken")
    void testVerifyAndGetValidToken_Valid_ReturnsEntity() {
        String rawToken = "sample-raw-token";
        String tokenHash = refreshTokenService.hashToken(rawToken);

        RefreshToken token = new RefreshToken();
        token.setUser(sampleUser);
        token.setTokenHash(tokenHash);
        token.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));

        when(refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash))
                .thenReturn(Optional.of(token));

        RefreshToken result = refreshTokenService.verifyAndGetValidToken(rawToken);
        assertThat(result).isNotNull();
        assertThat(result.getTokenHash()).isEqualTo(tokenHash);
    }

    @Test
    @DisplayName("Token đã hết hạn ném BadCredentialsException")
    void testVerifyAndGetValidToken_Expired_ThrowsException() {
        String rawToken = "expired-token";
        String tokenHash = refreshTokenService.hashToken(rawToken);

        RefreshToken token = new RefreshToken();
        token.setUser(sampleUser);
        token.setTokenHash(tokenHash);
        token.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));

        when(refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash))
                .thenReturn(Optional.of(token));

        assertThatThrownBy(() -> refreshTokenService.verifyAndGetValidToken(rawToken))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid refresh token");
    }

    @Test
    @DisplayName("Token không tìm thấy ném BadCredentialsException")
    void testVerifyAndGetValidToken_NotFound_ThrowsException() {
        String rawToken = "non-existent-token";
        String tokenHash = refreshTokenService.hashToken(rawToken);

        when(refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.verifyAndGetValidToken(rawToken))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("revokeToken thu hồi chính xác khi username khớp")
    void testRevokeToken_MatchingUser_Revokes() {
        String rawToken = "raw-token";
        String tokenHash = refreshTokenService.hashToken(rawToken);

        RefreshToken token = new RefreshToken();
        token.setUser(sampleUser);
        token.setTokenHash(tokenHash);

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        refreshTokenService.revokeToken(rawToken, "testuser");

        assertThat(token.isRevoked()).isTrue();
    }

    @Test
    @DisplayName("revokeAllByUserId gọi repository thu hồi toàn bộ token của user")
    void testRevokeAllByUserId() {
        when(refreshTokenRepository.revokeAllByUserId(1L)).thenReturn(3);

        int count = refreshTokenService.revokeAllByUserId(1L);
        assertThat(count).isEqualTo(3);
        verify(refreshTokenRepository).revokeAllByUserId(1L);
    }
}
