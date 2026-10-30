package com.smartpos.cataloginventory.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class RecipeResponse {
    private Long productId;
    private String productName;

    // Công thức gốc, áp dụng cho mọi size
    private List<RecipeItemResponse> baseItems;

    // Công thức cộng thêm theo từng size (liệt kê tất cả size, chưa cấu hình = items rỗng)
    private List<VariantRecipe> variants;

    // Công thức cộng thêm theo từng topping/tùy chọn của các nhóm gắn với món
    private List<ModifierOptionRecipe> modifierOptions;

    @Getter
    @Setter
    @Builder
    public static class VariantRecipe {
        private Long variantId;
        private String sizeName;
        private List<RecipeItemResponse> items;
    }

    @Getter
    @Setter
    @Builder
    public static class ModifierOptionRecipe {
        private Long modifierOptionId;
        private String optionName;
        private Long groupId;
        private String groupName;
        private List<RecipeItemResponse> items;
    }
}
