package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.domain.Category;
import com.smartpos.cataloginventory.domain.Product;
import com.smartpos.cataloginventory.dto.request.ProductCreateRequest;
import com.smartpos.cataloginventory.dto.response.ProductDetailResponse;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.mapper.ProductMapper;
import com.smartpos.cataloginventory.repository.*;
import com.smartpos.cataloginventory.service.impl.ProductServiceImpl;
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
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ModifierGroupRepository modifierGroupRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product sampleProduct;
    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleCategory = Category.builder()
                .id(1L)
                .name("Đồ uống")
                .isActive(true)
                .build();

        sampleProduct = Product.builder()
                .id(10L)
                .code("PRD-CAFE")
                .name("Cà phê sữa đá")
                .category(sampleCategory)
                .basePrice(new BigDecimal("29000"))
                .isActive(true)
                .variants(new HashSet<>())
                .modifierGroups(new HashSet<>())
                .build();
    }

    @Test
    @DisplayName("Tạo món ăn mới thành công với danh mục hợp lệ")
    void testCreateProduct_Success() {
        ProductCreateRequest request = new ProductCreateRequest();
        request.setCode("PRD-CAFE");
        request.setName("Cà phê sữa đá");
        request.setCategoryId(1L);
        request.setBasePrice(new BigDecimal("29000"));

        ProductDetailResponse responseDto = ProductDetailResponse.builder()
                .id(10L)
                .code("PRD-CAFE")
                .name("Cà phê sữa đá")
                .build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.existsByNameIgnoreCase("Cà phê sữa đá")).thenReturn(false);
        when(productRepository.existsByCodeIgnoreCase("PRD-CAFE")).thenReturn(false);
        when(productMapper.toEntity(request)).thenReturn(sampleProduct);
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
        when(productMapper.toDetailResponse(sampleProduct)).thenReturn(responseDto);

        ProductDetailResponse result = productService.createProduct(request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("Cà phê sữa đá");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("Tạo món ăn thất bại khi không tìm thấy danh mục (categoryId)")
    void testCreateProduct_CategoryNotFound_ThrowsException() {
        ProductCreateRequest request = new ProductCreateRequest();
        request.setCode("PRD-CAFE");
        request.setName("Cà phê sữa đá");
        request.setCategoryId(999L);

        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy danh mục");

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("Chuyển đổi trạng thái khả dụng của món ăn thành công")
    void testToggleProductStatus_Success() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));

        productService.toggleProductStatus(10L, false);

        assertThat(sampleProduct.getIsActive()).isFalse();
    }

    @Test
    @DisplayName("Xóa món ăn thất bại khi món đang có công thức định lượng (chống xóa nhầm)")
    void testDeleteProduct_ProductWithRecipe_ThrowsInvalidOperationException() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(recipeRepository.existsByProductId(10L)).thenReturn(true);

        assertThatThrownBy(() -> productService.deleteProduct(10L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Không thể xóa món ăn đang có công thức");

        verify(productRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Xóa món ăn thành công khi không có ràng buộc công thức")
    void testDeleteProduct_WithoutRecipe_Success() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(recipeRepository.existsByProductId(10L)).thenReturn(false);
        when(recipeRepository.existsByVariantProductId(10L)).thenReturn(false);

        productService.deleteProduct(10L);

        verify(productRepository).delete(sampleProduct);
    }
}
