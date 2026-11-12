package com.smartpos.sales_service.service;

import com.smartpos.sales_service.dto.request.CheckoutOrderRequest;
import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.request.UpdatePaymentRequest;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.dto.response.PageResponse;
import com.smartpos.sales_service.dto.response.SalesStatisticsResponse;
import com.smartpos.sales_service.entity.ItemKdsStatus;
import com.smartpos.sales_service.entity.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {
    OrderResponse createOrder(CreateOrderRequest request);

    OrderResponse getOrderById(Long id);

    OrderResponse getOrderByCode(String orderCode);

    List<OrderResponse> getOrders(OrderStatus status, String tableNumber);

    PageResponse<OrderResponse> getPagedOrders(OrderStatus status,
                                               String tableNumber,
                                               LocalDateTime startDate,
                                               LocalDateTime endDate,
                                               String search,
                                               int page,
                                               int size,
                                               String sort);

    OrderResponse updateOrderStatus(Long id, OrderStatus status);

    OrderResponse completeOrder(Long id);

    OrderResponse checkoutOrder(Long id, CheckoutOrderRequest request);

    OrderResponse addItemsToOrder(Long id, List<CreateOrderItemRequest> newItems);

    OrderResponse updateOrderItemKdsStatus(Long orderId, Long itemId, ItemKdsStatus status);

    OrderResponse updatePayment(Long id, UpdatePaymentRequest request);

    void cancelOrder(Long id);

    void cancelOrder(Long id, String reason);

    SalesStatisticsResponse getSalesStatistics(String period);
}
