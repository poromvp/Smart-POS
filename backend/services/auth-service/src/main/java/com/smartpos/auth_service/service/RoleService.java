package com.smartpos.auth_service.service;

import com.smartpos.auth_service.dto.request.CreateRoleRequest;
import com.smartpos.auth_service.dto.request.UpdateRolePermissionsRequest;
import com.smartpos.auth_service.dto.request.UpdateRoleRequest;
import com.smartpos.auth_service.dto.response.PermissionResponse;
import com.smartpos.auth_service.dto.response.RoleDetailResponse;
import com.smartpos.auth_service.dto.response.RoleResponse;
import com.smartpos.auth_service.dto.response.UserResponse;
import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.exception.BusinessException;
import com.smartpos.auth_service.exception.DuplicateResourceException;
import com.smartpos.auth_service.exception.ResourceNotFoundException;
import com.smartpos.auth_service.mapper.PermissionMapper;
import com.smartpos.auth_service.mapper.RoleMapper;
import com.smartpos.auth_service.mapper.UserMapper;
import com.smartpos.auth_service.repository.PermissionRepository;
import com.smartpos.auth_service.repository.RoleRepository;
import com.smartpos.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final RoleMapper roleMapper;
    private final PermissionMapper permissionMapper;
    private final UserMapper userMapper;

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        String name = normalizeName(request.name());

        if (roleRepository.existsByName(name)) {
            throw new DuplicateResourceException(
                    "Role name already exists: " + name
            );
        }

        Role role = new Role();
        role.setName(name);
        role.setDescription(request.description());

        Role savedRole = roleRepository.save(role);

        return roleMapper.toResponse(savedRole);
    }

    public Page<RoleResponse> getAllRoles(Pageable pageable) {
        return roleRepository
                .findAllByOrderByNameAsc(pageable)
                .map(roleMapper::toResponse);
    }

    public RoleDetailResponse getRoleById(Long id) {
        Role role = findRoleOrThrowById(id);
        return roleMapper.roleDetailResponse(role);
    }

    @Transactional
    public RoleResponse updateRole(Long id, UpdateRoleRequest request) {
        Role role = findRoleOrThrowById(id);

        validateRoleIsEditable(role);

        String name = normalizeName(request.name());

        boolean nameChanged = !role.getName().equals(name);

        if (nameChanged && roleRepository.existsByName(name)) {
            throw new DuplicateResourceException (
                    "Role name already exists: " + name
            );
        }

        role.setName(name);
        role.setDescription(request.description());

        return roleMapper.toResponse(role);
    }

    @Transactional
    public void deleteRole(Long id) {
        Role role = findRoleOrThrowById(id);

        validateRoleIsEditable(role);

        if (userRepository.existsByRole_Id(id)) {
            throw new BusinessException(
                    "Cannot delete a role that is assigned to users"
            );
        }

        role.getPermissions().clear();

        roleRepository.delete(role);
    }

    public List<PermissionResponse> getPermissionsByRoleId(Long roleId) {
        return findRoleOrThrowById(roleId)
                .getPermissions()
                .stream()
                .map(permissionMapper::toResponse)
                .toList();
    }

    @Transactional
    public RoleResponse replacePermissions(
            Long roleId,
            UpdateRolePermissionsRequest request
    ) {
        Role role = findRoleOrThrowById(roleId);

        validateRoleIsEditable(role);

        Set<Permission> permissions = findPermissionsByIds(request.permissionIds());

        role.getPermissions().clear();
        role.getPermissions().addAll(permissions);

        return roleMapper.toResponse(role);
    }

    public Page<UserResponse> getUsersByRoleId(Long roleId, Pageable pageable) {
        findRoleOrThrowById(roleId);
        return userRepository
                .findAllByRole_Id(roleId, pageable)
                .map(userMapper::toResponse);
    }

    // --------------- HELPER ---------------
    private String normalizeName(String name) {
        return name.trim().toUpperCase(Locale.ROOT);
    }

    private Role findRoleOrThrowById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role not found: " + id
                ));
    }

    private Set<Permission> findPermissionsByIds(Set<Long> permissionsIds) {
        if (permissionsIds == null || permissionsIds.isEmpty()) {
            return new HashSet<>();
        }

        Set<Long> ids = new HashSet<>(permissionsIds);

        List<Permission> permissions = permissionRepository
                .findAllById(ids);

        if (permissions.size() != ids.size()) {
             throw new ResourceNotFoundException(
                     "One or more permissions do not exists"
             );
        }

        return new HashSet<>(permissions);
    }

    private void validateRoleIsEditable(Role role) {
        if (role.isSystem()) {
            throw new BusinessException(
                    "Cannot modify a system role"
            );
        }
    }
}
