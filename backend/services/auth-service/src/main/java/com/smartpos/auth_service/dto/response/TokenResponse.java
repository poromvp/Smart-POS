package com.smartpos.auth_service.dto.response;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {}
