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

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-username:}")
    private String adminUsername;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Value("${app.seed.admin-full-name:System Administrator}")
    private String adminFullName;

    @Value("${app.seed.admin-phone:}")
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
        Map<String, Permission> permissions = seedPermissions();

        Map<String, Role> roles = seedRoles();

        assignPermissions(roles, permissions);

        seedAdminUser(roles.get("ADMIN"));

        System.out.println("Smart-POS seed data initialized successfully.");
    }

    /**
     *  1. Creates default permissions
     */
    private Map<String, Permission> seedPermissions() {
        List<Permission> defaultPermissions = List.of(
                // User management
                new Permission(
                        "USER_CREATE", "Create user", "USER"),
                new Permission(
                        "USER_READ", "View users", "USER"),
                new Permission(
                        "USER_UPDATE", "Update user", "USER"),
                new Permission(
                        "USER_DELETE", "Delete user", "USER"),

                new Permission(
                        "USER_MANAGE_STATUS",
                        "Manage user status",
                        "USER"),
                new Permission(
                        "USER_ASSIGN_ROLE",
                        "Assign a role to a user",
                        "USER"),
                new Permission(
                        "USER_RESET_PASSWORD",
                        "Reset user password",
                        "USER"),

                // Role management
                new Permission(
                        "ROLE_CREATE", "Create role", "ROLE"),
                new Permission(
                        "ROLE_READ", "View roles", "ROLE"),
                new Permission(
                        "ROLE_UPDATE", "Update role", "ROLE"),
                new Permission(
                        "ROLE_DELETE", "Delete role", "ROLE"),

                new Permission(
                        "ROLE_MANAGE_PERMISSIONS",
                        "Manage permissions assigned to a role",
                        "ROLE"),
                new Permission(
                        "ROLE_READ_PERMISSIONS",
                        "View permissions assigned to a role",
                        "ROLE"),
                new Permission(
                        "ROLE_READ_USER",
                        "View users assigned to a role",
                        "ROLE"),

                // Permission management
                new Permission(
                        "PERMISSION_READ",
                        "View permissions",
                        "PERMISSION"),

                // Menu management
                new Permission(
                        "MENU_CREATE", "Create menu item", "MENU"),
                new Permission(
                        "MENU_READ", "View menu", "MENU"),
                new Permission(
                        "MENU_UPDATE", "Update menu item", "MENU"),
                new Permission(
                        "MENU_DELETE", "Delete menu item", "MENU"),

                // Order management
                new Permission(
                        "ORDER_CREATE", "Create order", "ORDER"),
                new Permission(
                        "ORDER_READ", "View orders", "ORDER"),
                new Permission(
                        "ORDER_UPDATE", "Update order", "ORDER"),
                new Permission(
                        "ORDER_CANCEL", "Cancel order", "ORDER"),

                // Inventory management
                new Permission(
                        "INVENTORY_VIEW", "View inventory", "INVENTORY"),
                new Permission(
                        "INVENTORY_IMPORT", "Import inventory", "INVENTORY"),
                new Permission(
                        "INVENTORY_EXPORT", "Export inventory", "INVENTORY"),

                // Reports
                new Permission(
                        "REPORT_VIEW", "View reports", "REPORT")
        );

        for (Permission permission : defaultPermissions) {
            if (!permissionRepository.existsByCode(permission.getCode())) {
                permissionRepository.save(permission);
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
     * 2. Creates default roles
     */
    private Map<String, Role> seedRoles() {
        List<Role> defaultRoles = List.of(
                new Role(
                        "ADMIN",
                        "System administrator",
                        true
                ),
                new Role(
                        "MANAGER",
                        "Restaurant manager",
                        true
                ),
                new Role(
                        "STAFF",
                        "Restaurant staff",
                        true
                )
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
     * 3. Assigns the configured permissions to each default role
     */
    private void assignPermissions(
            Map<String, Role> roles,
            Map<String, Permission> permissions
    ) {
        Map<String, Set<String>> rolePermissions = Map.of(
                "ADMIN", Set.of(
                        "USER_CREATE",
                        "USER_READ",
                        "USER_UPDATE",
                        "USER_DELETE",
                        "USER_MANAGE_STATUS",
                        "USER_ASSIGN_ROLE",
                        "USER_RESET_PASSWORD",
                        "ROLE_CREATE",
                        "ROLE_READ",
                        "ROLE_UPDATE",
                        "ROLE_DELETE",
                        "ROLE_MANAGE_PERMISSIONS",
                        "ROLE_READ_PERMISSIONS",
                        "ROLE_READ_USER",
                        "PERMISSION_READ",
                        "MENU_CREATE",
                        "MENU_READ",
                        "MENU_UPDATE",
                        "MENU_DELETE",
                        "ORDER_CREATE",
                        "ORDER_READ",
                        "ORDER_UPDATE",
                        "ORDER_CANCEL",
                        "INVENTORY_VIEW",
                        "INVENTORY_IMPORT",
                        "INVENTORY_EXPORT",
                        "REPORT_VIEW"
                ),

                "MANAGER", Set.of(
                        "USER_READ",
                        "MENU_CREATE",
                        "MENU_READ",
                        "MENU_UPDATE",
                        "MENU_DELETE",
                        "ORDER_CREATE",
                        "ORDER_READ",
                        "ORDER_UPDATE",
                        "ORDER_CANCEL",
                        "INVENTORY_VIEW",
                        "INVENTORY_IMPORT",
                        "INVENTORY_EXPORT",
                        "REPORT_VIEW"
                ),

                "STAFF", Set.of(
                        "MENU_READ",
                        "ORDER_CREATE",
                        "ORDER_READ",
                        "ORDER_UPDATE",
                        "INVENTORY_VIEW"
                )
        );

        for (Map.Entry<String, Set<String>> entry
                : rolePermissions.entrySet()) {

            Role role = roles.get(entry.getKey());

            if (role == null) {
                continue;
            }

            for (String permissionCode : entry.getValue()) {
                Permission permission = permissions.get(permissionCode);

                if (permission != null) {
                    role.getPermissions().add(permission);
                }
            }

            roleRepository.save(role);
        }
    }

    /**
     * 4. Creates the default administrator account
     */
    private void seedAdminUser(Role adminRole) {
        if (adminUsername.isBlank() || adminPassword.isBlank()) {
            System.out.println(
                    "Admin account skipped: configure app.seed.admin-username "
                            + "and app.seed.admin-password to create it."
            );
            return;
        }

        if (userRepository.findByUsername(adminUsername).isPresent()) {
            return;
        }

        User admin = new User(
                adminUsername,
                passwordEncoder.encode(adminPassword),
                adminFullName,
                adminPhone.isBlank() ? null : adminPhone
        );

        admin.setRole(adminRole);
        admin.setActive(true);

        userRepository.save(admin);

        System.out.println("Default admin account created.");
    }
}