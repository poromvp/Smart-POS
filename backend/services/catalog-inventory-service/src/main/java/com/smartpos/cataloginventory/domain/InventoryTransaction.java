package com.smartpos.cataloginventory.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions",
       indexes = @Index(name = "idx_inventory_tx_order_code", columnList = "order_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class InventoryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    // ID món từ Order Service khi bán (gây trừ kho tự động)
    @Column(name = "order_item_id")
    private Long orderItemId;

    // Mã đơn hàng gây ra biến động (dùng để chống trừ kho trùng)
    @Column(name = "order_code", length = 50)
    private String orderCode;

    // Dòng phiếu nhập gây tăng kho (nếu có)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_item_id")
    private PurchaseOrderItem purchaseOrderItem;

    // Số lượng biến động (+ khi nhập, - khi xuất bán/hỏng hóc)
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private InventoryTransactionType transactionType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
