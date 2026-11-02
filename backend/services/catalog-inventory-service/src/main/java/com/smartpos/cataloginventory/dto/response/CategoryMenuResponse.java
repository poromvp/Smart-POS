package com.smartpos.cataloginventory.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryMenuResponse {
    private Long categoryId;
    private String categoryName;
    private Integer displayOrder;
    private List<ProductDetailResponse> products;
}
