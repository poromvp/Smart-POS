package com.smartpos.auth_service.controller;

import com.smartpos.auth_service.dto.request.CreateRoleRequest;
import com.smartpos.auth_service.dto.request.UpdateRoleRequest;
import com.smartpos.auth_service.dto.request.UpdateRolePermissionsRequest;
import com.smartpos.auth_service.dto.response.PermissionResponse;
import com.smartpos.auth_service.dto.response.RoleDetailResponse;
import com.smartpos.auth_service.dto.response.RoleResponse;
import com.smartpos.auth_service.dto.response.UserResponse;
import com.smartpos.auth_service.service.RoleService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Validated
public class RoleController {

    private final RoleService roleService;

    // Create a role
    @PostMapping
    public ResponseEntity<RoleResponse> createRole(
            @Valid @RequestBody CreateRoleRequest request
    ) {
        RoleResponse response = roleService.createRole(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // Get all roles with pagination
    @GetMapping
    public ResponseEntity<Page<RoleResponse>> getAllRoles(
            @PageableDefault(
                    page = 0,
                    size = 10,
                    sort = "name",
                    direction = Sort.Direction.ASC
            )
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                roleService.getAllRoles(pageable)
        );
    }

    // Get role details
    @GetMapping("/{id}")
    public ResponseEntity<RoleDetailResponse> getRoleById(
            @PathVariable @Positive(message = "Role ID must be positive")
            Long id
    ) {
        return ResponseEntity.ok(
                roleService.getRoleById(id)
        );
    }

    // Update a role
    @PutMapping("/{id}")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable @Positive(message = "Role ID must be positive")
            Long id,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return ResponseEntity.ok(
                roleService.updateRole(id, request)
        );
    }

    // Delete a role
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(
            @PathVariable @Positive(message = "Role ID must be positive")
            Long id
    ) {
        roleService.deleteRole(id);

        return ResponseEntity.noContent().build();
    }

    // Get permissions assigned to a role
    @GetMapping("/{roleId}/permissions")
    public ResponseEntity<List<PermissionResponse>> getPermissionsByRoleId(
            @PathVariable @Positive(message = "Role ID must be positive")
            Long roleId
    ) {
        return ResponseEntity.ok(
                roleService.getPermissionsByRoleId(roleId)
        );
    }

    // Replace permissions assigned to a role
    @PutMapping("/{roleId}/permissions")
    public ResponseEntity<RoleResponse> replacePermissions(
            @PathVariable @Positive(message = "Role ID must be positive")
            Long roleId,
            @Valid @RequestBody UpdateRolePermissionsRequest request
    ) {
        return ResponseEntity.ok(
                roleService.replacePermissions(roleId, request)
        );
    }

    // Get users assigned to a role
    @GetMapping("/{roleId}/users")
    public ResponseEntity<Page<UserResponse>> getUsersByRoleId(
            @PathVariable @Positive(message = "Role ID must be positive")
            Long roleId,
            @PageableDefault(
                    page = 0,
                    size = 10,
                    sort = "username",
                    direction = Sort.Direction.ASC
            )
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                roleService.getUsersByRoleId(roleId, pageable)
        );
    }
}