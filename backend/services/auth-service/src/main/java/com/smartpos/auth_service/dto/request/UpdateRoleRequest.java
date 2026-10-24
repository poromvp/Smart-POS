package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateRoleRequest (
        @NotBlank(message = "Role name must not be blank")
        @Size(
                max = 50,
                message = "Role name must not exceed 50 characters"
        )
        String name,

        @Size(
                max = 255,
                message = "Description must not exceed 255 characters"
        )
        String description
) {}