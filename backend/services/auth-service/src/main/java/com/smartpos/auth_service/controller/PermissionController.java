package com.smartpos.auth_service.controller;

import com.smartpos.auth_service.dto.response.PermissionResponse;
import com.smartpos.auth_service.service.PermissionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@Validated
@SecurityRequirement(name = "bearerAuth")
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERMISSION_READ')")
    public ResponseEntity<List<PermissionResponse>> getAllPermissions(
            @RequestParam(required = false) String module
    ) {
        return ResponseEntity.ok(
                permissionService.getAllPermissions(module)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERMISSION_READ')")
    public ResponseEntity<PermissionResponse> getPermissionById(
            @PathVariable
            @Positive(message = "Permission ID must be greater than 0")
            Long id
    ) {
        return ResponseEntity.ok(
                permissionService.getPermissionById(id)
        );
    }
}
