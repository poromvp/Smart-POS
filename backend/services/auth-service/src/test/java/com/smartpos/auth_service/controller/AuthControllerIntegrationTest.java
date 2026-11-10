package com.smartpos.auth_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.auth_service.config.SecurityConfig;
import com.smartpos.auth_service.dto.request.ChangePasswordRequest;
import com.smartpos.auth_service.dto.request.LoginRequest;
import com.smartpos.auth_service.dto.response.AuthResult;
import com.smartpos.auth_service.dto.response.CurrentUserResponse;
import com.smartpos.auth_service.dto.response.TokenResponse;
import com.smartpos.auth_service.security.CookieUtil;
import com.smartpos.auth_service.security.JwtAuthenticationFilter;
import com.smartpos.auth_service.security.RestAccessDeniedHandler;
import com.smartpos.auth_service.security.RestAuthenticationEntryPoint;
import com.smartpos.auth_service.service.AuthService;
import com.smartpos.auth_service.service.AuthUserDetailsService;
import com.smartpos.auth_service.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(AuthController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CookieUtil cookieUtil;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AuthUserDetailsService authUserDetailsService;

    @Test
    @DisplayName("POST /api/auth/login thông tin chính xác trả về HTTP 200 OK và Set-Cookie")
    void testLogin_Success_ReturnsOkAndToken() throws Exception {
        LoginRequest request = new LoginRequest("admin", "password123");
        TokenResponse tokenResponse = new TokenResponse("mock.jwt.token", "Bearer", 3600L);
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "mock-refresh-token")
                .httpOnly(true)
                .path("/api/auth")
                .build();
        AuthResult authResult = new AuthResult(tokenResponse, cookie);

        when(authService.login(any(LoginRequest.class))).thenReturn(authResult);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(jsonPath("$.accessToken").value("mock.jwt.token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600));
    }

    @Test
    @DisplayName("POST /api/auth/login sai thông tin trả về HTTP 401 Unauthorized")
    void testLogin_BadCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("admin", "wrong_pass");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid username or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    @DisplayName("GET /api/auth/me trả về thông tin người dùng đang đăng nhập kèm danh sách permissions")
    @WithMockUser(username = "cashier01")
    void testMe_ReturnsCurrentUser() throws Exception {
        CurrentUserResponse meResponse = new CurrentUserResponse(
                10L,
                "cashier01",
                "Lê Thu Ngân",
                "CASHIER",
                List.of("POS_ACCESS", "PAYMENT_PROCESS", "ORDER_CREATE", "ORDER_READ")
        );

        when(authService.getCurrentUser("cashier01")).thenReturn(meResponse);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.username").value("cashier01"))
                .andExpect(jsonPath("$.roleName").value("CASHIER"))
                .andExpect(jsonPath("$.permissions[0]").value("POS_ACCESS"))
                .andExpect(jsonPath("$.permissions[1]").value("PAYMENT_PROCESS"));
    }

    @Test
    @DisplayName("GET /api/auth/me khi chưa đăng nhập trả về HTTP 401 Unauthorized")
    void testMe_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/refresh có cookie hợp lệ trả về token mới và Set-Cookie")
    void testRefresh_Success() throws Exception {
        when(cookieUtil.extractRefreshToken(any(HttpServletRequest.class))).thenReturn("valid-cookie-token");

        TokenResponse tokenResponse = new TokenResponse("new.access.token", "Bearer", 3600L);
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "new-cookie-token")
                .httpOnly(true)
                .path("/api/auth")
                .build();
        AuthResult authResult = new AuthResult(tokenResponse, cookie);

        when(authService.refresh("valid-cookie-token")).thenReturn(authResult);

        mockMvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(jsonPath("$.accessToken").value("new.access.token"));
    }

    @Test
    @DisplayName("POST /api/auth/logout trả về HTTP 204 No Content và xóa cookie")
    @WithMockUser(username = "admin")
    void testLogout_Success() throws Exception {
        when(cookieUtil.extractRefreshToken(any(HttpServletRequest.class))).thenReturn("token-to-revoke");
        ResponseCookie cleanCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .maxAge(0)
                .path("/api/auth")
                .build();
        when(authService.logout(eq("token-to-revoke"), eq("admin"))).thenReturn(cleanCookie);

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isNoContent())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    @DisplayName("PUT /api/auth/change-password thành công trả về HTTP 204 No Content")
    @WithMockUser(username = "admin")
    void testChangePassword_Success() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass123", "newPass123");

        mockMvc.perform(put("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(authService).changePassword(eq("admin"), any(ChangePasswordRequest.class));
    }
}
