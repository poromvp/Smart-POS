package com.smartpos.auth_service.dto.response;

import java.util.List;

public record RoleDetailResponse (
        Long id,
        String name,
        String description,
        List<PermissionResponse> permissions
) {}
