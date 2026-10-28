package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
public class ProductUpdateRequest {
    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotBlank(message = "Tên món ăn không được để trống")
    @Size(max = 150, message = "Tên món ăn tối đa 150 ký tự")
    private String name;

    @Size(max = 50, message = "Mã món ăn tối đa 50 ký tự")
    private String code;

    @NotNull(message = "Giá gốc không được để trống")
    @DecimalMin(value = "0.0", message = "Giá gốc không được âm")
    private BigDecimal basePrice;

    private String imageUrl;
    private String description;
    private Boolean isActive;

    @Valid
    private List<ProductVariantRequest> variants = new ArrayList<>();

    private Set<Long> modifierGroupIds = new HashSet<>();
}
