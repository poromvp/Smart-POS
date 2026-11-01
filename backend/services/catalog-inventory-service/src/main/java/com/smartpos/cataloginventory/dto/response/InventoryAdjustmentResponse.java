package com.smartpos.cataloginventory.dto.response;

import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class InventoryAdjustmentResponse {
    private Long transactionId;
    private Long ingredientId;
    private String ingredientName;
    private String unit;
    private BigDecimal stockBefore;
    private BigDecimal stockAfter;
    private BigDecimal diffQuantity;
    private InventoryTransactionType type;
    private String reason;
    private LocalDateTime createdAt;
}
