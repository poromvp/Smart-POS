package com.smartpos.auth_service.service;

import com.smartpos.auth_service.dto.request.LoginRequest;
import com.smartpos.auth_service.dto.response.AuthResult;
import com.smartpos.auth_service.dto.response.TokenResponse;
import com.smartpos.auth_service.dto.response.UserResponse;
import com.smartpos.auth_service.entity.RefreshToken;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.repository.UserRepository;
import com.smartpos.auth_service.security.CookieUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final CookieUtil cookieUtil;

    @Transactional
    public AuthResult login(LoginRequest request) {

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.username(),
                                request.password()
                        )
                );

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user was not found"
                        )
                );

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = refreshTokenService.createRefreshToken(user);

        ResponseCookie cookie = cookieUtil.createRefreshTokenCookie(rawRefreshToken);

        TokenResponse tokenResponse = new TokenResponse(
                accessToken,
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds()
        );

        return new AuthResult(tokenResponse, cookie);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                   new UsernameNotFoundException(
                           "User not found"
                   )
                );

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getPhone(),
                user.isActive(),
                user.getRole().getName(),
                user.getCreatedAt()
        );
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null) {
            throw new BadCredentialsException("Missing refresh token cookie");
        }

        RefreshToken oldToken = refreshTokenService.verifyAndGetValidToken(rawRefreshToken);
        User user = oldToken.getUser();

        if (!user.isActive()) {
            oldToken.revoke();
            throw new BadCredentialsException("Invalid refresh token");
        }

        oldToken.revoke();

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = refreshTokenService.createRefreshToken(user);

        ResponseCookie cookie = cookieUtil.createRefreshTokenCookie(newRefreshToken);

        TokenResponse tokenResponse = new TokenResponse(
                newAccessToken,
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds()
        );

        return new AuthResult(tokenResponse, cookie);
    }

    @Transactional
    public ResponseCookie logout(
            String rawRefreshToken,
            String authenticatedUsername
    ) {
        if (rawRefreshToken != null) {
            refreshTokenService.revokeToken(
                    rawRefreshToken,
                    authenticatedUsername
            );
        }

        return cookieUtil.cleanRefreshTokenCookie();
    }
}
