package com.smartpos.auth_service.config;

import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.repository.PermissionRepository;
import com.smartpos.auth_service.repository.RoleRepository;
import com.smartpos.auth_service.repository.UserRepository;

import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Profile("dev | !test")
public class DataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-username:admin}")
    private String adminUsername;

    @Value("${app.seed.admin-password:12345678}")
    private String adminPassword;

    @Value("${app.seed.admin-full-name:System Administrator}")
    private String adminFullName;

    @Value("${app.seed.admin-phone:0123456789}")
    private String adminPhone;

    public DataInitializer(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String @NonNull ... args) {
        Set<String> newlyCreatedPermissionCodes = new HashSet<>();
        Map<String, Permission> permissions = seedPermissions(newlyCreatedPermissionCodes);
        Map<String, Role> roles = seedRoles();
        assignPermissions(roles, permissions, newlyCreatedPermissionCodes);
        seedUsers(roles);

        System.out.println("Smart-POS seed data initialized successfully.");
    }

    /**
     * 1. Creates default permissions and records any newly introduced permission codes
     */
    private Map<String, Permission> seedPermissions(Set<String> newlyCreatedCodes) {
        List<Permission> defaultPermissions = List.of(
                // User management
                new Permission("USER_CREATE", "Tạo nhân viên", "USER"),
                new Permission("USER_READ", "Xem danh sách nhân viên", "USER"),
                new Permission("USER_UPDATE", "Cập nhật nhân viên", "USER"),
                new Permission("USER_DELETE", "Xóa nhân viên", "USER"),
                new Permission("USER_MANAGE_STATUS", "Khóa / Mở khóa tài khoản", "USER"),
                new Permission("USER_ASSIGN_ROLE", "Gán vai trò cho nhân viên", "USER"),
                new Permission("USER_RESET_PASSWORD", "Đặt lại mật khẩu nhân viên", "USER"),

                // Role management
                new Permission("ROLE_CREATE", "Tạo vai trò mới", "ROLE"),
                new Permission("ROLE_READ", "Xem danh sách vai trò", "ROLE"),
                new Permission("ROLE_UPDATE", "Chỉnh sửa vai trò", "ROLE"),
                new Permission("ROLE_DELETE", "Xóa vai trò", "ROLE"),
                new Permission("ROLE_MANAGE_PERMISSIONS", "Cấu hình quyền cho vai trò", "ROLE"),
                new Permission("ROLE_READ_PERMISSIONS", "Xem quyền của vai trò", "ROLE"),
                new Permission("ROLE_READ_USER", "Xem nhân viên thuộc vai trò", "ROLE"),

                // Permission management
                new Permission("PERMISSION_READ", "Xem danh mục quyền hệ thống", "PERMISSION"),

                // Menu management
                new Permission("MENU_CREATE", "Tạo món ăn / danh mục", "MENU"),
                new Permission("MENU_READ", "Xem thực đơn", "MENU"),
                new Permission("MENU_UPDATE", "Cập nhật món ăn / thực đơn", "MENU"),
                new Permission("MENU_DELETE", "Xóa món ăn / danh mục", "MENU"),

                // Order & POS / Waiter workspaces
                new Permission("ORDER_CREATE", "Tạo đơn hàng", "ORDER"),
                new Permission("ORDER_READ", "Xem đơn hàng", "ORDER"),
                new Permission("ORDER_UPDATE", "Cập nhật đơn hàng", "ORDER"),
                new Permission("ORDER_CANCEL", "Hủy đơn hàng", "ORDER"),
                new Permission("POS_ACCESS", "Truy cập quầy thu ngân (POS)", "ORDER"),
                new Permission("PAYMENT_PROCESS", "Xử lý thanh toán hóa đơn", "ORDER"),
                new Permission("ORDER_TAKING_ACCESS", "Truy cập màn hình phục vụ gọi món", "ORDER"),

                // Kitchen Display System (KDS)
                new Permission("KDS_VIEW", "Xem màn hình bếp (KDS)", "KDS"),
                new Permission("KDS_UPDATE", "Cập nhật trạng thái chế biến món", "KDS"),

                // Inventory management
                new Permission("INVENTORY_VIEW", "Xem kho nguyên liệu", "INVENTORY"),
                new Permission("INVENTORY_IMPORT", "Nhập kho nguyên liệu", "INVENTORY"),
                new Permission("INVENTORY_EXPORT", "Xuất kho / điều chỉnh tồn kho", "INVENTORY"),

                // Reports & Admin Portal
                new Permission("REPORT_VIEW", "Xem báo cáo doanh thu", "REPORT"),
                new Permission("ADMIN_DASHBOARD", "Truy cập khu vực quản trị (/admin)", "REPORT")
        );

        for (Permission permission : defaultPermissions) {
            if (!permissionRepository.existsByCode(permission.getCode())) {
                permissionRepository.save(permission);
                newlyCreatedCodes.add(permission.getCode());
            }
        }

        return permissionRepository.findAll()
                .stream()
                .collect(Collectors.toMap(
                        Permission::getCode,
                        Function.identity()
                ));
    }

    /**
     * 2. Creates the 5 standard roles + 1 custom role for testing role editing/deletion
     */
    private Map<String, Role> seedRoles() {
        List<Role> defaultRoles = List.of(
                new Role("ADMIN", "Quản trị viên hệ thống", true),
                new Role("MANAGER", "Quản lý nhà hàng", true),
                new Role("CHEF", "Đầu bếp (KDS)", true),
                new Role("CASHIER", "Thu ngân (POS)", true),
                new Role("WAITER", "Nhân viên phục vụ", true),
                new Role("PART_TIME", "Nhân viên bán thời gian (Có thể chỉnh sửa/xóa)", false)
        );

        for (Role role : defaultRoles) {
            if (!roleRepository.existsByName(role.getName())) {
                roleRepository.save(role);
            }
        }

        return roleRepository.findAll()
                .stream()
                .collect(Collectors.toMap(
                        Role::getName,
                        Function.identity()
                ));
    }

    /**
     * 3. Idempotently assigns default permissions:
     *    - ADMIN always ensures full system permissions.
     *    - Other default roles receive defaults only when empty (initial seed),
     *      or receive only newly introduced permission codes without overwriting admin customizations.
     */
    private void assignPermissions(
            Map<String, Role> roles,
            Map<String, Permission> permissions,
            Set<String> newlyCreatedCodes
    ) {
        Map<String, Set<String>> rolePermissions = Map.of(
                "ADMIN", permissions.keySet(),
                "MANAGER", Set.of(
                        "ADMIN_DASHBOARD", "POS_ACCESS", "PAYMENT_PROCESS", "KDS_VIEW",
                        "USER_READ", "ROLE_READ", "ROLE_READ_PERMISSIONS", "ROLE_READ_USER",
                        "MENU_CREATE", "MENU_READ", "MENU_UPDATE", "MENU_DELETE",
                        "ORDER_CREATE", "ORDER_READ", "ORDER_UPDATE", "ORDER_CANCEL",
                        "INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_EXPORT",
                        "REPORT_VIEW"
                ),
                "CASHIER", Set.of(
                        "MENU_READ",
                        "POS_ACCESS", "PAYMENT_PROCESS",
                        "ORDER_CREATE", "ORDER_READ", "ORDER_UPDATE", "ORDER_CANCEL",
                        "REPORT_VIEW"
                ),
                "CHEF", Set.of(
                        "MENU_READ",
                        "KDS_VIEW", "KDS_UPDATE",
                        "ORDER_READ", "ORDER_UPDATE",
                        "INVENTORY_VIEW"
                ),
                "WAITER", Set.of(
                        "MENU_READ",
                        "ORDER_TAKING_ACCESS",
                        "ORDER_CREATE", "ORDER_READ", "ORDER_UPDATE"
                ),
                "PART_TIME", Set.of(
                        "MENU_READ",
                        "ORDER_TAKING_ACCESS",
                        "ORDER_CREATE", "ORDER_READ"
                )
        );

        for (Map.Entry<String, Set<String>> entry : rolePermissions.entrySet()) {
            String roleName = entry.getKey();
            Role role = roles.get(roleName);
            if (role == null) {
                continue;
            }

            boolean isInitialSeedForRole = role.getPermissions().isEmpty();
            boolean changed = false;

            for (String permissionCode : entry.getValue()) {
                boolean shouldGrant = "ADMIN".equals(roleName)
                        || isInitialSeedForRole
                        || newlyCreatedCodes.contains(permissionCode);

                if (shouldGrant) {
                    Permission permission = permissions.get(permissionCode);
                    if (permission != null && role.getPermissions().add(permission)) {
                        changed = true;
                    }
                }
            }

            if (changed) {
                roleRepository.save(role);
            }
        }
    }

    /**
     * 4. Seeds test accounts across roles (including a locked user for negative login test)
     */
    private record SeedUserDto(String username, String fullName, String phone, String roleName, boolean isActive) {}

    private void seedUsers(Map<String, Role> roles) {
        String resolvedAdminUsername = (adminUsername == null || adminUsername.isBlank()) ? "admin" : adminUsername;
        String resolvedAdminPhone = (adminPhone == null || adminPhone.isBlank()) ? "0123456789" : adminPhone;
        String defaultPassword = (adminPassword == null || adminPassword.isBlank()) ? "12345678" : adminPassword;
        String encodedPassword = passwordEncoder.encode(defaultPassword);

        List<SeedUserDto> defaultUsers = List.of(
                new SeedUserDto(resolvedAdminUsername, adminFullName, resolvedAdminPhone, "ADMIN", true),
                new SeedUserDto("admin02", "Phó Quản trị Hệ thống", "0901234568", "ADMIN", true),
                new SeedUserDto("manager01", "Trần Quản Lý", "0902345671", "MANAGER", true),
                new SeedUserDto("manager02", "Lê Quản Lý", "0902345672", "MANAGER", true),
                new SeedUserDto("chef01", "Nguyễn Bếp Trưởng", "0903456781", "CHEF", true),
                new SeedUserDto("chef02", "Phạm Bếp Phó", "0903456782", "CHEF", true),
                new SeedUserDto("chef03", "Trịnh Phụ Bếp", "0903456783", "CHEF", true),
                new SeedUserDto("cashier01", "Vũ Thu Ngân", "0904567891", "CASHIER", true),
                new SeedUserDto("cashier02", "Đặng Thu Ngân", "0904567892", "CASHIER", true),
                new SeedUserDto("cashier03", "Ngô Thu Ngân Ca Tối", "0904567893", "CASHIER", true),
                new SeedUserDto("waiter01", "Hoàng Phục Vụ", "0905678901", "WAITER", true),
                new SeedUserDto("waiter02", "Bùi Phục Vụ", "0905678902", "WAITER", true),
                new SeedUserDto("waiter03", "Lý Phục Vụ Tầng 2", "0905678903", "WAITER", true),
                new SeedUserDto("parttime01", "Đoàn Sinh Viên Part-time", "0906789011", "PART_TIME", true),
                new SeedUserDto("locked_staff", "Nhân viên Đã Khóa (Test)", "0909999999", "CASHIER", false)
        );

        for (SeedUserDto u : defaultUsers) {
            if (userRepository.findByUsername(u.username()).isEmpty()) {
                Role role = roles.get(u.roleName());
                if (role != null) {
                    User user = new User(u.username(), encodedPassword, u.fullName(), u.phone());
                    user.setRole(role);
                    user.setActive(u.isActive());
                    userRepository.save(user);
                }
            }
        }
    }
}
