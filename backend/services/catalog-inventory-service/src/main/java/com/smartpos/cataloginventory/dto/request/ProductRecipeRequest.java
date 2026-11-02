package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProductRecipeRequest {
    // Cả hai null = công thức gốc của món. Không được truyền đồng thời cả hai.
    private Long variantId;
    private Long modifierOptionId;

    // Danh sách rỗng [] = xóa công thức của đích này
    @NotNull(message = "Danh sách định lượng không được null (dùng [] để xóa công thức)")
    @Valid
    private List<RecipeItemRequest> items;
}
