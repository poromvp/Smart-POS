package com.smartpos.auth_service.repository;

import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private Role cashierRole;
    private User savedUser;

    @BeforeEach
    void setUp() {
        cashierRole = new Role("CASHIER", "Nhân viên thu ngân");
        cashierRole = roleRepository.save(cashierRole);

        User user = new User("cashier01", "$2a$10$hashedPass", "Lê Thu Ngân", "0912345678");
        user.setRole(cashierRole);
        user.setActive(true);
        savedUser = userRepository.save(user);
    }

    @Test
    @DisplayName("findByUsername tìm thấy người dùng chính xác")
    void testFindByUsername_Found() {
        Optional<User> found = userRepository.findByUsername("cashier01");

        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Lê Thu Ngân");
        assertThat(found.get().getRole().getName()).isEqualTo("CASHIER");
    }

    @Test
    @DisplayName("existsByUsername trả về true khi đã tồn tại và false khi chưa")
    void testExistsByUsername() {
        assertThat(userRepository.existsByUsername("cashier01")).isTrue();
        assertThat(userRepository.existsByUsername("non_existent")).isFalse();
    }

    @Test
    @DisplayName("findAllByRole_Id phân trang danh sách người dùng theo vai trò")
    void testFindAllByRole_Id() {
        Page<User> page = userRepository.findAllByRole_Id(cashierRole.getId(), PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).getUsername()).isEqualTo("cashier01");
    }
}
