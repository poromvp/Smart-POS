package com.smartpos.sales_service.service.impl;

import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.request.UpdatePaymentRequest;
import com.smartpos.sales_service.dto.response.OrderItemResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.Order;
import com.smartpos.sales_service.entity.OrderItem;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.OrderRepository;
import com.smartpos.sales_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        String orderCode = generateOrderCode();

        Order order = Order.builder()
                .orderCode(orderCode)
                .tableNumber(request.getTableNumber())
                .orderType(request.getOrderType())
                .note(request.getNote())
                .status(OrderStatus.PENDING)
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemReq : request.getItems()) {
            BigDecimal modifierTotal = itemReq.getModifierTotal() != null ? itemReq.getModifierTotal() : BigDecimal.ZERO;
            BigDecimal itemTotal = itemReq.getBasePrice().add(modifierTotal)
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            String toppingsStr = itemReq.getToppings() != null && !itemReq.getToppings().isEmpty()
                    ? String.join(", ", itemReq.getToppings())
                    : null;

            OrderItem orderItem = OrderItem.builder()
                    .itemId(itemReq.getItemId())
                    .name(itemReq.getName())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getBasePrice())
                    .modifierTotal(modifierTotal)
                    .toppings(toppingsStr)
                    .sweetness(itemReq.getSweetness())
                    .note(itemReq.getNote())
                    .build();

            order.addItem(orderItem);
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);
        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderCode));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(OrderStatus status, String tableNumber) {
        List<Order> orders;
        if (status != null) {
            orders = orderRepository.findByStatus(status);
        } else if (tableNumber != null && !tableNumber.isBlank()) {
            orders = orderRepository.findByTableNumber(tableNumber);
        } else {
            orders = orderRepository.findAll();
        }

        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));
        order.setStatus(status);
        Order updated = orderRepository.save(order);
        return mapToOrderResponse(updated);
    }

    @Override
    @Transactional
    public OrderResponse updatePayment(Long id, UpdatePaymentRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));
        order.setPaymentStatus(request.getPaymentStatus());
        if (request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod());
        }
        Order updated = orderRepository.save(order);
        return mapToOrderResponse(updated);
    }

    @Override
    @Transactional
    public void cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    private String generateOrderCode() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        return "ORD-" + datePrefix + "-" + randomSuffix;
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> {
                    BigDecimal modTotal = item.getModifierTotal() != null ? item.getModifierTotal() : BigDecimal.ZERO;
                    BigDecimal subTotal = item.getUnitPrice().add(modTotal)
                            .multiply(BigDecimal.valueOf(item.getQuantity()));
                    return OrderItemResponse.builder()
                            .id(item.getId())
                            .itemId(item.getItemId())
                            .name(item.getName())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .modifierTotal(modTotal)
                            .toppings(item.getToppings())
                            .sweetness(item.getSweetness())
                            .note(item.getNote())
                            .subTotal(subTotal)
                            .build();
                })
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .tableNumber(order.getTableNumber())
                .orderType(order.getOrderType())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .totalAmount(order.getTotalAmount())
                .note(order.getNote())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
