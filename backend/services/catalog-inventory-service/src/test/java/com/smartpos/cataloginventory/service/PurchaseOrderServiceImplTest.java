package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.domain.*;
import com.smartpos.cataloginventory.dto.response.PurchaseOrderResponse;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.mapper.PurchaseOrderMapper;
import com.smartpos.cataloginventory.repository.IngredientRepository;
import com.smartpos.cataloginventory.repository.InventoryTransactionRepository;
import com.smartpos.cataloginventory.repository.PurchaseOrderRepository;
import com.smartpos.cataloginventory.repository.SupplierRepository;
import com.smartpos.cataloginventory.service.impl.PurchaseOrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderServiceImplTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private PurchaseOrderMapper purchaseOrderMapper;

    @InjectMocks
    private PurchaseOrderServiceImpl purchaseOrderService;

    private PurchaseOrder samplePo;
    private Ingredient sampleIngredient;
    private PurchaseOrderItem sampleItem;

    @BeforeEach
    void setUp() {
        Supplier supplier = Supplier.builder()
                .id(1L)
                .name("Công ty Thực phẩm Sạch")
                .isActive(true)
                .build();

        sampleIngredient = Ingredient.builder()
                .id(10L)
                .name("Thịt Heo")
                .unit("kg")
                .currentStock(new BigDecimal("10.00")) // Tồn cũ 10kg
                .costPerUnit(new BigDecimal("100000")) // Giá vốn cũ 100k
                .build();

        samplePo = PurchaseOrder.builder()
                .id(100L)
                .poNumber("PO-20261105-01")
                .supplier(supplier)
                .status(PurchaseOrderStatus.DRAFT)
                .orderDate(LocalDate.now())
                .items(new ArrayList<>())
                .build();

        sampleItem = PurchaseOrderItem.builder()
                .id(1L)
                .purchaseOrder(samplePo)
                .ingredient(sampleIngredient)
                .quantity(new BigDecimal("10.00")) // Nhập thêm 10kg
                .unitPrice(new BigDecimal("120000")) // Giá nhập mới 120k
                .totalPrice(new BigDecimal("1200000"))
                .build();

        samplePo.getItems().add(sampleItem);
    }

    @Test
    @DisplayName("Hoàn tất phiếu nhập kho: tăng số lượng tồn và cập nhật giá vốn bình quân gia quyền")
    void testCompletePurchaseOrder_IncreasesStockAndUpdatesCost_Success() {
        when(purchaseOrderRepository.findWithDetailsByIdWithLock(100L)).thenReturn(Optional.of(samplePo));
        when(ingredientRepository.findAllByIdWithLock(List.of(10L))).thenReturn(List.of(sampleIngredient));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrderResponse resDto = PurchaseOrderResponse.builder()
                .id(100L)
                .poNumber("PO-20261105-01")
                .status(PurchaseOrderStatus.COMPLETED)
                .build();
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class))).thenReturn(resDto);

        PurchaseOrderResponse result = purchaseOrderService.completePurchaseOrder(100L);

        assertThat(result).isNotNull();
        assertThat(samplePo.getStatus()).isEqualTo(PurchaseOrderStatus.COMPLETED);

        // Kiểm tra tồn kho tăng: 10 + 10 = 20kg
        assertThat(sampleIngredient.getCurrentStock()).isEqualByComparingTo("20.00");

        // Kiểm tra giá vốn bình quân: (10 * 100k + 10 * 120k) / 20 = 110.000đ
        assertThat(sampleIngredient.getCostPerUnit()).isEqualByComparingTo("110000.00");

        // Xác nhận có ghi thẻ kho loại IMPORT
        verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("Hoàn tất phiếu nhập thất bại khi phiếu đã COMPLETED trước đó")
    void testCompletePurchaseOrder_AlreadyCompleted_ThrowsException() {
        samplePo.setStatus(PurchaseOrderStatus.COMPLETED);
        when(purchaseOrderRepository.findWithDetailsByIdWithLock(100L)).thenReturn(Optional.of(samplePo));

        assertThatThrownBy(() -> purchaseOrderService.completePurchaseOrder(100L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("đã được hoàn tất trước đó");

        verify(inventoryTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Hoàn tất phiếu nhập thất bại khi phiếu đã bị CANCELLED")
    void testCompletePurchaseOrder_CancelledOrder_ThrowsException() {
        samplePo.setStatus(PurchaseOrderStatus.CANCELLED);
        when(purchaseOrderRepository.findWithDetailsByIdWithLock(100L)).thenReturn(Optional.of(samplePo));

        assertThatThrownBy(() -> purchaseOrderService.completePurchaseOrder(100L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("đã bị hủy, không thể nhập kho");
    }

    @Test
    @DisplayName("Hủy phiếu nhập ở trạng thái DRAFT thành công và không ảnh hưởng đến kho")
    void testCancelPurchaseOrder_DraftStatus_Success() {
        when(purchaseOrderRepository.findWithDetailsByIdWithLock(100L)).thenReturn(Optional.of(samplePo));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrderResponse resDto = PurchaseOrderResponse.builder()
                .id(100L)
                .status(PurchaseOrderStatus.CANCELLED)
                .build();
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class))).thenReturn(resDto);

        purchaseOrderService.cancelPurchaseOrder(100L);

        assertThat(samplePo.getStatus()).isEqualTo(PurchaseOrderStatus.CANCELLED);
        assertThat(sampleIngredient.getCurrentStock()).isEqualByComparingTo("10.00"); // Kho nguyên vẹn
        verify(inventoryTransactionRepository, never()).save(any());
    }
}
