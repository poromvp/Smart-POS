package com.smartpos.sales_service.dto.response;

import com.smartpos.sales_service.entity.ItemKdsStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private Long variantId;
    private List<Long> modifierOptionIds;
    private String itemId;
    private String name;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal modifierTotal;
    private String toppings;
    private String sweetness;
    private String note;
    private BigDecimal subTotal;
    private ItemKdsStatus kdsStatus;
    private LocalDateTime createdAt;
}
