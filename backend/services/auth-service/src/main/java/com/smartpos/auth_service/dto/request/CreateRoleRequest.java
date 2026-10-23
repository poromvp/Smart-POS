package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoleRequest (
        @NotBlank
        @Size(max = 50)
        String name,

        @Size(max = 255)
        String description
) {}
