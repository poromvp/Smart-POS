package com.smartpos.cataloginventory.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class RecipeItemResponse {
    private Long ingredientId;
    private String ingredientName;
    private String ingredientCode;
    private String unit;
    private BigDecimal quantityNeeded;
}
