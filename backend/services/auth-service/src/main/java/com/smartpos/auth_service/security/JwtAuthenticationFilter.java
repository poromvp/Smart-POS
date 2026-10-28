package com.smartpos.auth_service.security;

import com.smartpos.auth_service.service.AuthUserDetailsService;
import com.smartpos.auth_service.service.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthUserDetailsService userDetailsService;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            AuthUserDetailsService userDetailsService,
            RestAuthenticationEntryPoint authenticationEntryPoint
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()) {
            rejectToken(request, response,
                    new BadCredentialsException("Empty bearer token"));
            return;
        }

        try {
            if (SecurityContextHolder.getContext()
                    .getAuthentication() != null) {
                filterChain.doFilter(request, response);
                return;
            }

            String username = jwtService.extractUsername(token);

            if (username == null || username.isBlank()) {
                throw new BadCredentialsException(
                        "Invalid JWT subject");
            }

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

            if (!userDetails.isEnabled()) {
                throw new BadCredentialsException(
                        "Account is disabled");
            }

            if (!jwtService.isTokenValid(
                    token, userDetails.getUsername())) {
                throw new BadCredentialsException(
                        "Invalid or expired JWT");
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource()
                            .buildDetails(request)
            );

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);

        } catch (JwtException
                 | IllegalArgumentException
                 | AuthenticationException ex) {

            SecurityContextHolder.clearContext();

            rejectToken(request, response,
                    new BadCredentialsException(
                            "Invalid or expired JWT", ex));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void rejectToken(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {

        SecurityContextHolder.clearContext();

        authenticationEntryPoint.commence(
                request, response, exception);
    }
}