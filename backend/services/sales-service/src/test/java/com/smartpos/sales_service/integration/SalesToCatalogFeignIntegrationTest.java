package com.smartpos.sales_service.integration;

import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.client.dto.DeductInventoryResponse;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.Order;
import com.smartpos.sales_service.entity.OrderItem;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.entity.OrderType;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.repository.OrderRepository;
import com.smartpos.sales_service.service.OrderService;
import feign.FeignException;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class SalesToCatalogFeignIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @MockitoBean
    private InventoryClient inventoryClient;

    private Order testOrder;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();

        OrderItem item = OrderItem.builder()
                .productId(200L)
                .name("Lẩu Bò")
                .quantity(1)
                .unitPrice(new BigDecimal("150000"))
                .modifierTotal(BigDecimal.ZERO)
                .totalPrice(new BigDecimal("150000"))
                .build();

        testOrder = Order.builder()
                .orderCode("ORD-FEIGN-001")
                .tableNumber("10")
                .orderType(OrderType.DINE_IN)
                .status(OrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("150000"))
                .items(new ArrayList<>(List.of(item)))
                .build();
        item.setOrder(testOrder);

        testOrder = orderRepository.save(testOrder);
    }

    @Test
    @DisplayName("Tích hợp Happy Path: Catalog phản hồi trừ kho thành công, Sales cập nhật đơn COMPLETED trong CSDL")
    void testCompleteOrder_CatalogSuccess_OrderCompletedInDb() {
        ApiResponse<DeductInventoryResponse> deductResponse = ApiResponse.success(
                DeductInventoryResponse.builder().orderCode("ORD-FEIGN-001").build(),
                "Trừ kho thành công"
        );
        when(inventoryClient.deductInventory(any())).thenReturn(deductResponse);

        OrderResponse response = orderService.completeOrder(testOrder.getId());

        assertThat(response.getStatus()).isEqualTo(OrderStatus.COMPLETED);

        // Kiểm tra trực tiếp trong DB H2 xem trạng thái đã được lưu COMPLETED chưa
        Order savedOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertThat(savedOrder.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    @DisplayName("Tích hợp Kho thiếu hàng: Catalog trả về HTTP 400 Bad Request, Sales bắt lỗi và rollback trạng thái đơn")
    void testCompleteOrder_CatalogInsufficientStock_RollbackOrder() {
        String errorJson = "{\"success\":false,\"message\":\"Nguyên liệu 'Thịt Bò' không đủ tồn kho\",\"error\":\"INSUFFICIENT_STOCK\"}";
        Request request = Request.create(Request.HttpMethod.POST, "/api/inventory/deduct", Collections.emptyMap(), null, StandardCharsets.UTF_8, null);
        FeignException.BadRequest badRequestException = new FeignException.BadRequest(
                "Bad Request",
                request,
                errorJson.getBytes(StandardCharsets.UTF_8),
                Collections.emptyMap()
        );

        when(inventoryClient.deductInventory(any())).thenThrow(badRequestException);

        assertThatThrownBy(() -> orderService.completeOrder(testOrder.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Thịt Bò");

        // Kiểm tra trực tiếp trong DB H2: Đơn hàng vẫn giữ nguyên trạng thái CONFIRMED (không bị cập nhật sai)
        Order savedOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertThat(savedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    @Test
    @DisplayName("Tích hợp Sự cố mạng: Catalog trả về HTTP 503 hoặc Timeout, Sales xử lý an toàn không để treo đơn")
    void testCompleteOrder_CatalogServiceUnavailable_ThrowsAndRollsBack() {
        Request request = Request.create(Request.HttpMethod.POST, "/api/inventory/deduct", Collections.emptyMap(), null, StandardCharsets.UTF_8, null);
        FeignException.ServiceUnavailable serviceUnavailableException = new FeignException.ServiceUnavailable(
                "Service Unavailable",
                request,
                null,
                Collections.emptyMap()
        );

        when(inventoryClient.deductInventory(any())).thenThrow(serviceUnavailableException);

        assertThatThrownBy(() -> orderService.completeOrder(testOrder.getId()))
                .isInstanceOf(BusinessException.class);

        Order savedOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertThat(savedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }
}
