package com.smartpos.auth_service.controller;

import com.smartpos.auth_service.dto.request.LoginRequest;
import com.smartpos.auth_service.dto.response.AuthResult;
import com.smartpos.auth_service.dto.response.TokenResponse;
import com.smartpos.auth_service.dto.response.UserResponse;
import com.smartpos.auth_service.security.CookieUtil;
import com.smartpos.auth_service.service.AuthService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResult result = authService.login(request);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        result.refreshTokenCookie().toString())
                .body(result.tokenResponse());
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserResponse> me(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                authService.getCurrentUser(
                        authentication.getName()
                )
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            HttpServletRequest request
    ) {
        String rawRefreshToken = cookieUtil
                .extractRefreshToken(request);
        AuthResult result = authService.refresh(rawRefreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        result.refreshTokenCookie().toString())
                .body(result.tokenResponse());
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            Authentication authentication
    ) {
        String rawRefreshToken = cookieUtil
                .extractRefreshToken(request);
        ResponseCookie cleanCookie = authService.logout(
                rawRefreshToken,
                authentication.getName()
        );

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, 
                        cleanCookie.toString())
                .build();
    }
}
