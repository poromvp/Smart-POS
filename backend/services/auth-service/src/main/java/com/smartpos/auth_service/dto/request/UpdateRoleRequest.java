package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateRoleRequest (
        @NotBlank
        @Size(max = 50)
        String name,

        @Size(max = 255)
        String description
) {}