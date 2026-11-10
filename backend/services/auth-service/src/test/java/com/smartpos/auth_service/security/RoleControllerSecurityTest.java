package com.smartpos.auth_service.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.auth_service.config.SecurityConfig;
import com.smartpos.auth_service.controller.RoleController;
import com.smartpos.auth_service.dto.request.UpdateRolePermissionsRequest;
import com.smartpos.auth_service.dto.response.RoleResponse;
import com.smartpos.auth_service.service.AuthUserDetailsService;
import com.smartpos.auth_service.service.JwtService;
import com.smartpos.auth_service.service.RoleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@WebMvcTest(RoleController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class RoleControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private RoleService roleService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AuthUserDetailsService authUserDetailsService;

    @Test
    @DisplayName("User không có quyền ROLE_MANAGE_PERMISSIONS bị chặn HTTP 403 Forbidden")
    @WithMockUser(username = "staff", authorities = {"ROLE_READ"})
    void testReplacePermissions_ForbiddenWithoutAuthority() throws Exception {
        UpdateRolePermissionsRequest request = new UpdateRolePermissionsRequest(Set.of(1L, 2L));

        mockMvc.perform(put("/api/roles/2/permissions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User có quyền ROLE_MANAGE_PERMISSIONS cập nhật thành công HTTP 200 OK")
    @WithMockUser(username = "admin", authorities = {"ROLE_MANAGE_PERMISSIONS"})
    void testReplacePermissions_SuccessWithAuthority() throws Exception {
        UpdateRolePermissionsRequest request = new UpdateRolePermissionsRequest(Set.of(1L, 2L));
        RoleResponse response = new RoleResponse(2L, "CASHIER", "Thu ngân", false);

        when(roleService.replacePermissions(eq(2L), any())).thenReturn(response);

        mockMvc.perform(put("/api/roles/2/permissions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
