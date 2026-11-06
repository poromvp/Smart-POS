package com.smartpos.sales_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.entity.OrderType;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.service.OrderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(OrderController.class)
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private OrderService orderService;

    @Test
    @DisplayName("POST /api/orders với dữ liệu hợp lệ trả về HTTP 201 Created")
    void testCreateOrder_ValidInput_ReturnsCreated() throws Exception {
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(101L)
                .name("Trà Đào")
                .quantity(1)
                .basePrice(new BigDecimal("35000"))
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .tableNumber("01")
                .orderType(OrderType.DINE_IN)
                .items(List.of(itemReq))
                .build();

        OrderResponse response = OrderResponse.builder()
                .id(1L)
                .orderCode("ORD-20261105-001")
                .tableNumber("01")
                .status(OrderStatus.PENDING)
                .totalAmount(new BigDecimal("35000"))
                .build();

        when(orderService.createOrder(any(CreateOrderRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderCode").value("ORD-20261105-001"))
                .andExpect(jsonPath("$.data.totalAmount").value(35000));
    }

    @Test
    @DisplayName("POST /api/orders với danh sách món trống trả về HTTP 400 Bad Request")
    void testCreateOrder_EmptyItems_ReturnsBadRequest() throws Exception {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .tableNumber("01")
                .items(Collections.emptyList())
                .build();

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET /api/orders/{id} khi tồn tại trả về HTTP 200 OK")
    void testGetOrderById_Found_ReturnsOk() throws Exception {
        OrderResponse response = OrderResponse.builder()
                .id(10L)
                .orderCode("ORD-20261105-010")
                .status(OrderStatus.CONFIRMED)
                .build();

        when(orderService.getOrderById(10L)).thenReturn(response);

        mockMvc.perform(get("/api/orders/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderCode").value("ORD-20261105-010"));
    }

    @Test
    @DisplayName("GET /api/orders/{id} không tồn tại trả về HTTP 404 Not Found")
    void testGetOrderById_NotFound_Returns404() throws Exception {
        when(orderService.getOrderById(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: 999"));

        mockMvc.perform(get("/api/orders/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Không tìm thấy đơn hàng với ID: 999"));
    }

    @Test
    @DisplayName("DELETE /api/orders/{id} hủy đơn thành công trả về HTTP 200 OK")
    void testCancelOrder_Success_ReturnsOk() throws Exception {
        doNothing().when(orderService).cancelOrder(1L);

        mockMvc.perform(delete("/api/orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Hủy đơn hàng thành công"));
    }
}
