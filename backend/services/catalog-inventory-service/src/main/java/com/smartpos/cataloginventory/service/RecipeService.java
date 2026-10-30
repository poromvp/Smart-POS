package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.request.ProductRecipeRequest;
import com.smartpos.cataloginventory.dto.response.RecipeResponse;

public interface RecipeService {
    RecipeResponse setProductRecipe(Long productId, ProductRecipeRequest request);
    RecipeResponse getProductRecipe(Long productId);
}
