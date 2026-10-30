package com.smartpos.sales_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @Column(name = "item_id", nullable = false, length = 64)
    private String itemId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "modifier_total", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal modifierTotal = BigDecimal.ZERO;

    @Column(name = "toppings", length = 500)
    private String toppings;

    @Column(name = "sweetness", length = 50)
    private String sweetness;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}
