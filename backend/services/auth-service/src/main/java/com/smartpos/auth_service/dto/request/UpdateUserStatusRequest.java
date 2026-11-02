package com.smartpos.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "Active status is required")
        Boolean active
) {}