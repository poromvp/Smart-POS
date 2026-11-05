package com.smartpos.sales_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyPromotionResponse {
    private Boolean valid;
    private String code;
    private String name;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal finalSubtotal;
    private String message;
}
