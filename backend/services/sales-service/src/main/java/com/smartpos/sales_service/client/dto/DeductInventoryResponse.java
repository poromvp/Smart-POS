package com.smartpos.sales_service.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeductInventoryResponse {
    private String orderCode;
    private List<IngredientDeduction> deductions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IngredientDeduction {
        private Long ingredientId;
        private String ingredientName;
        private String unit;
        private BigDecimal quantityDeducted;
        private BigDecimal stockBefore;
        private BigDecimal stockAfter;
    }
}
