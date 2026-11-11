package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.dto.request.CategoryCreateRequest;
import com.smartpos.cataloginventory.dto.request.CategoryUpdateRequest;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.CategoryResponse;
import com.smartpos.cataloginventory.security.RequirePermissions;
import com.smartpos.cataloginventory.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @PostMapping
    @RequirePermissions(anyOf = {"MENU_CREATE"})
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryCreateRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Tạo danh mục thành công"));
    }

    @GetMapping
    @RequirePermissions(anyOf = {"MENU_READ", "MENU_CREATE", "MENU_UPDATE", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories(
            @RequestParam(required = false, defaultValue = "false") Boolean activeOnly) {
        List<CategoryResponse> categories = categoryService.getAllCategories(activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @GetMapping("/{id}")
    @RequirePermissions(anyOf = {"MENU_READ", "MENU_CREATE", "MENU_UPDATE", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {
        CategoryResponse response = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @RequirePermissions(anyOf = {"MENU_UPDATE"})
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequest request) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật danh mục thành công"));
    }

    @PatchMapping("/{id}/status")
    @RequirePermissions(anyOf = {"MENU_UPDATE"})
    public ResponseEntity<ApiResponse<Void>> toggleStatus(
            @PathVariable Long id,
            @RequestParam Boolean isActive) {
        categoryService.toggleCategoryStatus(id, isActive);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cập nhật trạng thái thành công"));
    }

    @DeleteMapping("/{id}")
    @RequirePermissions(anyOf = {"MENU_DELETE"})
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa danh mục thành công"));
    }
}
