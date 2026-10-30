package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PurchaseOrderItemRequest {
    @NotNull(message = "ingredientId không được để trống")
    private Long ingredientId;

    @NotNull(message = "Số lượng nhập không được để trống")
    @Positive(message = "Số lượng nhập phải lớn hơn 0")
    @Digits(integer = 9, fraction = 3, message = "Số lượng tối đa 9 chữ số nguyên và 3 chữ số thập phân")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá nhập không được để trống")
    @PositiveOrZero(message = "Đơn giá nhập không được âm")
    @Digits(integer = 10, fraction = 2, message = "Đơn giá tối đa 10 chữ số nguyên và 2 chữ số thập phân")
    private BigDecimal unitPrice;

    private LocalDate expiryDate;
}
