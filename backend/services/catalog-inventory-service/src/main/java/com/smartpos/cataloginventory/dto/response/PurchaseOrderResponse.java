package com.smartpos.cataloginventory.dto.response;

import com.smartpos.cataloginventory.domain.PurchaseOrderStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class PurchaseOrderResponse {
    private Long id;
    private String poNumber;
    private Long supplierId;
    private String supplierName;
    private Long staffId;
    private LocalDate orderDate;
    private LocalDate deliveryDate;
    private BigDecimal totalAmount;
    private PurchaseOrderStatus status;
    private String note;
    private LocalDateTime createdAt;
    private List<PurchaseOrderItemResponse> items;
}
