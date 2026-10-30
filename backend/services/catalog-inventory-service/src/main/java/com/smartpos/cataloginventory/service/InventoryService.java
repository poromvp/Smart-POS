package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.request.DeductInventoryRequest;
import com.smartpos.cataloginventory.dto.response.DeductInventoryResponse;

public interface InventoryService {
    DeductInventoryResponse deductInventory(DeductInventoryRequest request);
}
