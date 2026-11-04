package com.smartpos.sales_service.service;

import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.request.UpdatePaymentRequest;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.OrderStatus;

import java.util.List;

public interface OrderService {
    OrderResponse createOrder(CreateOrderRequest request);

    OrderResponse getOrderById(Long id);

    OrderResponse getOrderByCode(String orderCode);

    List<OrderResponse> getOrders(OrderStatus status, String tableNumber);

    OrderResponse updateOrderStatus(Long id, OrderStatus status);

    OrderResponse updatePayment(Long id, UpdatePaymentRequest request);

    void cancelOrder(Long id);
}
