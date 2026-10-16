package com.smartpos.auth_service.service;

import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.repository.UserRepository;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class AuthUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AuthUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        Role role = user.getRole();

        Set<GrantedAuthority> authorities = new HashSet<>();

        // Role authority: ROLE_ADMIN, ROLE_STAFF, ROLE_CUSTOMER
        authorities.add(
                new SimpleGrantedAuthority("ROLE_" + role.getName())
        );

        // Permission authorities: ORDER_CREATE, INVENTORY_VIEW, ...
        for (Permission permission : role.getPermissions()) {
            authorities.add(
                    new SimpleGrantedAuthority(permission.getCode())
            );
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPasswordHash())
                .disabled(!user.isActive())
                .authorities(authorities)
                .build();
    }
}