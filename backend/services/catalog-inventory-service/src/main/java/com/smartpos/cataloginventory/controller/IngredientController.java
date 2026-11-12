package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.dto.request.IngredientCreateRequest;
import com.smartpos.cataloginventory.dto.request.IngredientUpdateRequest;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.IngredientResponse;
import com.smartpos.cataloginventory.security.RequirePermissions;
import com.smartpos.cataloginventory.service.IngredientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
public class IngredientController {
    private final IngredientService ingredientService;

    @PostMapping
    @RequirePermissions(anyOf = {"INVENTORY_IMPORT", "INVENTORY_EXPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<IngredientResponse>> createIngredient(
            @Valid @RequestBody IngredientCreateRequest request) {
        IngredientResponse response = ingredientService.createIngredient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Tạo nguyên liệu thành công"));
    }

    @GetMapping
    @RequirePermissions(anyOf = {"INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_EXPORT", "MENU_CREATE", "MENU_UPDATE", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getAllIngredients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") Boolean activeOnly) {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.getAllIngredients(search, activeOnly)));
    }

    @GetMapping("/{id}")
    @RequirePermissions(anyOf = {"INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_EXPORT", "MENU_CREATE", "MENU_UPDATE", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<IngredientResponse>> getIngredientById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.getIngredientById(id)));
    }

    @PutMapping("/{id}")
    @RequirePermissions(anyOf = {"INVENTORY_IMPORT", "INVENTORY_EXPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<IngredientResponse>> updateIngredient(
            @PathVariable Long id,
            @Valid @RequestBody IngredientUpdateRequest request) {
        IngredientResponse response = ingredientService.updateIngredient(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật nguyên liệu thành công"));
    }

    @PatchMapping("/{id}/status")
    @RequirePermissions(anyOf = {"INVENTORY_IMPORT", "INVENTORY_EXPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<Void>> toggleStatus(
            @PathVariable Long id,
            @RequestParam Boolean isActive) {
        ingredientService.toggleIngredientStatus(id, isActive);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cập nhật trạng thái nguyên liệu thành công"));
    }

    @DeleteMapping("/{id}")
    @RequirePermissions(anyOf = {"INVENTORY_IMPORT", "INVENTORY_EXPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<Void>> deleteIngredient(@PathVariable Long id) {
        ingredientService.deleteIngredient(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa nguyên liệu thành công"));
    }
}
