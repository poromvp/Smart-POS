package com.smartpos.auth_service.dto.response;

import java.time.LocalDateTime;

public record UserResponse (
        Long id,
        String username,
        String fullName,
        String phone,
        boolean active,
        String roleName,
        LocalDateTime createdAt
) {}
