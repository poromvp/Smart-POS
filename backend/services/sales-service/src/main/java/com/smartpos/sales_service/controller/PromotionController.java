package com.smartpos.sales_service.controller;

import com.smartpos.sales_service.dto.request.ApplyPromotionRequest;
import com.smartpos.sales_service.dto.request.PromotionRequest;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.ApplyPromotionResponse;
import com.smartpos.sales_service.dto.response.PromotionResponse;
import com.smartpos.sales_service.security.RequirePermissions;
import com.smartpos.sales_service.service.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
@Tag(name = "Promotion Controller", description = "Quản lý chương trình khuyến mãi & mã giảm giá")
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping
    @RequirePermissions(anyOf = {"ADMIN_DASHBOARD"})
    @Operation(summary = "Tạo mã khuyến mãi mới")
    public ResponseEntity<ApiResponse<PromotionResponse>> createPromotion(@Valid @RequestBody PromotionRequest request) {
        PromotionResponse response = promotionService.createPromotion(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo khuyến mãi thành công"));
    }

    @GetMapping
    @RequirePermissions(anyOf = {"POS_ACCESS", "ORDER_READ", "REPORT_VIEW", "ADMIN_DASHBOARD"})
    @Operation(summary = "Lấy danh sách mã khuyến mãi")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getAllPromotions(
            @RequestParam(required = false) Boolean activeOnly) {
        List<PromotionResponse> responses = promotionService.getAllPromotions(activeOnly);
        return ResponseEntity.ok(ApiResponse.success(responses, "Lấy danh sách khuyến mãi thành công"));
    }

    @GetMapping("/{id}")
    @RequirePermissions(anyOf = {"POS_ACCESS", "ORDER_READ", "REPORT_VIEW", "ADMIN_DASHBOARD"})
    @Operation(summary = "Chi tiết khuyến mãi theo ID")
    public ResponseEntity<ApiResponse<PromotionResponse>> getPromotionById(@PathVariable Long id) {
        PromotionResponse response = promotionService.getPromotionById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết khuyến mãi thành công"));
    }

    @GetMapping("/code/{code}")
    @RequirePermissions(anyOf = {"POS_ACCESS", "ORDER_READ", "REPORT_VIEW", "ADMIN_DASHBOARD"})
    @Operation(summary = "Tra cứu khuyến mãi theo mã")
    public ResponseEntity<ApiResponse<PromotionResponse>> getPromotionByCode(@PathVariable String code) {
        PromotionResponse response = promotionService.getPromotionByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu khuyến mãi thành công"));
    }

    @PutMapping("/{id}/status")
    @RequirePermissions(anyOf = {"ADMIN_DASHBOARD"})
    @Operation(summary = "Bật / tắt trạng thái khuyến mãi")
    public ResponseEntity<ApiResponse<PromotionResponse>> toggleStatus(
            @PathVariable Long id,
            @RequestParam Boolean active) {
        PromotionResponse response = promotionService.togglePromotionStatus(id, active);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái thành công"));
    }

    @DeleteMapping("/{id}")
    @RequirePermissions(anyOf = {"ADMIN_DASHBOARD"})
    @Operation(summary = "Xóa mã khuyến mãi")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Long id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa khuyến mãi thành công"));
    }

    @PostMapping("/apply")
    @RequirePermissions(allowPublic = true)
    @Operation(summary = "Kiểm tra và tính toán giảm giá của voucher")
    public ResponseEntity<ApiResponse<ApplyPromotionResponse>> applyPromotion(
            @Valid @RequestBody ApplyPromotionRequest request) {
        ApplyPromotionResponse response = promotionService.applyPromotion(request);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }
}
