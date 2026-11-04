package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ModifierOptionRequest {
    private Long id; // Để null khi tạo mới, truyền id khi cập nhật

    @NotBlank(message = "Tên tùy chọn không được để trống")
    @Size(max = 100, message = "Tên tùy chọn tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Giá phụ thu không được để trống")
    @DecimalMin(value = "0.0", message = "Giá phụ thu không được âm")
    @Digits(integer = 10, fraction = 2, message = "Giá phụ thu tối đa 10 chữ số nguyên và 2 chữ số thập phân")
    private BigDecimal price = BigDecimal.ZERO;
}
