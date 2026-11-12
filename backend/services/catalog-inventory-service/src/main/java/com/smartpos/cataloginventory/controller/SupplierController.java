package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.dto.request.SupplierCreateRequest;
import com.smartpos.cataloginventory.dto.request.SupplierUpdateRequest;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.SupplierResponse;
import com.smartpos.cataloginventory.security.RequirePermissions;
import com.smartpos.cataloginventory.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @PostMapping
    @RequirePermissions(anyOf = {"INVENTORY_IMPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<SupplierResponse>> createSupplier(
            @Valid @RequestBody SupplierCreateRequest request) {
        SupplierResponse response = supplierService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Tạo nhà cung cấp thành công"));
    }

    @GetMapping
    @RequirePermissions(anyOf = {"INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_EXPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getSuppliers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean activeOnly) {
        List<SupplierResponse> response = supplierService.getSuppliers(search, activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @RequirePermissions(anyOf = {"INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_EXPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable Long id) {
        SupplierResponse response = supplierService.getSupplierById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @RequirePermissions(anyOf = {"INVENTORY_IMPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierUpdateRequest request) {
        SupplierResponse response = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật nhà cung cấp thành công"));
    }

    @PatchMapping("/{id}/status")
    @RequirePermissions(anyOf = {"INVENTORY_IMPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<Void>> toggleSupplierStatus(
            @PathVariable Long id,
            @RequestParam Boolean isActive) {
        supplierService.toggleSupplierStatus(id, isActive);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cập nhật trạng thái nhà cung cấp thành công"));
    }

    @DeleteMapping("/{id}")
    @RequirePermissions(anyOf = {"INVENTORY_IMPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa nhà cung cấp thành công"));
    }
}
