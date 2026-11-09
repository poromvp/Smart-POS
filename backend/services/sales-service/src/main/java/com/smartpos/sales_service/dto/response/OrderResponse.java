package com.smartpos.sales_service.dto.response;

import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.entity.OrderType;
import com.smartpos.sales_service.entity.PaymentMethod;
import com.smartpos.sales_service.entity.PaymentStatus;
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
public class OrderResponse {
    private Long id;
    private String orderCode;
    private Long tableId;
    private String tableNumber;
    private Long staffId;
    private OrderType orderType;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;

    private Long customerId;
    private String customerName;
    private String customerPhone;

    private Long promotionId;
    private String promotionCode;
    private String promotionName;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal pointsDiscountAmount;
    private BigDecimal totalAmount;

    private String note;
    private String cancelReason;
    private String cancelledBy;
    private Long version;

    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
