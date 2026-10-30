package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RecipeItemRequest {
    @NotNull(message = "ingredientId không được để trống")
    private Long ingredientId;

    @NotNull(message = "Định lượng không được để trống")
    @Positive(message = "Định lượng phải lớn hơn 0")
    @Digits(integer = 9, fraction = 3, message = "Định lượng tối đa 9 chữ số nguyên và 3 chữ số thập phân")
    private BigDecimal quantityNeeded;
}
