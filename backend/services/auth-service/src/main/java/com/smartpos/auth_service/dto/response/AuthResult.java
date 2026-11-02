package com.smartpos.auth_service.dto.response;

import org.springframework.http.ResponseCookie;

public record AuthResult(
        TokenResponse tokenResponse,
        ResponseCookie refreshTokenCookie
) {}
