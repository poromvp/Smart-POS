package com.smartpos.cataloginventory.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModifierOptionResponse {
    private Long id;
    private String name;
    private BigDecimal price;
}
