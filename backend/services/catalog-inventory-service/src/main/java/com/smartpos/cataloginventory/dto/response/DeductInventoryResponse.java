package com.smartpos.cataloginventory.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
public class DeductInventoryResponse {
    private String orderCode;
    private List<IngredientDeduction> deductions;

    @Getter
    @Setter
    @Builder
    public static class IngredientDeduction {
        private Long ingredientId;
        private String ingredientName;
        private String unit;
        private BigDecimal quantityDeducted;
        private BigDecimal stockBefore;
        private BigDecimal stockAfter;
    }
}
