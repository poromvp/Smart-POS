package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(

        @NotBlank(message = "Username is required")
        @Size(max = 50, message = "Username must not exceed 50 characters")
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72,
                message = "Password must be between 8 and 72 characters")
        String password,

        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must not exceed 100 characters")
        String fullName,

        @NotBlank(message = "Phone is required")
        @Pattern(
                regexp = "^0[0-9]{9}$",
                message = "Phone must start with 0 and contain exactly 10 digits"
        )
        String phone,

        @NotNull(message = "Role ID is required")
        @Positive(message = "Role ID must be greater than 0")
        Long roleId
) {}