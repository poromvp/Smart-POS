package com.smartpos.auth_service.config;

import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.repository.PermissionRepository;
import com.smartpos.auth_service.repository.RoleRepository;
import com.smartpos.auth_service.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles({"test", "dev"})
@DataJpaTest
@Import({DataInitializer.class, DataInitializerTest.TestSecurityBeans.class})
class DataInitializerTest {

    @TestConfiguration
    static class TestSecurityBeans {
        @Bean
        PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder();
        }
    }

    @Autowired
    private DataInitializer dataInitializer;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("DataInitializer lần đầu khởi tạo đủ 5 roles, 33 permissions (kể cả quyền phân hệ mới) và 10 users")
    void testRun_SeedsRolesPermissionsAndUsers() {
        dataInitializer.run();
        entityManager.flush();
        entityManager.clear();

        assertThat(roleRepository.count()).isGreaterThanOrEqualTo(5);
        assertThat(permissionRepository.count()).isGreaterThanOrEqualTo(33);
        assertThat(userRepository.count()).isGreaterThanOrEqualTo(10);

        // Verify new workspace access permissions exist
        Set<String> allPermCodes = permissionRepository.findAll().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
        assertThat(allPermCodes).contains(
                "ADMIN_DASHBOARD",
                "POS_ACCESS",
                "PAYMENT_PROCESS",
                "KDS_VIEW",
                "KDS_UPDATE",
                "ORDER_TAKING_ACCESS"
        );

        // Verify role permissions segregation
        Role cashier = roleRepository.findByName("CASHIER").orElseThrow();
        Set<String> cashierCodes = cashier.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
        assertThat(cashierCodes).contains("POS_ACCESS", "PAYMENT_PROCESS", "ORDER_CREATE");
        assertThat(cashierCodes).doesNotContain("ADMIN_DASHBOARD", "KDS_VIEW", "ORDER_TAKING_ACCESS");

        Role chef = roleRepository.findByName("CHEF").orElseThrow();
        Set<String> chefCodes = chef.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
        assertThat(chefCodes).contains("KDS_VIEW", "KDS_UPDATE");
        assertThat(chefCodes).doesNotContain("ADMIN_DASHBOARD", "POS_ACCESS");

        Role waiter = roleRepository.findByName("WAITER").orElseThrow();
        Set<String> waiterCodes = waiter.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
        assertThat(waiterCodes).contains("ORDER_TAKING_ACCESS", "ORDER_CREATE");
        assertThat(waiterCodes).doesNotContain("POS_ACCESS", "KDS_VIEW");

        // Verify admin and cashier01 passwords match configured seed password
        User admin = userRepository.findByUsername("admin").orElseThrow();
        assertThat(passwordEncoder.matches("password123", admin.getPasswordHash())).isTrue();

        User cashier01 = userRepository.findByUsername("cashier01").orElseThrow();
        assertThat(passwordEncoder.matches("password123", cashier01.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("DataInitializer có tính idempotent, không ghi đè mất tùy chỉnh quyền của Admin khi restart")
    void testRun_Idempotent_DoesNotOverwriteCustomizedRolePermissions() {
        dataInitializer.run();
        entityManager.flush();
        entityManager.clear();

        // Simulate Admin unchecking ORDER_CANCEL on CASHIER via UI
        Role cashier = roleRepository.findByName("CASHIER").orElseThrow();
        cashier.getPermissions().removeIf(p -> "ORDER_CANCEL".equals(p.getCode()));
        roleRepository.saveAndFlush(cashier);
        entityManager.clear();

        // Simulate service restart running DataInitializer again
        dataInitializer.run();
        entityManager.flush();
        entityManager.clear();

        Role cashierAfterRestart = roleRepository.findByName("CASHIER").orElseThrow();
        Set<String> codesAfterRestart = cashierAfterRestart.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        assertThat(codesAfterRestart).contains("POS_ACCESS");
        assertThat(codesAfterRestart).doesNotContain("ORDER_CANCEL");
    }
}
