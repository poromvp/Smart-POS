package com.smartpos.cataloginventory.service.impl;

import com.smartpos.cataloginventory.domain.*;
import com.smartpos.cataloginventory.dto.request.ProductRecipeRequest;
import com.smartpos.cataloginventory.dto.request.RecipeItemRequest;
import com.smartpos.cataloginventory.dto.response.RecipeItemResponse;
import com.smartpos.cataloginventory.dto.response.RecipeResponse;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.repository.IngredientRepository;
import com.smartpos.cataloginventory.repository.ProductRepository;
import com.smartpos.cataloginventory.repository.RecipeRepository;
import com.smartpos.cataloginventory.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeServiceImpl implements RecipeService {
    private final RecipeRepository recipeRepository;
    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;

    @Override
    @Transactional
    public RecipeResponse setProductRecipe(Long productId, ProductRecipeRequest request) {
        Product product = findProductDetailOrThrow(productId);

        if (request.getVariantId() != null && request.getModifierOptionId() != null) {
            throw new InvalidOperationException("Chỉ được chọn một trong hai: variantId hoặc modifierOptionId");
        }

        Map<Long, Ingredient> ingredients = loadIngredients(request.getItems());

        if (request.getVariantId() != null) {
            ProductVariant variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(request.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy size ID " + request.getVariantId() + " thuộc món '" + product.getName() + "'"));

            recipeRepository.deleteByVariantId(variant.getId());
            saveItems(request.getItems(), ingredients, recipe -> recipe.setVariant(variant));

        } else if (request.getModifierOptionId() != null) {
            ModifierOption option = product.getModifierGroups().stream()
                    .flatMap(group -> group.getOptions().stream())
                    .filter(o -> o.getId().equals(request.getModifierOptionId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy tùy chọn ID " + request.getModifierOptionId()
                                    + " trong các nhóm tùy chọn của món '" + product.getName() + "'"));

            recipeRepository.deleteByModifierOptionId(option.getId());
            saveItems(request.getItems(), ingredients, recipe -> recipe.setModifierOption(option));

        } else {
            recipeRepository.deleteByProductId(product.getId());
            saveItems(request.getItems(), ingredients, recipe -> recipe.setProduct(product));
        }

        return buildResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public RecipeResponse getProductRecipe(Long productId) {
        return buildResponse(findProductDetailOrThrow(productId));
    }

    private void saveItems(List<RecipeItemRequest> items,
                           Map<Long, Ingredient> ingredients,
                           Consumer<Recipe> targetSetter) {
        List<Recipe> recipes = items.stream()
                .map(item -> {
                    Recipe recipe = new Recipe();
                    recipe.setIngredient(ingredients.get(item.getIngredientId()));
                    recipe.setQuantityNeeded(item.getQuantityNeeded());
                    targetSetter.accept(recipe); // chỉ set đúng một khóa đích
                    return recipe;
                })
                .toList();
        recipeRepository.saveAll(recipes);
    }

    private Map<Long, Ingredient> loadIngredients(List<RecipeItemRequest> items) {
        List<Long> ids = items.stream().map(RecipeItemRequest::getIngredientId).toList();

        if (new HashSet<>(ids).size() != ids.size()) {
            throw new InvalidOperationException("Danh sách định lượng có nguyên liệu bị trùng lặp");
        }

        Map<Long, Ingredient> ingredients = ingredientRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        List<Long> missing = ids.stream().filter(id -> !ingredients.containsKey(id)).toList();
        if (!missing.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy nguyên liệu với ID: " + missing);
        }
        return ingredients;
    }

    private RecipeResponse buildResponse(Product product) {
        Long productId = product.getId();

        List<RecipeItemResponse> baseItems =
                toItems(recipeRepository.findByProductIdWithIngredient(productId));

        Map<Long, List<RecipeItemResponse>> itemsByVariant =
                recipeRepository.findByVariantProductIdWithIngredient(productId).stream()
                        .collect(Collectors.groupingBy(
                                r -> r.getVariant().getId(),
                                Collectors.collectingAndThen(Collectors.toList(), this::toItems)));

        List<ModifierGroup> groups = product.getModifierGroups().stream()
                .sorted(Comparator.comparing(ModifierGroup::getId))
                .toList();

        List<Long> optionIds = groups.stream()
                .flatMap(g -> g.getOptions().stream())
                .map(ModifierOption::getId)
                .toList();

        Map<Long, List<RecipeItemResponse>> itemsByOption = optionIds.isEmpty()
                ? Map.of()
                : recipeRepository.findByModifierOptionIdInWithIngredient(optionIds).stream()
                        .collect(Collectors.groupingBy(
                                r -> r.getModifierOption().getId(),
                                Collectors.collectingAndThen(Collectors.toList(), this::toItems)));

        List<RecipeResponse.VariantRecipe> variants = product.getVariants().stream()
                .sorted(Comparator.comparing(ProductVariant::getId))
                .map(v -> RecipeResponse.VariantRecipe.builder()
                        .variantId(v.getId())
                        .sizeName(v.getSizeName())
                        .items(itemsByVariant.getOrDefault(v.getId(), List.of()))
                        .build())
                .toList();

        List<RecipeResponse.ModifierOptionRecipe> modifierOptions = groups.stream()
                .flatMap(g -> g.getOptions().stream()
                        .sorted(Comparator.comparing(ModifierOption::getId))
                        .map(o -> RecipeResponse.ModifierOptionRecipe.builder()
                                .modifierOptionId(o.getId())
                                .optionName(o.getName())
                                .groupId(g.getId())
                                .groupName(g.getName())
                                .items(itemsByOption.getOrDefault(o.getId(), List.of()))
                                .build()))
                .toList();

        return RecipeResponse.builder()
                .productId(productId)
                .productName(product.getName())
                .baseItems(baseItems)
                .variants(variants)
                .modifierOptions(modifierOptions)
                .build();
    }

    private List<RecipeItemResponse> toItems(List<Recipe> recipes) {
        return recipes.stream()
                .sorted(Comparator.comparing(Recipe::getId))
                .map(r -> {
                    Ingredient i = r.getIngredient();
                    return RecipeItemResponse.builder()
                            .ingredientId(i.getId())
                            .ingredientName(i.getName())
                            .ingredientCode(i.getCode())
                            .unit(i.getUnit())
                            .quantityNeeded(r.getQuantityNeeded())
                            .build();
                })
                .toList();
    }

    private Product findProductDetailOrThrow(Long productId) {
        return productRepository.findDetailById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món với ID: " + productId));
    }
}
