package com.smartpos.auth_service.service;

import com.smartpos.auth_service.dto.request.CreateRoleRequest;
import com.smartpos.auth_service.dto.request.UpdateRolePermissionsRequest;
import com.smartpos.auth_service.dto.request.UpdateRoleRequest;
import com.smartpos.auth_service.dto.response.RoleResponse;
import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.exception.BusinessException;
import com.smartpos.auth_service.exception.DuplicateResourceException;
import com.smartpos.auth_service.mapper.PermissionMapper;
import com.smartpos.auth_service.mapper.RoleMapper;
import com.smartpos.auth_service.mapper.UserMapper;
import com.smartpos.auth_service.repository.PermissionRepository;
import com.smartpos.auth_service.repository.RoleRepository;
import com.smartpos.auth_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleMapper roleMapper;

    @Mock
    private PermissionMapper permissionMapper;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private RoleService roleService;

    private Role customRole;
    private Role adminSystemRole;
    private Role cashierSystemRole;

    @BeforeEach
    void setUp() {
        customRole = new Role("SUPERVISOR", "Giám sát ca", false);
        customRole.setId(10L);

        adminSystemRole = new Role("ADMIN", "Quản trị viên", true);
        adminSystemRole.setId(1L);

        cashierSystemRole = new Role("CASHIER", "Thu ngân", true);
        cashierSystemRole.setId(2L);
    }

    @Test
    @DisplayName("Tạo vai trò mới thành công, chuẩn hóa tên viết hoa")
    void testCreateRole_Success() {
        CreateRoleRequest request = new CreateRoleRequest("supervisor", "Giám sát ca");

        when(roleRepository.existsByName("SUPERVISOR")).thenReturn(false);
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> i.getArgument(0));

        RoleResponse mockResponse = new RoleResponse(10L, "SUPERVISOR", "Giám sát ca", false);
        when(roleMapper.toResponse(any(Role.class))).thenReturn(mockResponse);

        RoleResponse result = roleService.createRole(request);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("SUPERVISOR");
        verify(roleRepository).save(any(Role.class));
    }

    @Test
    @DisplayName("Tạo vai trò trùng tên ném DuplicateResourceException")
    void testCreateRole_DuplicateName_ThrowsException() {
        CreateRoleRequest request = new CreateRoleRequest("SUPERVISOR", "Giám sát");

        when(roleRepository.existsByName("SUPERVISOR")).thenReturn(true);

        assertThatThrownBy(() -> roleService.createRole(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Role name already exists");
    }

    @Test
    @DisplayName("Chặn sửa vai trò hệ thống (is_system = true) ném BusinessException")
    void testUpdateRole_SystemRole_ThrowsException() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(adminSystemRole));

        UpdateRoleRequest request = new UpdateRoleRequest("ADMIN_MODIFIED", "Mô tả mới");

        assertThatThrownBy(() -> roleService.updateRole(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot modify a system role");
    }

    @Test
    @DisplayName("Chặn xóa vai trò hệ thống (is_system = true) ném BusinessException")
    void testDeleteRole_SystemRole_ThrowsException() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(adminSystemRole));

        assertThatThrownBy(() -> roleService.deleteRole(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot modify a system role");
    }

    @Test
    @DisplayName("Gán permissions cho role tùy chỉnh (replacePermissions)")
    void testReplacePermissions_Success() {
        when(roleRepository.findById(10L)).thenReturn(Optional.of(customRole));

        Permission perm1 = new Permission("ORDER_READ", "Xem đơn", "ORDER");
        perm1.setId(101L);
        when(permissionRepository.findAllById(Set.of(101L))).thenReturn(List.of(perm1));

        RoleResponse mockResponse = new RoleResponse(10L, "SUPERVISOR", "Giám sát ca", false);
        when(roleMapper.toResponse(customRole)).thenReturn(mockResponse);

        UpdateRolePermissionsRequest request = new UpdateRolePermissionsRequest(Set.of(101L));
        RoleResponse result = roleService.replacePermissions(10L, request);

        assertThat(result).isNotNull();
        assertThat(customRole.getPermissions()).contains(perm1);
    }

    @Test
    @DisplayName("Cho phép cập nhật permissions động cho các vai trò hệ thống không phải ADMIN (VD: CASHIER)")
    void testReplacePermissions_NonAdminSystemRole_Success() {
        when(roleRepository.findById(2L)).thenReturn(Optional.of(cashierSystemRole));

        Permission posAccess = new Permission("POS_ACCESS", "Truy cập POS", "ORDER");
        posAccess.setId(201L);
        when(permissionRepository.findAllById(Set.of(201L))).thenReturn(List.of(posAccess));

        RoleResponse mockResponse = new RoleResponse(2L, "CASHIER", "Thu ngân", true);
        when(roleMapper.toResponse(cashierSystemRole)).thenReturn(mockResponse);

        UpdateRolePermissionsRequest request = new UpdateRolePermissionsRequest(Set.of(201L));
        RoleResponse result = roleService.replacePermissions(2L, request);

        assertThat(result).isNotNull();
        assertThat(cashierSystemRole.getPermissions()).containsExactly(posAccess);
    }

    @Test
    @DisplayName("Chặn sửa permissions của vai trò ADMIN để tránh tự khóa quyền quản trị")
    void testReplacePermissions_AdminRole_ThrowsException() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(adminSystemRole));

        UpdateRolePermissionsRequest request = new UpdateRolePermissionsRequest(Set.of(101L));

        assertThatThrownBy(() -> roleService.replacePermissions(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot modify ADMIN role permissions");
    }
}
