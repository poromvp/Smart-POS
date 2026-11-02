package com.smartpos.cataloginventory.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {
    private Long id;
    private String sizeName;
    private BigDecimal priceAdjustment;
    private BigDecimal finalPrice; // Giá bán thực tế = basePrice + priceAdjustment
    private String sku;
}
