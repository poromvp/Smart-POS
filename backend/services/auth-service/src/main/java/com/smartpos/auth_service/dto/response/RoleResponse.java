package com.smartpos.auth_service.dto.response;

import java.util.Set;

public record RoleResponse (
        Long id,
        String name,
        String description
) {}
