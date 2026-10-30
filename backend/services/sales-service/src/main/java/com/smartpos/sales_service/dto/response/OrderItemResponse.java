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
public class OrderItemResponse {
    private Long id;
    private String itemId;
    private String name;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal modifierTotal;
    private String toppings;
    private String sweetness;
    private String note;
    private BigDecimal subTotal;
}
