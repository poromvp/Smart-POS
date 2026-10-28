package com.smartpos.cataloginventory.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String code;
    private BigDecimal basePrice;
    private String imageUrl;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<ProductVariantResponse> variants;
    private List<ModifierGroupResponse> modifierGroups;
}
