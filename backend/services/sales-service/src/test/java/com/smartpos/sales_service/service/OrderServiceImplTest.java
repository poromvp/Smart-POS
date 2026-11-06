package com.smartpos.sales_service.service;

import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.client.dto.DeductInventoryRequest;
import com.smartpos.sales_service.client.dto.DeductInventoryResponse;
import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.request.UpdatePaymentRequest;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.*;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.CustomerRepository;
import com.smartpos.sales_service.repository.OrderRepository;
import com.smartpos.sales_service.repository.PointTransactionRepository;
import com.smartpos.sales_service.repository.PromotionRepository;
import com.smartpos.sales_service.service.impl.OrderServiceImpl;
import feign.FeignException;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private PointTransactionRepository pointTransactionRepository;

    @Mock
    private InventoryClient inventoryClient;

    @InjectMocks
    private OrderServiceImpl orderService;

    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        OrderItem item = OrderItem.builder()
                .id(1L)
                .productId(101L)
                .variantId(202L)
                .modifierOptionIds(List.of(301L, 302L))
                .name("Trà Đào Cam Sả")
                .quantity(2)
                .unitPrice(new BigDecimal("35000"))
                .modifierTotal(new BigDecimal("10000"))
                .build();

        sampleOrder = Order.builder()
                .id(1L)
                .orderCode("ORD-20261102-TEST1")
                .tableNumber("T1-01")
                .orderType(OrderType.DINE_IN)
                .status(OrderStatus.PENDING)
                .items(new ArrayList<>(List.of(item)))
                .totalAmount(new BigDecimal("90000"))
                .build();
        item.setOrder(sampleOrder);
    }

    @Test
    @DisplayName("Tạo đơn hàng mới thành công với đầy đủ productId, variantId, modifierOptionIds")
    void testCreateOrder() {
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(101L)
                .variantId(202L)
                .modifierOptionIds(List.of(301L, 302L))
                .name("Trà Đào Cam Sả")
                .quantity(2)
                .basePrice(new BigDecimal("35000"))
                .modifierTotal(new BigDecimal("10000"))
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .tableNumber("T1-01")
                .orderType(OrderType.DINE_IN)
                .items(List.of(itemReq))
                .build();

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(10L);
            return o;
        });

        OrderResponse response = orderService.createOrder(request);

        assertThat(response).isNotNull();
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getProductId()).isEqualTo(101L);
        assertThat(response.getItems().get(0).getVariantId()).isEqualTo(202L);
        assertThat(response.getItems().get(0).getModifierOptionIds()).containsExactly(301L, 302L);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("Tạo đơn hàng áp dụng tích điểm và giảm giá voucher thành công")
    void testCreateOrder_WithPointsAndPromotion_Success() {
        Customer customer = Customer.builder()
                .id(5L)
                .phone("0901234567")
                .currentPoints(10)
                .build();

        Promotion promo = Promotion.builder()
                .id(2L)
                .code("SALE10")
                .name("Giảm 10%")
                .discountPercent(new BigDecimal("10"))
                .maxDiscountAmount(new BigDecimal("20000"))
                .minOrderAmount(new BigDecimal("50000"))
                .isActive(true)
                .startDate(java.time.LocalDateTime.now().minusDays(1))
                .endDate(java.time.LocalDateTime.now().plusDays(5))
                .build();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(101L)
                .name("Cơm gà")
                .quantity(2)
                .basePrice(new BigDecimal("50000"))
                .modifierTotal(BigDecimal.ZERO)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .tableNumber("01")
                .orderType(OrderType.DINE_IN)
                .customerId(5L)
                .promotionCode("SALE10")
                .pointsToRedeem(5)
                .items(List.of(itemReq))
                .build();

        when(customerRepository.findById(5L)).thenReturn(Optional.of(customer));
        when(promotionRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(promo));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrder(request);

        assertThat(response).isNotNull();
        assertThat(response.getSubtotal()).isEqualByComparingTo("100000");
        assertThat(response.getDiscountAmount()).isEqualByComparingTo("10000"); // 10% của 100k
        assertThat(response.getPointsDiscountAmount()).isEqualByComparingTo("5000"); // 5 điểm = 5000đ
        assertThat(response.getTotalAmount()).isEqualByComparingTo("85000"); // 100k - 10k - 5k
    }

    @Test
    @DisplayName("Hoàn tất đơn hàng (completeOrder) gọi thành công sang FeignClient trừ kho")
    void testCompleteOrder_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        ApiResponse<DeductInventoryResponse> deductResponse = ApiResponse.success(
                DeductInventoryResponse.builder().orderCode("ORD-20261102-TEST1").build(),
                "Trừ kho thành công"
        );
        when(inventoryClient.deductInventory(any(DeductInventoryRequest.class))).thenReturn(deductResponse);

        OrderResponse response = orderService.completeOrder(1L);

        assertThat(response.getStatus()).isEqualTo(OrderStatus.COMPLETED);

        ArgumentCaptor<DeductInventoryRequest> captor = ArgumentCaptor.forClass(DeductInventoryRequest.class);
        verify(inventoryClient).deductInventory(captor.capture());

        DeductInventoryRequest captured = captor.getValue();
        assertThat(captured.getOrderCode()).isEqualTo("ORD-20261102-TEST1");
        assertThat(captured.getItems()).hasSize(1);
        assertThat(captured.getItems().get(0).getProductId()).isEqualTo(101L);
        assertThat(captured.getItems().get(0).getVariantId()).isEqualTo(202L);
        assertThat(captured.getItems().get(0).getModifierOptionIds()).containsExactlyInAnyOrder(301L, 302L);
        assertThat(captured.getItems().get(0).getQuantity()).isEqualTo(2);
    }

    @Test
    @DisplayName("Hoàn tất đơn hàng thất bại khi Catalog báo không đủ tồn kho (FeignException)")
    void testCompleteOrder_InsufficientStock() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));

        String errorJson = "{\"success\":false,\"message\":\"Nguyên liệu 'Đào hộp' không đủ tồn kho (Còn lại: 0.1 kg, Cần: 0.5 kg)\",\"error\":\"INSUFFICIENT_STOCK\"}";
        Request request = Request.create(Request.HttpMethod.POST, "/api/inventory/deduct", Collections.emptyMap(), null, StandardCharsets.UTF_8, null);
        Response response = Response.builder()
                .status(400)
                .reason("Bad Request")
                .request(request)
                .body(errorJson, StandardCharsets.UTF_8)
                .headers(Collections.emptyMap())
                .build();
        FeignException.BadRequest badRequestException = new FeignException.BadRequest(
                "Bad Request",
                request,
                errorJson.getBytes(StandardCharsets.UTF_8),
                Collections.emptyMap()
        );

        when(inventoryClient.deductInventory(any(DeductInventoryRequest.class))).thenThrow(badRequestException);

        assertThatThrownBy(() -> orderService.completeOrder(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Đào hộp");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái sang COMPLETED qua updateOrderStatus tự động kích hoạt trừ kho")
    void testUpdateOrderStatus_Completed() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        ApiResponse<DeductInventoryResponse> deductResponse = ApiResponse.success(
                DeductInventoryResponse.builder().orderCode("ORD-20261102-TEST1").build(),
                "Trừ kho thành công"
        );
        when(inventoryClient.deductInventory(any(DeductInventoryRequest.class))).thenReturn(deductResponse);

        OrderResponse res = orderService.updateOrderStatus(1L, OrderStatus.COMPLETED);

        assertThat(res.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        verify(inventoryClient, times(1)).deductInventory(any(DeductInventoryRequest.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái sang PREPARING thành công không kích hoạt trừ kho")
    void testUpdateOrderStatus_PendingToPreparing() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse res = orderService.updateOrderStatus(1L, OrderStatus.PREPARING);

        assertThat(res.getStatus()).isEqualTo(OrderStatus.PREPARING);
        verify(inventoryClient, never()).deductInventory(any(DeductInventoryRequest.class));
    }

    @Test
    @DisplayName("Không trừ kho lại nếu đơn đã ở trạng thái COMPLETED trước đó (Idempotency)")
    void testUpdateOrderStatus_AlreadyCompletedDoesNotDeductAgain() {
        sampleOrder.setStatus(OrderStatus.COMPLETED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        orderService.updateOrderStatus(1L, OrderStatus.COMPLETED);

        verify(inventoryClient, never()).deductInventory(any(DeductInventoryRequest.class));
    }

    @Test
    @DisplayName("Hủy đơn hàng thành công, đổi trạng thái CANCELLED và không trừ kho")
    void testCancelOrder_PendingStatus_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder(1L);

        assertThat(sampleOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(orderRepository).save(sampleOrder);
        verify(inventoryClient, never()).deductInventory(any());
    }

    @Test
    @DisplayName("Hủy đơn hàng thất bại khi không tìm thấy đơn")
    void testCancelOrder_NotFound_ThrowsException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.cancelOrder(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Cập nhật trạng thái thanh toán thành công")
    void testUpdatePayment_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        UpdatePaymentRequest req = new UpdatePaymentRequest(PaymentStatus.PAID, PaymentMethod.VIETQR);

        OrderResponse res = orderService.updatePayment(1L, req);

        assertThat(res.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(res.getPaymentMethod()).isEqualTo(PaymentMethod.VIETQR);
    }

    @Test
    @DisplayName("Lấy chi tiết đơn hàng theo ID thành công")
    void testGetOrderById_Success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));

        OrderResponse res = orderService.getOrderById(1L);

        assertThat(res).isNotNull();
        assertThat(res.getId()).isEqualTo(1L);
        assertThat(res.getOrderCode()).isEqualTo("ORD-20261102-TEST1");
    }

    @Test
    @DisplayName("Lấy chi tiết đơn hàng thất bại khi ID không tồn tại")
    void testGetOrderById_NotFound_ThrowsException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
