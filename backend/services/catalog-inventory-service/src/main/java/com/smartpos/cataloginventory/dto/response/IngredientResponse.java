package com.smartpos.cataloginventory.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class IngredientResponse {
    private Long id;
    private String name;
    private String code;
    private String unit;
    private BigDecimal currentStock;
    private BigDecimal minThreshold;
    private BigDecimal costPerUnit;
    private Boolean lowStock; // currentStock <= minThreshold
}
