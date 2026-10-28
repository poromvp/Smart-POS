package com.smartpos.auth_service.mapper;

import com.smartpos.auth_service.dto.response.RoleDetailResponse;
import com.smartpos.auth_service.dto.response.RoleResponse;
import com.smartpos.auth_service.entity.Role;
import org.springframework.stereotype.Component;

@Component
public class RoleMapper {

    private final PermissionMapper permissionMapper;

    public RoleMapper(PermissionMapper permissionMapper) {
        this.permissionMapper = permissionMapper;
    }

    public RoleResponse toResponse(Role role) {
        return new RoleResponse(
                role.getId(),
                role.getName(),
                role.getDescription()
        );
    }

    public RoleDetailResponse roleDetailResponse(Role role) {
        return new RoleDetailResponse(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.getPermissions()
                        .stream()
                        .map(permissionMapper::toResponse)
                        .toList()
        );
    }
}
