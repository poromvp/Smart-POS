package com.smartpos.auth_service.dto.response;

import java.util.List;

public record CurrentUserResponse(
        Long id,
        String username,
        String fullName,
        String roleName,
        List<String> permissions
) {}
