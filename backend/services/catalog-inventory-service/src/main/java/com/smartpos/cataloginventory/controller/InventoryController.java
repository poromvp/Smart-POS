package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.dto.request.DeductInventoryRequest;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.DeductInventoryResponse;
import com.smartpos.cataloginventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @PostMapping("/deduct")
    public ResponseEntity<ApiResponse<DeductInventoryResponse>> deductInventory(
            @Valid @RequestBody DeductInventoryRequest request) {
        DeductInventoryResponse response = inventoryService.deductInventory(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Trừ kho thành công"));
    }
}
