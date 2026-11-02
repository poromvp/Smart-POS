package com.smartpos.cataloginventory.dto.response;

import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class InventoryTransactionResponse {
    private Long id;
    private Long ingredientId;
    private String ingredientName;
    private String ingredientCode;
    private String unit;
    private BigDecimal quantity;
    private InventoryTransactionType transactionType;
    private String orderCode;
    private Long orderItemId;
    private Long purchaseOrderItemId;
    private LocalDateTime createdAt;
}
