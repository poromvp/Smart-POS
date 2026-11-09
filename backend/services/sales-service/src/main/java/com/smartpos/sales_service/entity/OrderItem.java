package com.smartpos.sales_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartpos.sales_service.converter.LongListJsonConverter;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // 1. Mã số món ăn (tham chiếu sang catalog-inventory-service)
    @Column(name = "product_id", nullable = false)
    private Long productId;

    // 2. Mã biến thể Size (ví dụ: Size L, Size M) - null nếu món không phân size
    @Column(name = "variant_id")
    private Long variantId;

    // Cột item_id cũ hỗ trợ tương thích ngược
    @Column(name = "item_id", length = 64)
    private String itemId;

    // 3. Tên món hiển thị trên hóa đơn / KDS
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "modifier_total", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal modifierTotal = BigDecimal.ZERO;

    // 4. Danh sách các ID tùy chọn topping, đường, đá đã chọn
    @Convert(converter = LongListJsonConverter.class)
    @Column(name = "modifier_option_ids", columnDefinition = "jsonb")
    @Builder.Default
    private List<Long> modifierOptionIds = new ArrayList<>();

    // Các trường ghi chú text phục vụ in hóa đơn và KDS bếp
    @Column(name = "toppings", length = 500)
    private String toppings;

    @Column(name = "sweetness", length = 50)
    private String sweetness;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "kds_status", nullable = false, length = 30)
    @Builder.Default
    private ItemKdsStatus kdsStatus = ItemKdsStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.kdsStatus == null) {
            this.kdsStatus = ItemKdsStatus.PENDING;
        }
        if (this.modifierTotal == null) {
            this.modifierTotal = BigDecimal.ZERO;
        }
    }
}
