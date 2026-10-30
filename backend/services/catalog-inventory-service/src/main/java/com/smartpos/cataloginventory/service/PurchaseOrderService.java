package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.domain.PurchaseOrderStatus;
import com.smartpos.cataloginventory.dto.request.PurchaseOrderCreateRequest;
import com.smartpos.cataloginventory.dto.request.PurchaseOrderUpdateRequest;
import com.smartpos.cataloginventory.dto.response.PurchaseOrderResponse;

import java.time.LocalDate;
import java.util.List;

public interface PurchaseOrderService {

    PurchaseOrderResponse createPurchaseOrder(PurchaseOrderCreateRequest request);

    PurchaseOrderResponse updatePurchaseOrder(Long id, PurchaseOrderUpdateRequest request);

    PurchaseOrderResponse getPurchaseOrderById(Long id);

    List<PurchaseOrderResponse> getPurchaseOrders(PurchaseOrderStatus status, Long supplierId, LocalDate fromDate, LocalDate toDate);

    PurchaseOrderResponse completePurchaseOrder(Long id);

    PurchaseOrderResponse cancelPurchaseOrder(Long id);
}
