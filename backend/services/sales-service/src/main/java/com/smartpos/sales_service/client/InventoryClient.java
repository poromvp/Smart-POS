package com.smartpos.sales_service.client;

import com.smartpos.sales_service.client.dto.DeductInventoryRequest;
import com.smartpos.sales_service.client.dto.DeductInventoryResponse;
import com.smartpos.sales_service.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
    name = "catalog-inventory-service",
    url = "${app.services.catalog-inventory-url:http://localhost:8082}"
)
public interface InventoryClient {

    @PostMapping("/api/inventory/deduct")
    ApiResponse<DeductInventoryResponse> deductInventory(@RequestBody DeductInventoryRequest request);
}
