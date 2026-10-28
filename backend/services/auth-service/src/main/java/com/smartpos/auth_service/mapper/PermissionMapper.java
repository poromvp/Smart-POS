package com.smartpos.auth_service.mapper;

import com.smartpos.auth_service.dto.response.PermissionResponse;
import com.smartpos.auth_service.entity.Permission;
import org.springframework.stereotype.Component;

@Component
public class PermissionMapper {

    public PermissionResponse toResponse(Permission permission) {
        return new PermissionResponse(
                permission.getId(),
                permission.getCode(),
                permission.getName(),
                permission.getModule()
        );
    }
}
