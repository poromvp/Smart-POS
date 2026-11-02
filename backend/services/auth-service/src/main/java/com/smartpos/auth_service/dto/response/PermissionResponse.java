package com.smartpos.auth_service.dto.response;

public record PermissionResponse (
        Long id,
        String code,
        String name,
        String module
) {}
