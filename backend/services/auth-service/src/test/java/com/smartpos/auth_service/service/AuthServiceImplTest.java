package com.smartpos.auth_service.service;

import com.smartpos.auth_service.dto.request.ChangePasswordRequest;
import com.smartpos.auth_service.dto.request.LoginRequest;
import com.smartpos.auth_service.dto.response.AuthResult;
import com.smartpos.auth_service.entity.RefreshToken;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.exception.BadRequestException;
import com.smartpos.auth_service.mapper.UserMapper;
import com.smartpos.auth_service.repository.UserRepository;
import com.smartpos.auth_service.security.CookieUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private CookieUtil cookieUtil;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        Role role = new Role("ADMIN", "Quản trị viên");
        role.setId(1L);

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setUsername("admin");
        sampleUser.setPasswordHash("$2a$10$hashedPassword");
        sampleUser.setActive(true);
        sampleUser.setRole(role);
    }

    @Test
    @DisplayName("Đăng nhập thành công với thông tin đăng nhập chính xác")
    void testLogin_CorrectCredentials_Success() {
        LoginRequest request = new LoginRequest("admin", "password123");
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("admin");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser));
        when(jwtService.generateAccessToken(sampleUser)).thenReturn("sample.access.token");
        when(refreshTokenService.createRefreshToken(sampleUser)).thenReturn("raw-refresh-token");
        when(cookieUtil.createRefreshTokenCookie("raw-refresh-token"))
                .thenReturn(ResponseCookie.from("refreshToken", "raw-refresh-token").build());
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(3600L);

        AuthResult result = authService.login(request);

        assertThat(result).isNotNull();
        assertThat(result.tokenResponse().accessToken()).isEqualTo("sample.access.token");
        assertThat(result.tokenResponse().tokenType()).isEqualTo("Bearer");
        assertThat(result.refreshTokenCookie()).isNotNull();

        verify(authenticationManager).authenticate(any());
        verify(refreshTokenService).createRefreshToken(sampleUser);
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi sai mật khẩu (BadCredentialsException)")
    void testLogin_WrongPassword_ThrowsException() {
        LoginRequest request = new LoginRequest("admin", "wrong_password");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Sai tài khoản hoặc mật khẩu"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Sai tài khoản");

        verify(userRepository, never()).findByUsername(any());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi đã xác thực nhưng tài khoản không còn trong database")
    void testLogin_UserNotFound_ThrowsException() {
        LoginRequest request = new LoginRequest("deleted_user", "password");
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("deleted_user");

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findByUsername("deleted_user")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Authenticated user was not found");
    }

    @Test
    @DisplayName("Làm mới Token (Refresh Token) thành công, thu hồi token cũ và sinh cặp token mới")
    void testRefreshToken_ValidToken_ReturnsNewTokens() {
        RefreshToken oldToken = mock(RefreshToken.class);
        when(oldToken.getUser()).thenReturn(sampleUser);
        when(refreshTokenService.verifyAndGetValidToken("valid-raw-refresh-token")).thenReturn(oldToken);

        when(jwtService.generateAccessToken(sampleUser)).thenReturn("new.access.token");
        when(refreshTokenService.createRefreshToken(sampleUser)).thenReturn("new-raw-refresh-token");
        when(cookieUtil.createRefreshTokenCookie("new-raw-refresh-token"))
                .thenReturn(ResponseCookie.from("refreshToken", "new-raw-refresh-token").build());
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(3600L);

        AuthResult result = authService.refresh("valid-raw-refresh-token");

        assertThat(result).isNotNull();
        assertThat(result.tokenResponse().accessToken()).isEqualTo("new.access.token");
        verify(oldToken).revoke(); // Xác minh thu hồi token cũ
    }

    @Test
    @DisplayName("Làm mới Token thất bại khi thiếu Refresh Token Cookie")
    void testRefreshToken_MissingCookie_ThrowsException() {
        assertThatThrownBy(() -> authService.refresh(null))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Missing refresh token cookie");
    }

    @Test
    @DisplayName("Làm mới Token thất bại khi tài khoản người dùng đã bị vô hiệu hóa (active = false)")
    void testRefreshToken_InactiveUser_ThrowsException() {
        sampleUser.setActive(false);
        RefreshToken oldToken = mock(RefreshToken.class);
        when(oldToken.getUser()).thenReturn(sampleUser);
        when(refreshTokenService.verifyAndGetValidToken("some-token")).thenReturn(oldToken);

        assertThatThrownBy(() -> authService.refresh("some-token"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid refresh token");

        verify(oldToken).revoke();
    }

    @Test
    @DisplayName("Đổi mật khẩu thành công khi đúng mật khẩu cũ")
    void testChangePassword_Success() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass123", "newPass123");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPass123", "$2a$10$hashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPass123")).thenReturn("$2a$10$newHashedPassword");

        authService.changePassword("admin", request);

        assertThat(sampleUser.getPasswordHash()).isEqualTo("$2a$10$newHashedPassword");
        verify(userRepository).save(sampleUser);
        verify(refreshTokenService).revokeAllByUserId(sampleUser.getId());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi sai mật khẩu cũ")
    void testChangePassword_WrongOldPassword_ThrowsBadRequestException() {
        ChangePasswordRequest request = new ChangePasswordRequest("wrongOldPass", "newPass123");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongOldPass", "$2a$10$hashedPassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword("admin", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mật khẩu cũ không chính xác");

        verify(userRepository, never()).save(any());
        verify(refreshTokenService, never()).revokeAllByUserId(any());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi không tìm thấy user")
    void testChangePassword_UserNotFound_ThrowsException() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass123", "newPass123");
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.changePassword("nonexistent", request))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
