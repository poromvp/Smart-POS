package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest (

        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must not exceed 100 characters")
        String fullName,

        @NotBlank(message = "Phone is required")
        @Pattern(
                regexp = "^0[0-9]{9}$",
                message = "Phone must start with 0 and contain exactly 10 digits"
        )
        String phone
) {}
