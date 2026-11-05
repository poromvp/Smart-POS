package com.smartpos.sales_service.dto.request;

import com.smartpos.sales_service.entity.OrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    private String tableNumber;

    @Builder.Default
    private OrderType orderType = OrderType.DINE_IN;

    private String note;

    private Long customerId;
    private String customerPhone;
    private String promotionCode;
    private Integer pointsToRedeem;

    @NotEmpty(message = "Danh sách món ăn không được để trống")
    @Valid
    private List<CreateOrderItemRequest> items;
}
