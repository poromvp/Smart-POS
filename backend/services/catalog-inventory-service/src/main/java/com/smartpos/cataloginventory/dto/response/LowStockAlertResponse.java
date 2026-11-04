package com.smartpos.cataloginventory.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class LowStockAlertResponse {
    private Long ingredientId;
    private String ingredientName;
    private String ingredientCode;
    private String unit;
    private BigDecimal currentStock;
    private BigDecimal minThreshold;
    private BigDecimal deficit;
    private BigDecimal stockPercentage;
    private BigDecimal costPerUnit;
    private BigDecimal estimatedReorderCost;
    private BigDecimal suggestedReorderQuantity;
}
