package com.smartpos.auth_service.dto.response;

public record RoleResponse (
        Long id,
        String name,
        String description,
        boolean isSystem
) {}
