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
import com.smartpos.sales_service.entity.*;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.CustomerRepository;
import com.smartpos.sales_service.repository.OrderRepository;
import com.smartpos.sales_service.repository.PointTransactionRepository;
import com.smartpos.sales_service.repository.PromotionRepository;
import com.smartpos.sales_service.service.OrderService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final PromotionRepository promotionRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final InventoryClient inventoryClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        String orderCode = generateOrderCode();

        Order order = Order.builder()
                .orderCode(orderCode)
                .tableNumber(request.getTableNumber())
                .orderType(request.getOrderType() != null ? request.getOrderType() : OrderType.DINE_IN)
                .note(request.getNote())
                .status(OrderStatus.PENDING)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemReq : request.getItems()) {
            BigDecimal modifierTotal = itemReq.getModifierTotal() != null ? itemReq.getModifierTotal()
                    : BigDecimal.ZERO;
            BigDecimal itemTotal = itemReq.getBasePrice().add(modifierTotal)
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemTotal);

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
                    .totalPrice(itemTotal)
                    .modifierTotal(modifierTotal)
                    .toppings(toppingsStr)
                    .sweetness(itemReq.getSweetness())
                    .note(itemReq.getNote())
                    .build();

            order.addItem(orderItem);
        }

        order.setSubtotal(subtotal);

        // 1. Áp dụng Khuyến mãi (Voucher)
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getPromotionCode() != null && !request.getPromotionCode().isBlank()) {
            String code = request.getPromotionCode().trim();
            Promotion promotion = promotionRepository.findByCodeIgnoreCase(code).orElse(null);
            if (promotion != null && Boolean.TRUE.equals(promotion.getIsActive())) {
                LocalDateTime now = LocalDateTime.now();
                boolean withinDate = !now.isBefore(promotion.getStartDate()) && !now.isAfter(promotion.getEndDate());
                boolean withinLimit = promotion.getUsageLimit() == null || promotion.getUsedCount() < promotion.getUsageLimit();
                boolean meetMinOrder = promotion.getMinOrderAmount() == null || subtotal.compareTo(promotion.getMinOrderAmount()) >= 0;

                if (withinDate && withinLimit && meetMinOrder) {
                    BigDecimal calculated = subtotal.multiply(promotion.getDiscountPercent())
                            .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                    if (promotion.getMaxDiscountAmount() != null && calculated.compareTo(promotion.getMaxDiscountAmount()) > 0) {
                        calculated = promotion.getMaxDiscountAmount();
                    }
                    discountAmount = calculated;
                    order.setPromotion(promotion);
                } else {
                    log.warn("Mã khuyến mãi {} không thỏa điều kiện áp dụng cho đơn hàng {}", code, orderCode);
                }
            }
        }
        order.setDiscountAmount(discountAmount);

        // 2. Áp dụng Khách hàng thân thiết & Điểm tích lũy (Loyalty)
        BigDecimal pointsDiscountAmount = BigDecimal.ZERO;
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        } else if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            customer = customerRepository.findByPhone(request.getCustomerPhone().trim()).orElse(null);
        }

        if (customer != null) {
            order.setCustomer(customer);

            if (request.getPointsToRedeem() != null && request.getPointsToRedeem() > 0) {
                int availablePoints = customer.getCurrentPoints() != null ? customer.getCurrentPoints() : 0;
                int pointsToUse = Math.min(request.getPointsToRedeem(), availablePoints);

                // Quy đổi: 1 điểm = 1.000 VNĐ
                BigDecimal potentialPointsDiscount = BigDecimal.valueOf(pointsToUse).multiply(BigDecimal.valueOf(1000));
                BigDecimal maxAllowedDiscount = subtotal.subtract(discountAmount);
                if (maxAllowedDiscount.compareTo(BigDecimal.ZERO) < 0) {
                    maxAllowedDiscount = BigDecimal.ZERO;
                }

                if (potentialPointsDiscount.compareTo(maxAllowedDiscount) > 0) {
                    potentialPointsDiscount = maxAllowedDiscount;
                }

                pointsDiscountAmount = potentialPointsDiscount;
            }
        }
        order.setPointsDiscountAmount(pointsDiscountAmount);

        // 3. Tính tổng thanh toán: subtotal - discountAmount - pointsDiscountAmount
        BigDecimal totalAmount = subtotal.subtract(discountAmount).subtract(pointsDiscountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
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
        if (status != null && tableNumber != null && !tableNumber.isBlank()) {
            orders = orderRepository.findByStatus(status).stream()
                    .filter(o -> tableNumber.equalsIgnoreCase(o.getTableNumber()))
                    .collect(Collectors.toList());
        } else if (status != null) {
            orders = orderRepository.findByStatus(status);
        } else if (tableNumber != null && !tableNumber.isBlank()) {
            orders = orderRepository.findByTableNumber(tableNumber);
        } else {
            orders = orderRepository.findAll();
        }

        return orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
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

        // Tự động kích hoạt trừ kho và xử lý tích điểm/voucher khi đơn hàng chuyển sang trạng thái COMPLETED
        if (status == OrderStatus.COMPLETED && oldStatus != OrderStatus.COMPLETED) {
            deductInventoryForOrder(order);
            processLoyaltyAndPromotion(order);
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

        // Kích hoạt trừ kho tự động & tích điểm nếu chưa hoàn tất trước đó
        if (oldStatus != OrderStatus.COMPLETED) {
            deductInventoryForOrder(order);
            processLoyaltyAndPromotion(order);
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
     * Xử lý tích điểm và tăng số lượt dùng mã khuyến mãi khi đơn hoàn tất
     */
    private void processLoyaltyAndPromotion(Order order) {
        // 1. Cập nhật lượt dùng khuyến mãi
        if (order.getPromotion() != null) {
            Promotion promo = order.getPromotion();
            promo.setUsedCount((promo.getUsedCount() != null ? promo.getUsedCount() : 0) + 1);
            promotionRepository.save(promo);
        }

        // 2. Cập nhật tích / trừ điểm khách hàng
        if (order.getCustomer() != null) {
            Customer customer = order.getCustomer();

            // Nếu đơn có trừ điểm thưởng
            if (order.getPointsDiscountAmount() != null && order.getPointsDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                int pointsRedeemed = order.getPointsDiscountAmount()
                        .divide(BigDecimal.valueOf(1000), 0, RoundingMode.FLOOR).intValue();
                if (pointsRedeemed > 0) {
                    customer.setCurrentPoints(Math.max(0, customer.getCurrentPoints() - pointsRedeemed));
                    pointTransactionRepository.save(PointTransaction.builder()
                            .customer(customer)
                            .order(order)
                            .pointsChange(-pointsRedeemed)
                            .type("REDEEM")
                            .build());
                }
            }

            // Tích điểm thưởng cho đơn hoàn tất: 1% giá trị thanh toán thực tế (1 điểm = 1.000đ -> 100.000đ = 1 điểm)
            if (order.getTotalAmount() != null && order.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
                int earnedPoints = order.getTotalAmount()
                        .divide(BigDecimal.valueOf(100000), 0, RoundingMode.FLOOR).intValue();
                if (earnedPoints > 0) {
                    customer.setCurrentPoints((customer.getCurrentPoints() != null ? customer.getCurrentPoints() : 0) + earnedPoints);
                    pointTransactionRepository.save(PointTransaction.builder()
                            .customer(customer)
                            .order(order)
                            .pointsChange(earnedPoints)
                            .type("EARN")
                            .build());
                }

                // Cập nhật tổng chi tiêu
                BigDecimal currentSpent = customer.getTotalSpent() != null ? customer.getTotalSpent() : BigDecimal.ZERO;
                customer.setTotalSpent(currentSpent.add(order.getTotalAmount()));
            }

            customerRepository.save(customer);
        }
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
                .build()).collect(Collectors.toList());

        DeductInventoryRequest deductRequest = DeductInventoryRequest.builder()
                .orderCode(order.getOrderCode())
                .items(items)
                .build();

        try {
            log.info("Bắt đầu gọi API trừ kho cho đơn hàng {} với {} món ăn", order.getOrderCode(), items.size());
            ApiResponse<DeductInventoryResponse> response = inventoryClient.deductInventory(deductRequest);
            log.info("Trừ kho tự động thành công cho đơn hàng: {}. Phản hồi: {}", order.getOrderCode(),
                    response.getMessage());
        } catch (FeignException e) {
            String errorMsg = extractErrorMessage(e);
            log.error("Lỗi tồn kho khi trừ kho cho đơn {}: {}", order.getOrderCode(), errorMsg);
            throw new BusinessException("Không thể hoàn tất đơn hàng: " + errorMsg, e);
        } catch (Exception e) {
            log.error("Lỗi không mong muốn khi gọi catalog-inventory-service cho đơn {}: {}", order.getOrderCode(),
                    e.getMessage());
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
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
                .customerPhone(order.getCustomer() != null ? order.getCustomer().getPhone() : null)
                .promotionId(order.getPromotion() != null ? order.getPromotion().getId() : null)
                .promotionCode(order.getPromotion() != null ? order.getPromotion().getCode() : null)
                .promotionName(order.getPromotion() != null ? order.getPromotion().getName() : null)
                .subtotal(order.getSubtotal() != null ? order.getSubtotal() : order.getTotalAmount())
                .discountAmount(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO)
                .pointsDiscountAmount(order.getPointsDiscountAmount() != null ? order.getPointsDiscountAmount() : BigDecimal.ZERO)
                .totalAmount(order.getTotalAmount())
                .note(order.getNote())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
