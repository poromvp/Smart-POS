package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.dto.request.ProductRecipeRequest;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.RecipeResponse;
import com.smartpos.cataloginventory.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {
    private final RecipeService recipeService;

    @PostMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<RecipeResponse>> setProductRecipe(
            @PathVariable Long productId,
            @Valid @RequestBody ProductRecipeRequest request) {
        RecipeResponse response = recipeService.setProductRecipe(productId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật công thức thành công"));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<RecipeResponse>> getProductRecipe(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.getProductRecipe(productId)));
    }
}
