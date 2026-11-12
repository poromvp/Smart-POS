package com.smartpos.auth_service.service;

import com.smartpos.auth_service.dto.request.AdminResetPasswordRequest;
import com.smartpos.auth_service.dto.request.AssignRoleRequest;
import com.smartpos.auth_service.dto.request.CreateUserRequest;
import com.smartpos.auth_service.dto.response.UserResponse;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.exception.BusinessException;
import com.smartpos.auth_service.exception.DuplicateResourceException;
import com.smartpos.auth_service.mapper.UserMapper;
import com.smartpos.auth_service.repository.RoleRepository;
import com.smartpos.auth_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private UserService userService;

    private Role cashierRole;
    private Role adminRole;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        cashierRole = new Role("CASHIER", "Thu ngân");
        cashierRole.setId(2L);

        adminRole = new Role("ADMIN", "Quản trị");
        adminRole.setId(1L);

        sampleUser = new User();
        sampleUser.setId(10L);
        sampleUser.setUsername("cashier01");
        sampleUser.setFullName("Lê Thu Ngân");
        sampleUser.setPhone("0912345678");
        sampleUser.setRole(cashierRole);
        sampleUser.setActive(true);
    }

    @Test
    @DisplayName("Tạo user mới: mật khẩu được mã hóa BCrypt, gán đúng role")
    void testCreateUser_Success() {
        CreateUserRequest request = new CreateUserRequest("cashier02", "pass123456", "Trần Thu", "0987654321", 2L);

        when(userRepository.existsByUsername("cashier02")).thenReturn(false);
        when(roleRepository.findById(2L)).thenReturn(Optional.of(cashierRole));
        when(passwordEncoder.encode("pass123456")).thenReturn("$2a$10$encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserResponse mockResponse = new UserResponse(11L, "cashier02", "Trần Thu", "0987654321", true, "CASHIER", LocalDateTime.now());
        when(userMapper.toResponse(any(User.class))).thenReturn(mockResponse);

        UserResponse result = userService.createUser(request);

        assertThat(result).isNotNull();
        assertThat(result.username()).isEqualTo("cashier02");
        verify(passwordEncoder).encode("pass123456");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Tạo user với username đã tồn tại ném DuplicateResourceException")
    void testCreateUser_DuplicateUsername_ThrowsException() {
        CreateUserRequest request = new CreateUserRequest("cashier01", "pass123456", "Trần Thu", "0987654321", 2L);

        when(userRepository.existsByUsername("cashier01")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Chặn đổi vai trò của ADMIN ném BusinessException")
    void testAssignRole_AdminCannotBeChanged_ThrowsException() {
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setRole(adminRole);

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(roleRepository.findById(2L)).thenReturn(Optional.of(cashierRole));

        AssignRoleRequest request = new AssignRoleRequest(2L);

        assertThatThrownBy(() -> userService.assignRole(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot change ADMIN's role");
    }

    @Test
    @DisplayName("Chặn gán vai trò ADMIN cho user thông thường ném BusinessException")
    void testAssignRole_CannotAssignAdmin_ThrowsException() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(roleRepository.findById(1L)).thenReturn(Optional.of(adminRole));

        AssignRoleRequest request = new AssignRoleRequest(1L);

        assertThatThrownBy(() -> userService.assignRole(10L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot assign ADMIN role to an user");
    }

    @Test
    @DisplayName("Admin reset password mã hóa mật khẩu mới và gọi revoke refresh tokens")
    void testResetPassword_Success() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("newPassword123")).thenReturn("$2a$10$newEncodedPass");

        AdminResetPasswordRequest request = new AdminResetPasswordRequest("newPassword123");
        userService.resetPassword(10L, request);

        assertThat(sampleUser.getPasswordHash()).isEqualTo("$2a$10$newEncodedPass");
        verify(userRepository).save(sampleUser);
        verify(refreshTokenService).revokeAllByUserId(10L);
    }
}
