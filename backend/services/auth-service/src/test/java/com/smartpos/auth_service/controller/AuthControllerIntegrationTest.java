package com.smartpos.auth_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.auth_service.dto.request.LoginRequest;
import com.smartpos.auth_service.dto.response.AuthResult;
import com.smartpos.auth_service.dto.response.TokenResponse;
import com.smartpos.auth_service.security.CookieUtil;
import com.smartpos.auth_service.security.JwtAuthenticationFilter;
import com.smartpos.auth_service.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CookieUtil cookieUtil;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

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
}
