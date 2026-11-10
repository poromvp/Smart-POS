package com.smartpos.auth_service.service;

import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthUserDetailsService userDetailsService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        Role role = new Role("CASHIER", "Thu ngân");
        role.setPermissions(Set.of(
                new Permission("ORDER_CREATE", "Tạo đơn", "ORDER"),
                new Permission("ORDER_READ", "Xem đơn", "ORDER")
        ));

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setUsername("cashier01");
        sampleUser.setPasswordHash("$2a$10$hashedPass");
        sampleUser.setActive(true);
        sampleUser.setRole(role);
    }

    @Test
    @DisplayName("Nạp UserDetails thành công với ROLE_<name> và từng mã quyền")
    void testLoadUserByUsername_Success() {
        when(userRepository.findByUsername("cashier01")).thenReturn(Optional.of(sampleUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("cashier01");

        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("cashier01");
        assertThat(userDetails.isEnabled()).isTrue();

        Set<String> authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toSet());

        assertThat(authorities).contains("ROLE_CASHIER", "ORDER_CREATE", "ORDER_READ");
    }

    @Test
    @DisplayName("Người dùng bị vô hiệu hóa có isEnabled = false")
    void testLoadUserByUsername_DisabledUser() {
        sampleUser.setActive(false);
        when(userRepository.findByUsername("cashier01")).thenReturn(Optional.of(sampleUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("cashier01");

        assertThat(userDetails.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("Ném UsernameNotFoundException khi không tìm thấy user")
    void testLoadUserByUsername_NotFound_ThrowsException() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("unknown"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found");
    }
}
