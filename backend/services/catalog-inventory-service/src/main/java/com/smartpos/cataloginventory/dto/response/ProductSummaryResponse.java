package com.smartpos.cataloginventory.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSummaryResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String code;
    private BigDecimal basePrice;
    private String imageUrl;
    private Boolean isActive;
    private Integer variantCount;
}
