package com.smartpos.auth_service.mapper;

import com.smartpos.auth_service.dto.response.UserResponse;
import com.smartpos.auth_service.entity.User;
import org.springframework.stereotype.Component;

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
}
