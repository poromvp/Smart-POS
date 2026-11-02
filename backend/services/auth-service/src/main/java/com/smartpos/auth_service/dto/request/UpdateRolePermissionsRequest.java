package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.Set;

public record UpdateRolePermissionsRequest(
        @NotNull(message = "Permission IDs must not be null")
        Set<@NotNull @Positive Long> permissionIds
) {}