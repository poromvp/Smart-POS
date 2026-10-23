package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record UpdateRolePermissionsRequest(
        @NotNull
        Set<Long> permissionIds
) {}