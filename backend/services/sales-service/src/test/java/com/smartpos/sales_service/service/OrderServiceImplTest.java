package com.smartpos.sales_service.service;

import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.client.dto.DeductInventoryRequest;
import com.smartpos.sales_service.client.dto.DeductInventoryResponse;
import com.smartpos.sales_service.dto.request.CheckoutOrderRequest;
import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.request.UpdatePaymentRequest;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.dto.response.PageResponse;
import com.smartpos.sales_service.dto.response.SalesStatisticsResponse;
import com.smartpos.sales_service.entity.*;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.CustomerRepository;
import com.smartpos.sales_service.repository.OrderRepository;
import com.smartpos.sales_service.repository.PointTransactionRepository;
import com.smartpos.sales_service.repository.PromotionRepository;
import com.smartpos.sales_service.security.UserContext;
import com.smartpos.sales_service.security.UserContextHolder;
import com.smartpos.sales_service.service.impl.OrderServiceImpl;
import feign.FeignException;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;

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

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private OrderServiceImpl orderService;

    private Order sampleOrder;

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

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

    @Test
    @DisplayName("Thanh toán đơn hàng (checkoutOrder) thành công với voucher và điểm tích lũy")
    void testCheckoutOrder_Success_AppliesVoucherAndPoints() {
        Customer customer = Customer.builder()
                .id(5L)
                .phone("0901234567")
                .currentPoints(10)
                .totalSpent(BigDecimal.ZERO)
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
                .usedCount(0)
                .build();

        sampleOrder.setStatus(OrderStatus.PREPARING);
        sampleOrder.setSubtotal(new BigDecimal("90000"));

        CheckoutOrderRequest req = CheckoutOrderRequest.builder()
                .customerId(5L)
                .promotionCode("SALE10")
                .pointsToRedeem(5)
                .paymentMethod(PaymentMethod.CASH)
                .staffId(100L)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(customerRepository.findById(5L)).thenReturn(Optional.of(customer));
        when(promotionRepository.findByCodeIgnoreCase("SALE10")).thenReturn(Optional.of(promo));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        ApiResponse<DeductInventoryResponse> deductResponse = ApiResponse.success(
                DeductInventoryResponse.builder().orderCode("ORD-20261102-TEST1").build(),
                "Trừ kho thành công"
        );
        when(inventoryClient.deductInventory(any(DeductInventoryRequest.class))).thenReturn(deductResponse);

        OrderResponse res = orderService.checkoutOrder(1L, req);

        assertThat(res.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(res.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(res.getPaymentMethod()).isEqualTo(PaymentMethod.CASH);
        assertThat(res.getStaffId()).isEqualTo(100L);
        assertThat(res.getDiscountAmount()).isEqualByComparingTo("9000"); // 10% của 90k
        assertThat(res.getPointsDiscountAmount()).isEqualByComparingTo("5000"); // 5 điểm = 5000đ
        assertThat(res.getTotalAmount()).isEqualByComparingTo("76000"); // 90k - 9k - 5k = 76k
        assertThat(sampleOrder.getItems().get(0).getKdsStatus()).isEqualTo(ItemKdsStatus.SERVED);

        verify(inventoryClient).deductInventory(any(DeductInventoryRequest.class));
        verify(customerRepository).save(customer);
        verify(promotionRepository).save(promo);
    }

    @Test
    @DisplayName("Thanh toán thất bại khi đơn hàng đã hoàn tất trước đó")
    void testCheckoutOrder_AlreadyCompleted_ThrowsException() {
        sampleOrder.setStatus(OrderStatus.COMPLETED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));

        CheckoutOrderRequest req = CheckoutOrderRequest.builder()
                .paymentMethod(PaymentMethod.CASH)
                .build();

        assertThatThrownBy(() -> orderService.checkoutOrder(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Đơn hàng đã được thanh toán và hoàn tất trước đó");
    }

    @Test
    @DisplayName("Thêm món vào đơn hàng thành công, tính lại tổng tiền và chuyển trạng thái từ READY về PREPARING")
    void testAddItemsToOrder_Success_RecalculatesSubtotal() {
        sampleOrder.setStatus(OrderStatus.READY);
        sampleOrder.setSubtotal(new BigDecimal("90000"));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        CreateOrderItemRequest newItem = CreateOrderItemRequest.builder()
                .productId(102L)
                .name("Trà Sữa Oolong")
                .quantity(1)
                .basePrice(new BigDecimal("30000"))
                .modifierTotal(BigDecimal.ZERO)
                .build();

        OrderResponse res = orderService.addItemsToOrder(1L, List.of(newItem));

        assertThat(res.getItems()).hasSize(2);
        assertThat(res.getStatus()).isEqualTo(OrderStatus.PREPARING);
        assertThat(res.getSubtotal()).isEqualByComparingTo("120000"); // 90k + 30k
        assertThat(res.getTotalAmount()).isEqualByComparingTo("120000");
    }

    @Test
    @DisplayName("Thêm món vào đơn hàng đã hoàn tất ném ra BusinessException")
    void testAddItemsToOrder_CompletedOrder_ThrowsException() {
        sampleOrder.setStatus(OrderStatus.COMPLETED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));

        CreateOrderItemRequest newItem = CreateOrderItemRequest.builder()
                .productId(102L)
                .name("Bánh mì")
                .quantity(1)
                .basePrice(new BigDecimal("20000"))
                .build();

        assertThatThrownBy(() -> orderService.addItemsToOrder(1L, List.of(newItem)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không thể thêm món vào đơn hàng đã hoàn tất");
    }

    @Test
    @DisplayName("Cập nhật trạng thái món ăn KDS sang COOKING chuyển trạng thái đơn hàng sang PREPARING")
    void testUpdateOrderItemKdsStatus_Cooking_SetsOrderPreparing() {
        sampleOrder.setStatus(OrderStatus.PENDING);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse res = orderService.updateOrderItemKdsStatus(1L, 1L, ItemKdsStatus.COOKING);

        assertThat(res.getStatus()).isEqualTo(OrderStatus.PREPARING);
        assertThat(res.getItems().get(0).getKdsStatus()).isEqualTo(ItemKdsStatus.COOKING);
    }

    @Test
    @DisplayName("Cập nhật trạng thái món ăn KDS sang READY khi tất cả món hoàn thành thì đơn hàng READY")
    void testUpdateOrderItemKdsStatus_AllReady_SetsOrderReady() {
        sampleOrder.setStatus(OrderStatus.PREPARING);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse res = orderService.updateOrderItemKdsStatus(1L, 1L, ItemKdsStatus.READY);

        assertThat(res.getStatus()).isEqualTo(OrderStatus.READY);
        assertThat(res.getItems().get(0).getKdsStatus()).isEqualTo(ItemKdsStatus.READY);
    }

    @Test
    @DisplayName("Hủy đơn hàng có lý do và ghi nhận người hủy từ UserContext")
    void testCancelOrder_WithReason_SavesCancelledByAndReason() {
        sampleOrder.setStatus(OrderStatus.PENDING);
        UserContextHolder.setContext(UserContext.builder().userId("U-123").username("manager_an").role("ADMIN").build());

        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        orderService.cancelOrder(1L, "Khách đổi bàn sang tầng 2");

        assertThat(sampleOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(sampleOrder.getCancelReason()).isEqualTo("Khách đổi bàn sang tầng 2");
        assertThat(sampleOrder.getCancelledBy()).isEqualTo("manager_an");
    }

    @Test
    @DisplayName("Hủy đơn hàng đã hoàn tất ném ra BusinessException")
    void testCancelOrder_CompletedOrder_ThrowsException() {
        sampleOrder.setStatus(OrderStatus.COMPLETED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> orderService.cancelOrder(1L, "Lý do hủy"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không thể hủy đơn hàng đã hoàn tất");
    }

    @Test
    @DisplayName("Lấy thống kê doanh thu (getSalesStatistics) thành công")
    void testGetSalesStatistics_Success() {
        sampleOrder.setStatus(OrderStatus.COMPLETED);
        sampleOrder.setCreatedAt(java.time.LocalDateTime.now());
        when(orderRepository.findCompletedOrdersBetween(eq(OrderStatus.COMPLETED), any(), any()))
                .thenReturn(List.of(sampleOrder));

        SalesStatisticsResponse stats = orderService.getSalesStatistics("today");

        assertThat(stats).isNotNull();
        assertThat(stats.getTotalOrders()).isEqualTo(1);
        assertThat(stats.getTotalRevenue()).isEqualByComparingTo("90000");
        assertThat(stats.getTopSellingItems()).hasSize(1);
        assertThat(stats.getTopSellingItems().get(0).getName()).isEqualTo("Trà Đào Cam Sả");
    }

    @Test
    @DisplayName("Lấy danh sách đơn hàng phân trang (getPagedOrders) thành công")
    void testGetPagedOrders_Success() {
        when(orderRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleOrder), PageRequest.of(0, 10), 1));

        PageResponse<OrderResponse> page = orderService.getPagedOrders(OrderStatus.PENDING, null, null, null, null, 0, 10, "createdAt,desc");

        assertThat(page).isNotNull();
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getPageNumber()).isEqualTo(0);
        assertThat(page.getPageSize()).isEqualTo(10);
    }
}
