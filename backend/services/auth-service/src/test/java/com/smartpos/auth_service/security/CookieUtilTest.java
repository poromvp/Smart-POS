package com.smartpos.auth_service.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class CookieUtilTest {

    private CookieUtil cookieUtil;

    @BeforeEach
    void setUp() {
        cookieUtil = new CookieUtil();
        ReflectionTestUtils.setField(cookieUtil, "cookieName", "refreshToken");
        ReflectionTestUtils.setField(cookieUtil, "refreshTokenTtlDays", 7L);
        ReflectionTestUtils.setField(cookieUtil, "cookieSecure", false);
    }

    @Test
    @DisplayName("Tạo ResponseCookie refresh token với đúng name, path, httpOnly, Lax và maxAge")
    void testCreateRefreshTokenCookie() {
        ResponseCookie cookie = cookieUtil.createRefreshTokenCookie("raw-token-abc");

        assertThat(cookie.getName()).isEqualTo("refreshToken");
        assertThat(cookie.getValue()).isEqualTo("raw-token-abc");
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.isSecure()).isFalse();
        assertThat(cookie.getPath()).isEqualTo("/api/auth");
        assertThat(cookie.getSameSite()).isEqualTo("Lax");
        assertThat(cookie.getMaxAge().getSeconds()).isEqualTo(7 * 24 * 60 * 60);
    }

    @Test
    @DisplayName("Tạo clean cookie có maxAge = 0 để xóa cookie trên trình duyệt")
    void testCleanRefreshTokenCookie() {
        ResponseCookie cookie = cookieUtil.cleanRefreshTokenCookie();

        assertThat(cookie.getName()).isEqualTo("refreshToken");
        assertThat(cookie.getValue()).isEmpty();
        assertThat(cookie.getMaxAge().getSeconds()).isEqualTo(0);
        assertThat(cookie.getPath()).isEqualTo("/api/auth");
        assertThat(cookie.getSameSite()).isEqualTo("Lax");
    }

    @Test
    @DisplayName("Trích xuất refresh token từ HttpServletRequest có cookie")
    void testExtractRefreshToken_Found() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(
                new Cookie("otherCookie", "123"),
                new Cookie("refreshToken", "my-refresh-token")
        );

        String result = cookieUtil.extractRefreshToken(request);
        assertThat(result).isEqualTo("my-refresh-token");
    }

    @Test
    @DisplayName("Trích xuất refresh token trả về null khi không có cookie")
    void testExtractRefreshToken_NotFound() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        String result = cookieUtil.extractRefreshToken(request);
        assertThat(result).isNull();
    }
}
