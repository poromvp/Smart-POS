package com.smartpos.sales_service.dto.request;

import com.smartpos.sales_service.entity.PaymentMethod;
import com.smartpos.sales_service.entity.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePaymentRequest {

    @NotNull(message = "Trạng thái thanh toán không được để trống")
    private PaymentStatus paymentStatus;

    private PaymentMethod paymentMethod;
}
