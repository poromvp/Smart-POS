package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import com.smartpos.cataloginventory.dto.request.DeductInventoryRequest;
import com.smartpos.cataloginventory.dto.request.InventoryAdjustmentRequest;
import com.smartpos.cataloginventory.dto.response.DeductInventoryResponse;
import com.smartpos.cataloginventory.dto.response.InventoryAdjustmentResponse;
import com.smartpos.cataloginventory.dto.response.InventoryTransactionResponse;
import com.smartpos.cataloginventory.dto.response.LowStockAlertResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryService {

    DeductInventoryResponse deductInventory(DeductInventoryRequest request);

    InventoryAdjustmentResponse adjustInventory(InventoryAdjustmentRequest request);

    List<LowStockAlertResponse> getLowStockAlerts();

    List<InventoryTransactionResponse> getTransactions(
            Long ingredientId,
            InventoryTransactionType type,
            String search,
            LocalDateTime fromDate,
            LocalDateTime toDate);
}
