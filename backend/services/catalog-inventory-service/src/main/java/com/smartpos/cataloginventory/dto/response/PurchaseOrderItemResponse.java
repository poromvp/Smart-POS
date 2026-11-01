package com.smartpos.cataloginventory.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
public class PurchaseOrderItemResponse {
    private Long id;
    private Long ingredientId;
    private String ingredientName;
    private String ingredientCode;
    private String unit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private LocalDate expiryDate;
}
