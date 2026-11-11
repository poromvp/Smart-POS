package com.smartpos.sales_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.sales_service.dto.request.CancelOrderRequest;
import com.smartpos.sales_service.dto.request.CheckoutOrderRequest;
import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.dto.response.PageResponse;
import com.smartpos.sales_service.dto.response.SalesStatisticsResponse;
import com.smartpos.sales_service.entity.ItemKdsStatus;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.entity.OrderType;
import com.smartpos.sales_service.entity.PaymentMethod;
import com.smartpos.sales_service.entity.PaymentStatus;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.security.CorrelationIdFilter;
import com.smartpos.sales_service.security.UserContextFilter;
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

import static org.mockito.ArgumentMatchers.*;
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
    @DisplayName("POST /api/orders (QR public) với dữ liệu hợp lệ trả về HTTP 201 Created")
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
                        .header(CorrelationIdFilter.HEADER_CORRELATION_ID, "cid-order-create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string(CorrelationIdFilter.HEADER_CORRELATION_ID, "cid-order-create"))
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
    @DisplayName("GET /api/orders/{id} khi có quyền ORDER_READ và tồn tại trả về HTTP 200 OK")
    void testGetOrderById_Found_ReturnsOk() throws Exception {
        OrderResponse response = OrderResponse.builder()
                .id(10L)
                .orderCode("ORD-20261105-010")
                .status(OrderStatus.CONFIRMED)
                .build();

        when(orderService.getOrderById(10L)).thenReturn(response);

        mockMvc.perform(get("/api/orders/10")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "POS_ACCESS,ORDER_READ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderCode").value("ORD-20261105-010"));
    }

    @Test
    @DisplayName("GET /api/orders/{id} không tồn tại trả về HTTP 404 Not Found")
    void testGetOrderById_NotFound_Returns404() throws Exception {
        when(orderService.getOrderById(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: 999"));

        mockMvc.perform(get("/api/orders/999")
                        .header(UserContextFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Không tìm thấy đơn hàng với ID: 999"));
    }

    @Test
    @DisplayName("DELETE /api/orders/{id} hủy đơn thành công trả về HTTP 200 OK")
    void testCancelOrder_Success_ReturnsOk() throws Exception {
        doNothing().when(orderService).cancelOrder(1L, "Hủy theo yêu cầu");

        mockMvc.perform(delete("/api/orders/1")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "ORDER_CANCEL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Hủy đơn hàng thành công"));
    }

    @Test
    @DisplayName("POST /api/orders/{id}/checkout thanh toán đơn hàng thành công")
    void testCheckoutOrder_Success() throws Exception {
        CheckoutOrderRequest request = CheckoutOrderRequest.builder()
                .paymentMethod(PaymentMethod.CASH)
                .staffId(10L)
                .build();

        OrderResponse response = OrderResponse.builder()
                .id(1L)
                .orderCode("ORD-20261105-001")
                .status(OrderStatus.COMPLETED)
                .paymentStatus(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.CASH)
                .totalAmount(new BigDecimal("50000"))
                .build();

        when(orderService.checkoutOrder(eq(1L), any(CheckoutOrderRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/orders/1/checkout")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "PAYMENT_PROCESS,POS_ACCESS")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"));
    }

    @Test
    @DisplayName("POST /api/orders/{id}/items (QR public) thêm món vào đơn hàng thành công")
    void testAddItemsToOrder_Success() throws Exception {
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(102L)
                .name("Trà Sữa Oolong")
                .quantity(1)
                .basePrice(new BigDecimal("30000"))
                .build();

        OrderResponse response = OrderResponse.builder()
                .id(1L)
                .orderCode("ORD-20261105-001")
                .status(OrderStatus.PREPARING)
                .totalAmount(new BigDecimal("80000"))
                .build();

        when(orderService.addItemsToOrder(eq(1L), anyList())).thenReturn(response);

        mockMvc.perform(post("/api/orders/1/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(itemReq))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PREPARING"));
    }

    @Test
    @DisplayName("PATCH /api/orders/{orderId}/items/{itemId}/kds-status với quyền KDS_UPDATE thành công")
    void testUpdateOrderItemKdsStatus_Success() throws Exception {
        OrderResponse response = OrderResponse.builder()
                .id(1L)
                .status(OrderStatus.READY)
                .build();

        when(orderService.updateOrderItemKdsStatus(1L, 5L, ItemKdsStatus.READY)).thenReturn(response);

        mockMvc.perform(patch("/api/orders/1/items/5/kds-status")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CHEF")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "KDS_VIEW,KDS_UPDATE")
                        .param("status", "READY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("READY"));
    }

    @Test
    @DisplayName("POST /api/orders/{id}/cancel hủy đơn kèm lý do thành công")
    void testCancelOrderWithReason_Success() throws Exception {
        CancelOrderRequest request = new CancelOrderRequest("Khách hủy do chờ lâu");
        doNothing().when(orderService).cancelOrder(1L, "Khách hủy do chờ lâu");

        mockMvc.perform(post("/api/orders/1/cancel")
                        .header(UserContextFilter.HEADER_USER_ROLE, "MANAGER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "ORDER_CANCEL")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Hủy đơn hàng thành công"));
    }

    @Test
    @DisplayName("GET /api/orders/statistics với quyền REPORT_VIEW trả về thống kê doanh thu")
    void testGetSalesStatistics_Success() throws Exception {
        SalesStatisticsResponse response = SalesStatisticsResponse.builder()
                .totalRevenue(new BigDecimal("1500000"))
                .totalOrders(10)
                .topSellingItems(Collections.emptyList())
                .hourlyRevenue(Collections.emptyList())
                .build();

        when(orderService.getSalesStatistics("today")).thenReturn(response);

        mockMvc.perform(get("/api/orders/statistics")
                        .header(UserContextFilter.HEADER_USER_ROLE, "MANAGER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "ADMIN_DASHBOARD,REPORT_VIEW")
                        .param("period", "today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRevenue").value(1500000))
                .andExpect(jsonPath("$.data.totalOrders").value(10));
    }

    @Test
    @DisplayName("GET /api/orders có tham số page (khi có quyền ORDER_READ) trả về danh sách phân trang PageResponse")
    void testGetPagedOrders_ReturnsPageResponse() throws Exception {
        OrderResponse orderRes = OrderResponse.builder()
                .id(1L)
                .orderCode("ORD-20261105-001")
                .build();

        PageResponse<OrderResponse> pageResponse = PageResponse.<OrderResponse>builder()
                .content(List.of(orderRes))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(orderService.getPagedOrders(any(), any(), any(), any(), any(), eq(0), eq(10), any()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/orders")
                        .header(UserContextFilter.HEADER_USER_ROLE, "MANAGER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "ORDER_READ,ADMIN_DASHBOARD")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/orders?tableNumber=11 cho phép khách QR ẩn danh, nhưng chặn 403 khi thiếu tableNumber hoặc có page=")
    void testOrdersAuthzAndPublicTableLookup() throws Exception {
        when(orderService.getOrders(null, "11")).thenReturn(List.of());

        mockMvc.perform(get("/api/orders").param("tableNumber", "11"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/orders").param("tableNumber", "11").param("page", "0"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/orders/10"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/orders/statistics")
                        .header(UserContextFilter.HEADER_USER_ROLE, "WAITER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "ORDER_CREATE,ORDER_READ"))
                .andExpect(status().isForbidden());

        CheckoutOrderRequest checkoutReq = CheckoutOrderRequest.builder()
                .paymentMethod(PaymentMethod.CASH)
                .build();
        mockMvc.perform(post("/api/orders/1/checkout")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CHEF")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "KDS_VIEW,KDS_UPDATE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/orders/1/items/5/kds-status")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "POS_ACCESS,PAYMENT_PROCESS")
                        .param("status", "READY"))
                .andExpect(status().isForbidden());
    }
}
