package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.dto.request.ProductCreateRequest;
import com.smartpos.cataloginventory.dto.request.ProductUpdateRequest;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.CategoryMenuResponse;
import com.smartpos.cataloginventory.dto.response.ProductDetailResponse;
import com.smartpos.cataloginventory.dto.response.ProductSummaryResponse;
import com.smartpos.cataloginventory.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDetailResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request) {
        ProductDetailResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Tạo món ăn thành công"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductSummaryResponse>>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) String search) {
        List<ProductSummaryResponse> response = productService.getProducts(categoryId, activeOnly, search);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // Endpoint Thực đơn tổng hợp phục vụ hiển thị Menu trên Web POS & QR Order
    @GetMapping("/menu")
    public ResponseEntity<ApiResponse<List<CategoryMenuResponse>>> getMenu() {
        List<CategoryMenuResponse> response = productService.getMenu();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductById(@PathVariable Long id) {
        ProductDetailResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        ProductDetailResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật món ăn thành công"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(
            @PathVariable Long id,
            @RequestParam Boolean isActive) {
        productService.toggleProductStatus(id, isActive);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cập nhật trạng thái kinh doanh thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa món ăn thành công"));
    }
}
