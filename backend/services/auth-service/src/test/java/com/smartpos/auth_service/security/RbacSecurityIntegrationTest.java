package com.smartpos.auth_service.security;

import com.smartpos.auth_service.config.SecurityConfig;
import com.smartpos.auth_service.controller.UserController;
import com.smartpos.auth_service.service.AuthUserDetailsService;
import com.smartpos.auth_service.service.JwtService;
import com.smartpos.auth_service.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@WebMvcTest(UserController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class RbacSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AuthUserDetailsService authUserDetailsService;

    @Test
    @DisplayName("Chưa đăng nhập gọi API riêng tư /api/users trả về HTTP 401 Unauthorized")
    void testGetUsers_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Người dùng không có quyền USER_READ (VD: role CASHIER) bị chặn HTTP 403 Forbidden")
    @WithMockUser(username = "cashier", authorities = {"ORDER_READ"})
    void testGetUsers_ForbiddenRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Người dùng có thẩm quyền USER_READ (VD: ADMIN) truy cập thành công HTTP 200 OK")
    @WithMockUser(username = "admin", authorities = {"USER_READ"})
    void testGetUsers_AuthorizedRole_ReturnsOk() throws Exception {
        when(userService.getAllUsers(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk());
    }
}
