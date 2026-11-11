package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import com.smartpos.cataloginventory.dto.request.DeductInventoryRequest;
import com.smartpos.cataloginventory.dto.request.InventoryAdjustmentRequest;
import com.smartpos.cataloginventory.dto.response.InventoryAdjustmentResponse;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.DeductInventoryResponse;
import com.smartpos.cataloginventory.dto.response.InventoryTransactionResponse;
import com.smartpos.cataloginventory.dto.response.LowStockAlertResponse;
import com.smartpos.cataloginventory.security.RequirePermissions;
import com.smartpos.cataloginventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/deduct")
    @RequirePermissions(anyOf = {"INVENTORY_EXPORT"}, allowInternal = true)
    public ResponseEntity<ApiResponse<DeductInventoryResponse>> deductInventory(
            @Valid @RequestBody DeductInventoryRequest request) {
        DeductInventoryResponse response = inventoryService.deductInventory(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Trừ kho thành công"));
    }

    @PostMapping("/adjust")
    @RequirePermissions(anyOf = {"INVENTORY_EXPORT", "INVENTORY_IMPORT"})
    public ResponseEntity<ApiResponse<InventoryAdjustmentResponse>> adjustInventory(
            @Valid @RequestBody InventoryAdjustmentRequest request) {
        InventoryAdjustmentResponse response = inventoryService.adjustInventory(request);
        String message = request.getType() == InventoryTransactionType.SPOILAGE
                ? "Ghi nhận xuất hủy hỏng hóc thành công"
                : "Cân bằng tồn kho kiểm kê thành công";
        return ResponseEntity.ok(ApiResponse.ok(response, message));
    }

    @GetMapping("/low-stock")
    @RequirePermissions(anyOf = {"INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_EXPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<List<LowStockAlertResponse>>> getLowStockAlerts() {
        List<LowStockAlertResponse> response = inventoryService.getLowStockAlerts();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/transactions")
    @RequirePermissions(anyOf = {"INVENTORY_VIEW", "INVENTORY_IMPORT", "INVENTORY_EXPORT", "ADMIN_DASHBOARD"})
    public ResponseEntity<ApiResponse<List<InventoryTransactionResponse>>> getTransactions(
            @RequestParam(required = false) Long ingredientId,
            @RequestParam(required = false) InventoryTransactionType type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

        List<InventoryTransactionResponse> response = inventoryService.getTransactions(
                ingredientId, type, search, fromDateTime, toDateTime);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
