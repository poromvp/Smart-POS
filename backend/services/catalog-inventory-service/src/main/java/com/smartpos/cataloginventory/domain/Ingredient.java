package com.smartpos.cataloginventory.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ingredients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ingredient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 20)
    private String unit; // g, ml, lon, cái...

    @Column(name = "current_stock", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "min_threshold", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal minThreshold = BigDecimal.ZERO;

    @Column(name = "cost_per_unit", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal costPerUnit = BigDecimal.ZERO;
}
