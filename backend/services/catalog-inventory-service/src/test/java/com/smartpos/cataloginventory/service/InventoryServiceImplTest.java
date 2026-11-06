package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.domain.*;
import com.smartpos.cataloginventory.dto.request.DeductInventoryRequest;
import com.smartpos.cataloginventory.dto.request.DeductItemRequest;
import com.smartpos.cataloginventory.dto.request.InventoryAdjustmentRequest;
import com.smartpos.cataloginventory.dto.response.DeductInventoryResponse;
import com.smartpos.cataloginventory.dto.response.InventoryAdjustmentResponse;
import com.smartpos.cataloginventory.exception.DuplicateResourceException;
import com.smartpos.cataloginventory.exception.InsufficientStockException;
import com.smartpos.cataloginventory.repository.*;
import com.smartpos.cataloginventory.service.impl.InventoryServiceImpl;
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
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private ModifierOptionRepository modifierOptionRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private Ingredient beefIngredient;
    private Ingredient noodleIngredient;
    private Product productMiCay;
    private Recipe recipeBeef;
    private Recipe recipeNoodle;

    @BeforeEach
    void setUp() {
        beefIngredient = Ingredient.builder()
                .id(1L)
                .code("ING-BEEF")
                .name("Thịt bò Mỹ")
                .unit("kg")
                .currentStock(new BigDecimal("5.00"))
                .build();

        noodleIngredient = Ingredient.builder()
                .id(2L)
                .code("ING-NOODLE")
                .name("Mì Koreno")
                .unit("gói")
                .currentStock(new BigDecimal("20.00"))
                .build();

        productMiCay = Product.builder()
                .id(101L)
                .name("Mì Cay Bò")
                .variants(new HashSet<>())
                .modifierGroups(new HashSet<>())
                .build();

        recipeBeef = Recipe.builder()
                .id(1L)
                .product(productMiCay)
                .ingredient(beefIngredient)
                .quantityNeeded(new BigDecimal("0.20")) // 200g
                .build();

        recipeNoodle = Recipe.builder()
                .id(2L)
                .product(productMiCay)
                .ingredient(noodleIngredient)
                .quantityNeeded(new BigDecimal("1.00")) // 1 gói
                .build();
    }

    @Test
    @DisplayName("Trừ kho thành công khi tồn kho đủ đáp ứng số lượng trong đơn")
    void testDeductInventory_SufficientStock_Success() {
        DeductItemRequest item = new DeductItemRequest();
        item.setProductId(101L);
        item.setQuantity(2);
        item.setModifierOptionIds(Collections.emptySet());

        DeductInventoryRequest request = new DeductInventoryRequest();
        request.setOrderCode("ORD-20261105-001");
        request.setItems(List.of(item));

        when(productRepository.findAllWithModifiersById(anyCollection()))
                .thenReturn(List.of(productMiCay));
        when(recipeRepository.findApplicableRecipes(any(), any(), any()))
                .thenReturn(List.of(recipeBeef, recipeNoodle));
        when(ingredientRepository.findAllByIdWithLock(anyCollection()))
                .thenReturn(List.of(beefIngredient, noodleIngredient));
        when(inventoryTransactionRepository.existsByOrderCodeAndTransactionType(
                "ORD-20261105-001", InventoryTransactionType.SALE_DEDUCT)).thenReturn(false);

        DeductInventoryResponse response = inventoryService.deductInventory(request);

        assertThat(response).isNotNull();
        assertThat(response.getOrderCode()).isEqualTo("ORD-20261105-001");
        assertThat(response.getDeductions()).hasSize(2);

        // Kiểm tra tồn kho sau trừ
        assertThat(beefIngredient.getCurrentStock()).isEqualByComparingTo("4.60"); // 5.0 - 0.4
        assertThat(noodleIngredient.getCurrentStock()).isEqualByComparingTo("18.00"); // 20 - 2

        verify(inventoryTransactionRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("Trừ kho thất bại khi tồn kho không đủ (ném InsufficientStockException)")
    void testDeductInventory_InsufficientStock_ThrowsException() {
        beefIngredient.setCurrentStock(new BigDecimal("0.10")); // Chỉ còn 0.1kg trong khi cần 0.4kg

        DeductItemRequest item = new DeductItemRequest();
        item.setProductId(101L);
        item.setQuantity(2);
        item.setModifierOptionIds(Collections.emptySet());

        DeductInventoryRequest request = new DeductInventoryRequest();
        request.setOrderCode("ORD-20261105-002");
        request.setItems(List.of(item));

        when(productRepository.findAllWithModifiersById(anyCollection()))
                .thenReturn(List.of(productMiCay));
        when(recipeRepository.findApplicableRecipes(any(), any(), any()))
                .thenReturn(List.of(recipeBeef, recipeNoodle));
        when(ingredientRepository.findAllByIdWithLock(anyCollection()))
                .thenReturn(List.of(beefIngredient, noodleIngredient));
        when(inventoryTransactionRepository.existsByOrderCodeAndTransactionType(
                "ORD-20261105-002", InventoryTransactionType.SALE_DEDUCT)).thenReturn(false);

        assertThatThrownBy(() -> inventoryService.deductInventory(request))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Thịt bò Mỹ");

        verify(inventoryTransactionRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Trừ kho thất bại khi đơn hàng đã từng được trừ kho trước đó (chống trùng lặp)")
    void testDeductInventory_DuplicateOrderCode_ThrowsException() {
        DeductItemRequest item = new DeductItemRequest();
        item.setProductId(101L);
        item.setQuantity(1);
        item.setModifierOptionIds(Collections.emptySet());

        DeductInventoryRequest request = new DeductInventoryRequest();
        request.setOrderCode("ORD-ALREADY-DEDUCTED");
        request.setItems(List.of(item));

        when(productRepository.findAllWithModifiersById(anyCollection()))
                .thenReturn(List.of(productMiCay));
        when(recipeRepository.findApplicableRecipes(any(), any(), any()))
                .thenReturn(List.of(recipeBeef, recipeNoodle));
        when(ingredientRepository.findAllByIdWithLock(anyCollection()))
                .thenReturn(List.of(beefIngredient, noodleIngredient));
        when(inventoryTransactionRepository.existsByOrderCodeAndTransactionType(
                "ORD-ALREADY-DEDUCTED", InventoryTransactionType.SALE_DEDUCT)).thenReturn(true);

        assertThatThrownBy(() -> inventoryService.deductInventory(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("đã được trừ kho trước đó");
    }

    @Test
    @DisplayName("Món không có định lượng công thức sẽ bỏ qua bước trừ kho an toàn")
    void testDeductInventory_ProductWithoutRecipe_SkipsDeduct() {
        DeductItemRequest item = new DeductItemRequest();
        item.setProductId(999L);
        item.setQuantity(1);
        item.setModifierOptionIds(Collections.emptySet());

        DeductInventoryRequest request = new DeductInventoryRequest();
        request.setOrderCode("ORD-NO-RECIPE");
        request.setItems(List.of(item));

        when(productRepository.findAllWithModifiersById(anyCollection()))
                .thenReturn(List.of(Product.builder().id(999L).name("Khăn lạnh").variants(new HashSet<>()).modifierGroups(new HashSet<>()).build()));
        when(recipeRepository.findApplicableRecipes(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        DeductInventoryResponse response = inventoryService.deductInventory(request);

        assertThat(response).isNotNull();
        assertThat(response.getDeductions()).isEmpty();
        verify(ingredientRepository, never()).findAllByIdWithLock(anyCollection());
    }

    @Test
    @DisplayName("Điều chỉnh tồn kho loại xuất hủy hỏng hóc (SPOILAGE) thành công")
    void testAdjustInventory_Spoilage_Success() {
        when(ingredientRepository.findByIdWithLock(1L)).thenReturn(Optional.of(beefIngredient));
        when(inventoryTransactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> {
            InventoryTransaction t = i.getArgument(0);
            t.setId(10L);
            return t;
        });

        InventoryAdjustmentRequest req = new InventoryAdjustmentRequest();
        req.setIngredientId(1L);
        req.setType(InventoryTransactionType.SPOILAGE);
        req.setQuantity(new BigDecimal("1.00")); // Hủy 1kg
        req.setReason("Thịt quá hạn");

        InventoryAdjustmentResponse res = inventoryService.adjustInventory(req);

        assertThat(res).isNotNull();
        assertThat(beefIngredient.getCurrentStock()).isEqualByComparingTo("4.00");
        verify(ingredientRepository).save(beefIngredient);
        verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("Điều chỉnh tồn kho kiểm kê thực tế (AUDIT_ADJUST) thành công")
    void testAdjustInventory_AuditAdjust_Success() {
        when(ingredientRepository.findByIdWithLock(1L)).thenReturn(Optional.of(beefIngredient));
        when(inventoryTransactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> {
            InventoryTransaction t = i.getArgument(0);
            t.setId(11L);
            return t;
        });

        InventoryAdjustmentRequest req = new InventoryAdjustmentRequest();
        req.setIngredientId(1L);
        req.setType(InventoryTransactionType.AUDIT_ADJUST);
        req.setActualStock(new BigDecimal("6.50")); // Đếm thực tế là 6.5kg
        req.setReason("Kiểm kê cuối tháng");

        InventoryAdjustmentResponse res = inventoryService.adjustInventory(req);

        assertThat(res).isNotNull();
        assertThat(beefIngredient.getCurrentStock()).isEqualByComparingTo("6.50");
        verify(ingredientRepository).save(beefIngredient);
    }
}
