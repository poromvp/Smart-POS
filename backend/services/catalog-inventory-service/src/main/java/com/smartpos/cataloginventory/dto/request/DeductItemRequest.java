package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class DeductItemRequest {
    @NotNull(message = "productId không được để trống")
    private Long productId;

    private Long variantId;

    @NotNull(message = "Danh sách tùy chọn không được null")
    private Set<Long> modifierOptionIds = new HashSet<>();

    public Set<Long> getModifierOptionIds() {
        return modifierOptionIds != null ? modifierOptionIds : Collections.emptySet();
    }

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;
}
