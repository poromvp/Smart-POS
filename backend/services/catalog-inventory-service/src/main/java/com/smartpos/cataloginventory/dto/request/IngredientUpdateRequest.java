package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class IngredientUpdateRequest {
    @NotBlank(message = "Tên nguyên liệu không được để trống")
    @Size(max = 150, message = "Tên nguyên liệu tối đa 150 ký tự")
    private String name;

    // null = giữ nguyên; chuỗi rỗng = xóa mã
    @Size(max = 50, message = "Mã nguyên liệu tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Size(max = 20, message = "Đơn vị tính tối đa 20 ký tự")
    private String unit;

    // null = giữ nguyên
    @PositiveOrZero(message = "Ngưỡng cảnh báo không được âm")
    @Digits(integer = 9, fraction = 3, message = "Ngưỡng cảnh báo tối đa 9 chữ số nguyên và 3 chữ số thập phân")
    private BigDecimal minThreshold;

    // null = giữ nguyên
    @PositiveOrZero(message = "Giá vốn không được âm")
    @Digits(integer = 10, fraction = 2, message = "Giá vốn tối đa 10 chữ số nguyên và 2 chữ số thập phân")
    private BigDecimal costPerUnit;
}
