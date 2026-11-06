package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.domain.Ingredient;
import com.smartpos.cataloginventory.domain.Product;
import com.smartpos.cataloginventory.domain.ProductVariant;
import com.smartpos.cataloginventory.domain.Recipe;
import com.smartpos.cataloginventory.dto.request.ProductRecipeRequest;
import com.smartpos.cataloginventory.dto.request.RecipeItemRequest;
import com.smartpos.cataloginventory.dto.response.RecipeResponse;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.repository.IngredientRepository;
import com.smartpos.cataloginventory.repository.ProductRepository;
import com.smartpos.cataloginventory.repository.RecipeRepository;
import com.smartpos.cataloginventory.service.impl.RecipeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecipeServiceImplTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @InjectMocks
    private RecipeServiceImpl recipeService;

    private Product sampleProduct;
    private Ingredient sampleIngredient;
    private ProductVariant sampleVariant;

    @BeforeEach
    void setUp() {
        sampleIngredient = Ingredient.builder()
                .id(1L)
                .code("ING-MILK")
                .name("Sữa tươi")
                .unit("ml")
                .build();

        sampleVariant = ProductVariant.builder()
                .id(10L)
                .sizeName("Size L")
                .build();

        sampleProduct = Product.builder()
                .id(100L)
                .name("Trà Sữa Trân Châu")
                .variants(new HashSet<>(List.of(sampleVariant)))
                .modifierGroups(new HashSet<>())
                .build();
        sampleVariant.setProduct(sampleProduct);
    }

    @Test
    @DisplayName("Lấy danh sách công thức của món ăn theo productId thành công")
    void testGetProductRecipe_Success() {
        Recipe recipe = Recipe.builder()
                .id(1L)
                .product(sampleProduct)
                .ingredient(sampleIngredient)
                .quantityNeeded(new BigDecimal("150.00"))
                .build();

        when(productRepository.findDetailById(100L)).thenReturn(Optional.of(sampleProduct));
        when(recipeRepository.findByProductIdWithIngredient(100L)).thenReturn(List.of(recipe));

        RecipeResponse response = recipeService.getProductRecipe(100L);

        assertThat(response).isNotNull();
        assertThat(response.getProductId()).isEqualTo(100L);
        assertThat(response.getBaseItems()).hasSize(1);
        assertThat(response.getBaseItems().get(0).getIngredientName()).isEqualTo("Sữa tươi");
    }

    @Test
    @DisplayName("Lấy công thức thất bại khi không tìm thấy món ăn")
    void testGetProductRecipe_ProductNotFound_ThrowsException() {
        when(productRepository.findDetailById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recipeService.getProductRecipe(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy món");
    }

    @Test
    @DisplayName("Cập nhật công thức cho món gốc thành công")
    void testSetProductRecipe_BaseProduct_Success() {
        when(productRepository.findDetailById(100L)).thenReturn(Optional.of(sampleProduct));
        when(ingredientRepository.findAllById(List.of(1L))).thenReturn(List.of(sampleIngredient));
        when(recipeRepository.findByProductIdWithIngredient(100L)).thenReturn(Collections.emptyList());

        RecipeItemRequest item = new RecipeItemRequest();
        item.setIngredientId(1L);
        item.setQuantityNeeded(new BigDecimal("200.00"));

        ProductRecipeRequest request = new ProductRecipeRequest();
        request.setItems(List.of(item));

        RecipeResponse response = recipeService.setProductRecipe(100L, request);

        assertThat(response).isNotNull();
        verify(recipeRepository).deleteByProductId(100L);
        verify(recipeRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("Cập nhật công thức thất bại khi có nguyên liệu bị trùng lặp trong danh sách")
    void testSetProductRecipe_DuplicateIngredients_ThrowsException() {
        when(productRepository.findDetailById(100L)).thenReturn(Optional.of(sampleProduct));

        RecipeItemRequest item1 = new RecipeItemRequest();
        item1.setIngredientId(1L);
        item1.setQuantityNeeded(new BigDecimal("100.00"));

        RecipeItemRequest item2 = new RecipeItemRequest();
        item2.setIngredientId(1L); // Trùng ID nguyên liệu
        item2.setQuantityNeeded(new BigDecimal("50.00"));

        ProductRecipeRequest request = new ProductRecipeRequest();
        request.setItems(List.of(item1, item2));

        assertThatThrownBy(() -> recipeService.setProductRecipe(100L, request))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("bị trùng lặp");

        verify(recipeRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Cập nhật công thức thất bại khi chọn đồng thời variantId và modifierOptionId")
    void testSetProductRecipe_BothVariantAndModifier_ThrowsException() {
        when(productRepository.findDetailById(100L)).thenReturn(Optional.of(sampleProduct));

        RecipeItemRequest item = new RecipeItemRequest();
        item.setIngredientId(1L);
        item.setQuantityNeeded(BigDecimal.TEN);

        ProductRecipeRequest request = new ProductRecipeRequest();
        request.setVariantId(10L);
        request.setModifierOptionId(20L);
        request.setItems(List.of(item));

        assertThatThrownBy(() -> recipeService.setProductRecipe(100L, request))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Chỉ được chọn một trong hai");
    }
}
