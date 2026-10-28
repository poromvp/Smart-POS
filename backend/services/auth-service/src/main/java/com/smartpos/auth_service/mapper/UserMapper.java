package com.smartpos.auth_service.mapper;

import com.smartpos.auth_service.dto.response.CurrentUserResponse;
import com.smartpos.auth_service.dto.response.UserResponse;
import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
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

    public CurrentUserResponse toCurrentResponse(User user) {
        List<String> permissions = user.getRole()
                .getPermissions()
                .stream()
                .map(Permission::getCode)
                .toList();

        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole().getName(),
                permissions
        );
    }

}
