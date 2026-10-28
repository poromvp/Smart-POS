package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.dto.request.ModifierGroupCreateRequest;
import com.smartpos.cataloginventory.dto.request.ModifierGroupUpdateRequest;
import com.smartpos.cataloginventory.dto.request.ModifierOptionRequest;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.ModifierGroupResponse;
import com.smartpos.cataloginventory.dto.response.ModifierOptionResponse;
import com.smartpos.cataloginventory.service.ModifierGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modifier-groups")
@RequiredArgsConstructor
public class ModifierGroupController {

    private final ModifierGroupService modifierGroupService;

    @PostMapping
    public ResponseEntity<ApiResponse<ModifierGroupResponse>> createGroup(
            @Valid @RequestBody ModifierGroupCreateRequest request) {
        ModifierGroupResponse response = modifierGroupService.createGroup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Tạo nhóm tùy chọn thành công"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ModifierGroupResponse>>> getAllGroups() {
        List<ModifierGroupResponse> response = modifierGroupService.getAllGroups();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ModifierGroupResponse>> getGroupById(@PathVariable Long id) {
        ModifierGroupResponse response = modifierGroupService.getGroupById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ModifierGroupResponse>> updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody ModifierGroupUpdateRequest request) {
        ModifierGroupResponse response = modifierGroupService.updateGroup(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật nhóm tùy chọn thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable Long id) {
        modifierGroupService.deleteGroup(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa nhóm tùy chọn thành công"));
    }

    // API thêm riêng 1 option vào nhóm đã tồn tại
    @PostMapping("/{id}/options")
    public ResponseEntity<ApiResponse<ModifierOptionResponse>> addOption(
            @PathVariable Long id,
            @Valid @RequestBody ModifierOptionRequest request) {
        ModifierOptionResponse response = modifierGroupService.addOptionToGroup(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Thêm tùy chọn vào nhóm thành công"));
    }

    // API xóa 1 option khỏi nhóm
    @DeleteMapping("/{id}/options/{optionId}")
    public ResponseEntity<ApiResponse<Void>> deleteOption(
            @PathVariable Long id,
            @PathVariable Long optionId) {
        modifierGroupService.deleteOption(id, optionId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa tùy chọn thành công"));
    }
}
