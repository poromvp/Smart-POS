package com.smartpos.sales_service.dto.request;

import com.smartpos.sales_service.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutOrderRequest {
    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    private Long customerId;
    private String customerPhone;
    private String promotionCode;
    private Integer pointsToRedeem;
    private Long staffId;
}
