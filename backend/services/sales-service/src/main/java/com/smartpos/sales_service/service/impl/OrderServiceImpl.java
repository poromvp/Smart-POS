package com.smartpos.sales_service.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.client.dto.DeductInventoryRequest;
import com.smartpos.sales_service.client.dto.DeductInventoryResponse;
import com.smartpos.sales_service.client.dto.DeductItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.request.UpdatePaymentRequest;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.OrderItemResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.Order;
import com.smartpos.sales_service.entity.OrderItem;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.OrderRepository;
import com.smartpos.sales_service.service.OrderService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

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

            Long productId = itemReq.getProductId();
            if (productId == null && itemReq.getItemId() != null) {
                try {
                    productId = Long.parseLong(itemReq.getItemId());
                } catch (NumberFormatException ignored) {
                }
            }

            List<Long> modifierOptionIds = itemReq.getModifierOptionIds() != null
                    ? new ArrayList<>(itemReq.getModifierOptionIds())
                    : new ArrayList<>();

            String itemIdStr = itemReq.getItemId() != null
                    ? itemReq.getItemId()
                    : (productId != null ? String.valueOf(productId) : null);

            OrderItem orderItem = OrderItem.builder()
                    .productId(productId)
                    .variantId(itemReq.getVariantId())
                    .modifierOptionIds(modifierOptionIds)
                    .itemId(itemIdStr)
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

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(status);

        // Tự động kích hoạt trừ kho khi đơn hàng chuyển sang trạng thái COMPLETED
        if (status == OrderStatus.COMPLETED && oldStatus != OrderStatus.COMPLETED) {
            deductInventoryForOrder(order);
        }

        Order updated = orderRepository.save(order);
        return mapToOrderResponse(updated);
    }

    @Override
    @Transactional
    public OrderResponse completeOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(OrderStatus.COMPLETED);

        // Kích hoạt trừ kho tự động nếu chưa hoàn tất trước đó
        if (oldStatus != OrderStatus.COMPLETED) {
            deductInventoryForOrder(order);
        }

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

    /**
     * Thực hiện trừ kho tự động qua FeignClient gọi catalog-inventory-service
     */
    private void deductInventoryForOrder(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            log.warn("Đơn hàng {} không có món ăn nào để trừ kho", order.getOrderCode());
            return;
        }

        List<DeductItemRequest> items = order.getItems().stream().map(item -> DeductItemRequest.builder()
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .modifierOptionIds(item.getModifierOptionIds() != null
                        ? new HashSet<>(item.getModifierOptionIds())
                        : new HashSet<>())
                .quantity(item.getQuantity())
                .build()
        ).collect(Collectors.toList());

        DeductInventoryRequest deductRequest = DeductInventoryRequest.builder()
                .orderCode(order.getOrderCode())
                .items(items)
                .build();

        try {
            log.info("Bắt đầu gọi API trừ kho cho đơn hàng {} với {} món ăn", order.getOrderCode(), items.size());
            ApiResponse<DeductInventoryResponse> response = inventoryClient.deductInventory(deductRequest);
            log.info("Trừ kho tự động thành công cho đơn hàng: {}. Phản hồi: {}", order.getOrderCode(), response.getMessage());
        } catch (FeignException e) {
            String errorMsg = extractErrorMessage(e);
            log.error("Lỗi tồn kho khi trừ kho cho đơn {}: {}", order.getOrderCode(), errorMsg);
            throw new BusinessException("Không thể hoàn tất đơn hàng: " + errorMsg, e);
        } catch (Exception e) {
            log.error("Lỗi không mong muốn khi gọi catalog-inventory-service cho đơn {}: {}", order.getOrderCode(), e.getMessage());
            throw new BusinessException("Lỗi kết nối tới Catalog & Inventory Service: " + e.getMessage(), e);
        }
    }

    private String extractErrorMessage(FeignException e) {
        try {
            if (e.contentUTF8() != null && !e.contentUTF8().isBlank()) {
                JsonNode root = objectMapper.readTree(e.contentUTF8());
                if (root.has("message") && !root.get("message").asText().isBlank()) {
                    return root.get("message").asText();
                }
            }
        } catch (Exception ignored) {
        }
        return e.getMessage();
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
                            .productId(item.getProductId())
                            .variantId(item.getVariantId())
                            .modifierOptionIds(item.getModifierOptionIds())
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
