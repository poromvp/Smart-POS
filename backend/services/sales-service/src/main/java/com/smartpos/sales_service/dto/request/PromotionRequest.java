package com.smartpos.sales_service.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRequest {
    @NotBlank(message = "Mã khuyến mãi không được để trống")
    private String code;

    @NotBlank(message = "Tên khuyến mãi không được để trống")
    private String name;

    @NotNull(message = "Phần trăm giảm giá không được để trống")
    @DecimalMin(value = "0.01", message = "Phần trăm giảm giá tối thiểu 0.01%")
    @DecimalMax(value = "100.00", message = "Phần trăm giảm giá tối đa 100%")
    private BigDecimal discountPercent;

    private BigDecimal maxDiscountAmount;

    private BigDecimal minOrderAmount;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDateTime endDate;

    private Integer usageLimit;

    @Builder.Default
    private Boolean isActive = true;
}
