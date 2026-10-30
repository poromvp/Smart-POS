package com.smartpos.auth_service.service;

import com.smartpos.auth_service.dto.request.*;
import com.smartpos.auth_service.dto.response.UserResponse;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import com.smartpos.auth_service.exception.BusinessException;
import com.smartpos.auth_service.exception.DuplicateResourceException;
import com.smartpos.auth_service.exception.ResourceNotFoundException;
import com.smartpos.auth_service.mapper.UserMapper;
import com.smartpos.auth_service.repository.RoleRepository;
import com.smartpos.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {

        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException(
                    "Username already exists"
            );
        }

        Role role = getRoleById(request.roleId());

        User user = new User(
                request.username(),
                passwordEncoder.encode(request.password()),
                request.fullName(),
                request.phone()
        );

        user.setRole(role);

        User savedUser = userRepository.save(user);

        return userMapper.toResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(userMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = getByUserId(id);

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateUser(
            Long id,
            UpdateUserRequest request
    ) {
        User user = getByUserId(id);

        user.setFullName(request.fullName());
        user.setPhone(request.phone());

        return userMapper.toResponse(user);
    }
    
    @Transactional
    public UserResponse updateUserStatus(
            Long id,
            UpdateUserStatusRequest request
    ) {
        User user = getByUserId(id);

        user.setActive(request.active());

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse assignRole(
            Long userId,
            AssignRoleRequest request
    ) {
        User user = getByUserId(userId);
        Role role = getRoleById(request.roleId());

        if (user.getRole().getName().equals("ADMIN")) {
            throw new BusinessException("Cannot change ADMIN's role");
        }

        if (role.getName().equals("ADMIN")) {
            throw new BusinessException("Cannot assign ADMIN role to an user");
        }

        user.setRole(role);

        return userMapper.toResponse(user);
    }

    @Transactional
    public void resetPassword(
            Long userId,
            ResetPasswordRequest request
    ) {
        User user = getByUserId(userId);

        user.setPasswordHash(
                passwordEncoder.encode(request.newPassword()));

        userRepository.save(user);
        refreshTokenService.revokeAllByUserId(user.getId());
    }

    private User getByUserId(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found"
                ));
    }

    private Role getRoleById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role not found"
                ));
    }
}
