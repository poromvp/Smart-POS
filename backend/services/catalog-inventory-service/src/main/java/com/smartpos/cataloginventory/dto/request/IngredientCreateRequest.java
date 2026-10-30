package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class IngredientCreateRequest {
    @NotBlank(message = "Tên nguyên liệu không được để trống")
    @Size(max = 150, message = "Tên nguyên liệu tối đa 150 ký tự")
    private String name;

    @Size(max = 50, message = "Mã nguyên liệu tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Size(max = 20, message = "Đơn vị tính tối đa 20 ký tự")
    private String unit;

    @NotNull(message = "Tồn kho ban đầu không được để trống")
    @PositiveOrZero(message = "Tồn kho không được âm")
    @Digits(integer = 9, fraction = 3, message = "Tồn kho tối đa 9 chữ số nguyên và 3 chữ số thập phân")
    private BigDecimal currentStock = BigDecimal.ZERO;

    @NotNull(message = "Ngưỡng cảnh báo không được để trống")
    @PositiveOrZero(message = "Ngưỡng cảnh báo không được âm")
    @Digits(integer = 9, fraction = 3, message = "Ngưỡng cảnh báo tối đa 9 chữ số nguyên và 3 chữ số thập phân")
    private BigDecimal minThreshold = BigDecimal.ZERO;

    @NotNull(message = "Giá vốn không được để trống")
    @PositiveOrZero(message = "Giá vốn không được âm")
    @Digits(integer = 10, fraction = 2, message = "Giá vốn tối đa 10 chữ số nguyên và 2 chữ số thập phân")
    private BigDecimal costPerUnit = BigDecimal.ZERO;
}
