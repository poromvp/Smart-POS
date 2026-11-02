package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AssignRoleRequest(
        @NotNull(message = "Role ID is required")
        @Positive(message = "Role ID must be positive")
        Long roleId
) {}