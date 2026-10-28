package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductVariantRequest {
    private Long id; // null khi thêm mới, có giá trị khi sửa

    @NotBlank(message = "Tên size không được để trống (ví dụ: Size S, M, L)")
    @Size(max = 50, message = "Tên size tối đa 50 ký tự")
    private String sizeName;

    @NotNull(message = "Mức điều chỉnh giá không được để trống")
    @DecimalMin(value = "0.0", message = "Mức điều chỉnh giá không được âm")
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Size(max = 50, message = "Mã SKU tối đa 50 ký tự")
    private String sku;
}
