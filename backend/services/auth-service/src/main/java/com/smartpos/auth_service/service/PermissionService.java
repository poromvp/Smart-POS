package com.smartpos.auth_service.service;

import com.smartpos.auth_service.dto.response.PermissionResponse;
import com.smartpos.auth_service.entity.Permission;
import com.smartpos.auth_service.exception.ResourceNotFoundException;
import com.smartpos.auth_service.mapper.PermissionMapper;
import com.smartpos.auth_service.repository.PermissionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    public List<PermissionResponse> getAllPermissions(String module) {
        List<Permission> permissions;
        if (module == null || module.isBlank()) {
            permissions = permissionRepository
                    .findAllByOrderByModuleAscCodeAsc();
        }
        else {
            permissions = permissionRepository
                    .findByModuleIgnoreCase(module.trim());
        }

        return permissions.stream()
                .map(permissionMapper::toResponse)
                .toList();
    }

    public PermissionResponse getPermissionById(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Permission not found: " + id
                ));

        return permissionMapper.toResponse(permission);
    }
}
