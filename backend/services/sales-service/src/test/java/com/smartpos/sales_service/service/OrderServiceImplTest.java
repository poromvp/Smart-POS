package com.smartpos.sales_service.service;

import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.client.dto.DeductInventoryRequest;
import com.smartpos.sales_service.client.dto.DeductInventoryResponse;
import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.Order;
import com.smartpos.sales_service.entity.OrderItem;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.entity.OrderType;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.repository.OrderRepository;
import com.smartpos.sales_service.service.impl.OrderServiceImpl;
import feign.Request;
import feign.Response;
import feign.FeignException;
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
    @DisplayName("Không trừ kho lại nếu đơn đã ở trạng thái COMPLETED trước đó (Idempotency)")
    void testUpdateOrderStatus_AlreadyCompletedDoesNotDeductAgain() {
        sampleOrder.setStatus(OrderStatus.COMPLETED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        orderService.updateOrderStatus(1L, OrderStatus.COMPLETED);

        verify(inventoryClient, never()).deductInventory(any(DeductInventoryRequest.class));
    }
}
