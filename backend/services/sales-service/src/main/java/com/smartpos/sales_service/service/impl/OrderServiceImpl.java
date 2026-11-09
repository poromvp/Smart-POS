package com.smartpos.sales_service.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.client.dto.DeductInventoryRequest;
import com.smartpos.sales_service.client.dto.DeductInventoryResponse;
import com.smartpos.sales_service.client.dto.DeductItemRequest;
import com.smartpos.sales_service.dto.request.CheckoutOrderRequest;
import com.smartpos.sales_service.dto.request.CreateOrderItemRequest;
import com.smartpos.sales_service.dto.request.CreateOrderRequest;
import com.smartpos.sales_service.dto.request.UpdatePaymentRequest;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.OrderItemResponse;
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
import com.smartpos.sales_service.service.OrderService;
import feign.FeignException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    private void publishOrderEvent(OrderResponse response) {
        if (messagingTemplate != null && response != null) {
            try {
                messagingTemplate.convertAndSend("/topic/orders", response);
                messagingTemplate.convertAndSend("/topic/kds", response);
                if (response.getTableNumber() != null && !response.getTableNumber().isBlank()) {
                    messagingTemplate.convertAndSend("/topic/tables/" + response.getTableNumber(), response);
                }
            } catch (Exception e) {
                log.warn("Không thể gửi thông điệp WebSocket: {}", e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        String orderCode = generateOrderCode();

        Long staffId = request.getStaffId();
        if (staffId == null) {
            UserContext ctx = UserContextHolder.getContext();
            if (ctx != null && ctx.getUserId() != null) {
                try {
                    staffId = Long.parseLong(ctx.getUserId());
                } catch (NumberFormatException ignored) {
                }
            }
        }

        Order order = Order.builder()
                .orderCode(orderCode)
                .tableId(request.getTableId())
                .tableNumber(request.getTableNumber())
                .staffId(staffId)
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
                    .kdsStatus(ItemKdsStatus.PENDING)
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
        OrderResponse response = mapToOrderResponse(savedOrder);
        publishOrderEvent(response);
        return response;
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
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getPagedOrders(OrderStatus status,
                                                       String tableNumber,
                                                       LocalDateTime startDate,
                                                       LocalDateTime endDate,
                                                       String search,
                                                       int page,
                                                       int size,
                                                       String sort) {
        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (tableNumber != null && !tableNumber.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("tableNumber")), tableNumber.trim().toLowerCase()));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate orderCodeMatch = cb.like(cb.lower(root.get("orderCode")), pattern);
                Predicate tableMatch = cb.like(cb.lower(root.get("tableNumber")), pattern);

                Join<Order, Customer> customerJoin = root.join("customer", JoinType.LEFT);
                Predicate customerNameMatch = cb.like(cb.lower(customerJoin.get("fullName")), pattern);
                Predicate customerPhoneMatch = cb.like(cb.lower(customerJoin.get("phone")), pattern);

                predicates.add(cb.or(orderCodeMatch, tableMatch, customerNameMatch, customerPhoneMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String property = parts[0].trim();
            Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;
            sortObj = Sort.by(direction, property);
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sortObj);
        Page<Order> orderPage = orderRepository.findAll(spec, pageable);

        List<OrderResponse> responses = orderPage.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
                .content(responses)
                .pageNumber(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        OrderStatus oldStatus = order.getStatus();

        // Kiểm soát State Machine (hỗ trợ Idempotency)
        if (oldStatus == OrderStatus.COMPLETED) {
            if (status == OrderStatus.COMPLETED) {
                return mapToOrderResponse(orderRepository.save(order));
            }
            throw new BusinessException("Không thể thay đổi trạng thái của đơn hàng đã hoàn tất.");
        }
        if (oldStatus == OrderStatus.CANCELLED) {
            if (status == OrderStatus.CANCELLED) {
                return mapToOrderResponse(orderRepository.save(order));
            }
            throw new BusinessException("Không thể thay đổi trạng thái của đơn hàng đã bị hủy.");
        }

        order.setStatus(status);

        // Tự động kích hoạt trừ kho và xử lý tích điểm/voucher khi đơn hàng chuyển sang trạng thái COMPLETED
        if (status == OrderStatus.COMPLETED) {
            deductInventoryForOrder(order);
            processLoyaltyAndPromotion(order);
        }

        Order updated = orderRepository.save(order);
        OrderResponse response = mapToOrderResponse(updated);
        publishOrderEvent(response);
        return response;
    }

    @Override
    @Transactional
    public OrderResponse completeOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        OrderStatus oldStatus = order.getStatus();
        if (oldStatus == OrderStatus.COMPLETED) {
            return mapToOrderResponse(order);
        }
        if (oldStatus == OrderStatus.CANCELLED) {
            throw new BusinessException("Không thể hoàn tất đơn hàng đã bị hủy.");
        }

        order.setStatus(OrderStatus.COMPLETED);
        deductInventoryForOrder(order);
        processLoyaltyAndPromotion(order);

        Order updated = orderRepository.save(order);
        OrderResponse response = mapToOrderResponse(updated);
        publishOrderEvent(response);
        return response;
    }

    @Override
    @Transactional
    public OrderResponse checkoutOrder(Long id, CheckoutOrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BusinessException("Đơn hàng đã được thanh toán và hoàn tất trước đó.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Không thể thanh toán đơn hàng đã bị hủy.");
        }

        if (request.getStaffId() != null) {
            order.setStaffId(request.getStaffId());
        }

        // 1. Gắn hoặc cập nhật khách hàng
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        } else if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            String phone = request.getCustomerPhone().trim();
            customer = customerRepository.findByPhone(phone).orElseGet(() ->
                    customerRepository.save(Customer.builder()
                            .phone(phone)
                            .fullName("Khách hàng " + phone)
                            .currentPoints(0)
                            .totalSpent(BigDecimal.ZERO)
                            .build())
            );
        } else if (order.getCustomer() != null) {
            customer = order.getCustomer();
        }

        if (customer != null) {
            order.setCustomer(customer);
        }

        // Đảm bảo subtotal chính xác từ items
        BigDecimal subtotal = order.getSubtotal();
        if (subtotal == null || subtotal.compareTo(BigDecimal.ZERO) == 0) {
            subtotal = order.getItems().stream()
                    .map(i -> (i.getUnitPrice().add(i.getModifierTotal() != null ? i.getModifierTotal() : BigDecimal.ZERO))
                            .multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setSubtotal(subtotal);
        }

        // 2. Xử lý Voucher / Promotion
        String promoCode = request.getPromotionCode();
        if (promoCode == null && order.getPromotion() != null) {
            promoCode = order.getPromotion().getCode();
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (promoCode != null && !promoCode.isBlank()) {
            String code = promoCode.trim();
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
                }
            }
        }
        order.setDiscountAmount(discountAmount);

        // 3. Xử lý điểm tích lũy
        BigDecimal pointsDiscountAmount = BigDecimal.ZERO;
        if (customer != null && request.getPointsToRedeem() != null && request.getPointsToRedeem() > 0) {
            int availablePoints = customer.getCurrentPoints() != null ? customer.getCurrentPoints() : 0;
            int pointsToUse = Math.min(request.getPointsToRedeem(), availablePoints);

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
        order.setPointsDiscountAmount(pointsDiscountAmount);

        // 4. Tổng thanh toán
        BigDecimal totalAmount = subtotal.subtract(discountAmount).subtract(pointsDiscountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }
        order.setTotalAmount(totalAmount);

        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setStatus(OrderStatus.COMPLETED);

        // Đánh dấu tất cả món ăn sang SERVED nếu trước đó chưa hoàn tất
        for (OrderItem item : order.getItems()) {
            if (item.getKdsStatus() != ItemKdsStatus.SERVED) {
                item.setKdsStatus(ItemKdsStatus.SERVED);
            }
        }

        deductInventoryForOrder(order);
        processLoyaltyAndPromotion(order);

        Order updated = orderRepository.save(order);
        OrderResponse response = mapToOrderResponse(updated);
        publishOrderEvent(response);
        return response;
    }

    @Override
    @Transactional
    public OrderResponse addItemsToOrder(Long id, List<CreateOrderItemRequest> newItems) {
        if (newItems == null || newItems.isEmpty()) {
            throw new BusinessException("Danh sách món ăn thêm mới không được rỗng.");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Không thể thêm món vào đơn hàng đã hoàn tất hoặc đã bị hủy.");
        }

        BigDecimal addedSubtotal = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemReq : newItems) {
            BigDecimal modifierTotal = itemReq.getModifierTotal() != null ? itemReq.getModifierTotal() : BigDecimal.ZERO;
            BigDecimal itemTotal = itemReq.getBasePrice().add(modifierTotal)
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            addedSubtotal = addedSubtotal.add(itemTotal);

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
                    .kdsStatus(ItemKdsStatus.PENDING)
                    .build();

            order.addItem(orderItem);
        }

        BigDecimal newSubtotal = (order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO).add(addedSubtotal);
        order.setSubtotal(newSubtotal);

        // Tính lại chiết khấu voucher nếu có
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (order.getPromotion() != null) {
            Promotion promotion = order.getPromotion();
            BigDecimal calculated = newSubtotal.multiply(promotion.getDiscountPercent())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            if (promotion.getMaxDiscountAmount() != null && calculated.compareTo(promotion.getMaxDiscountAmount()) > 0) {
                calculated = promotion.getMaxDiscountAmount();
            }
            discountAmount = calculated;
        }
        order.setDiscountAmount(discountAmount);

        BigDecimal pointsDiscount = order.getPointsDiscountAmount() != null ? order.getPointsDiscountAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = newSubtotal.subtract(discountAmount).subtract(pointsDiscount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }
        order.setTotalAmount(totalAmount);

        // Nếu đơn hàng đang ở trạng thái READY, chuyển về PREPARING vì có món mới cần chế biến
        if (order.getStatus() == OrderStatus.READY) {
            order.setStatus(OrderStatus.PREPARING);
        }

        Order updated = orderRepository.save(order);
        OrderResponse response = mapToOrderResponse(updated);
        publishOrderEvent(response);
        return response;
    }

    @Override
    @Transactional
    public OrderResponse updateOrderItemKdsStatus(Long orderId, Long itemId, ItemKdsStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + orderId));

        OrderItem targetItem = order.getItems().stream()
                .filter(i -> i.getId() != null && i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID " + itemId + " trong đơn hàng " + orderId));

        targetItem.setKdsStatus(status);

        boolean allReadyOrServed = order.getItems().stream()
                .allMatch(i -> i.getKdsStatus() == ItemKdsStatus.READY || i.getKdsStatus() == ItemKdsStatus.SERVED);
        boolean anyCooking = order.getItems().stream()
                .anyMatch(i -> i.getKdsStatus() == ItemKdsStatus.COOKING);

        if (allReadyOrServed) {
            if (order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.CANCELLED) {
                order.setStatus(OrderStatus.READY);
            }
        } else if (anyCooking) {
            if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.CONFIRMED) {
                order.setStatus(OrderStatus.PREPARING);
            }
        }

        Order updated = orderRepository.save(order);
        OrderResponse response = mapToOrderResponse(updated);
        publishOrderEvent(response);
        return response;
    }

    @Override
    @Transactional
    public OrderResponse updatePayment(Long id, UpdatePaymentRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Không thể cập nhật thanh toán cho đơn hàng đã bị hủy.");
        }

        order.setPaymentStatus(request.getPaymentStatus());
        if (request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod());
        }
        Order updated = orderRepository.save(order);
        OrderResponse response = mapToOrderResponse(updated);
        publishOrderEvent(response);
        return response;
    }

    @Override
    @Transactional
    public void cancelOrder(Long id) {
        cancelOrder(id, "Hủy theo yêu cầu của nhân viên/khách hàng");
    }

    @Override
    @Transactional
    public void cancelOrder(Long id, String reason) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BusinessException("Không thể hủy đơn hàng đã hoàn tất và thanh toán.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(reason);

        UserContext ctx = UserContextHolder.getContext();
        order.setCancelledBy(ctx != null && ctx.getUsername() != null ? ctx.getUsername() : "Staff");

        Order saved = orderRepository.save(order);
        OrderResponse response = mapToOrderResponse(saved);
        publishOrderEvent(response);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesStatisticsResponse getSalesStatistics(String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        LocalDateTime end = now;

        String p = period != null ? period.toLowerCase().trim() : "today";
        switch (p) {
            case "yesterday":
                start = now.minusDays(1).with(LocalTime.MIN);
                end = now.minusDays(1).with(LocalTime.MAX);
                break;
            case "week":
                start = now.minusDays(7).with(LocalTime.MIN);
                break;
            case "month":
                start = now.withDayOfMonth(1).with(LocalTime.MIN);
                break;
            case "today":
            default:
                start = now.with(LocalTime.MIN);
                break;
        }

        List<Order> completedOrders = orderRepository.findCompletedOrdersBetween(OrderStatus.COMPLETED, start, end);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOrders = completedOrders.size();

        Map<String, ItemAggregator> topItemMap = new HashMap<>();
        Map<Integer, SalesStatisticsResponse.HourlyRevenueDto> hourlyMap = new HashMap<>();

        for (int h = 0; h < 24; h++) {
            hourlyMap.put(h, SalesStatisticsResponse.HourlyRevenueDto.builder()
                    .hour(h)
                    .revenue(BigDecimal.ZERO)
                    .orderCount(0)
                    .build());
        }

        for (Order order : completedOrders) {
            BigDecimal amt = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(amt);

            int hour = order.getCreatedAt() != null ? order.getCreatedAt().getHour() : 0;
            SalesStatisticsResponse.HourlyRevenueDto hrDto = hourlyMap.get(hour);
            if (hrDto != null) {
                hrDto.setRevenue(hrDto.getRevenue().add(amt));
                hrDto.setOrderCount(hrDto.getOrderCount() + 1);
            }

            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    String name = item.getName();
                    int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                    BigDecimal price = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;

                    topItemMap.compute(name, (k, v) -> {
                        if (v == null) {
                            return new ItemAggregator(name, qty, price);
                        }
                        v.quantity += qty;
                        v.revenue = v.revenue.add(price);
                        return v;
                    });
                }
            }
        }

        BigDecimal averageOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<SalesStatisticsResponse.TopSellingItemDto> topSellingItems = topItemMap.values().stream()
                .sorted((a, b) -> Long.compare(b.quantity, a.quantity))
                .limit(10)
                .map(b -> SalesStatisticsResponse.TopSellingItemDto.builder()
                        .name(b.name)
                        .quantity(b.quantity)
                        .revenue(b.revenue)
                        .build())
                .collect(Collectors.toList());

        List<SalesStatisticsResponse.HourlyRevenueDto> hourlyRevenue = new ArrayList<>(hourlyMap.values());
        hourlyRevenue.sort(Comparator.comparingInt(SalesStatisticsResponse.HourlyRevenueDto::getHour));

        return SalesStatisticsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .averageOrderValue(averageOrderValue)
                .topSellingItems(topSellingItems)
                .hourlyRevenue(hourlyRevenue)
                .build();
    }

    private static class ItemAggregator {
        String name;
        long quantity;
        BigDecimal revenue;

        ItemAggregator(String name, long quantity, BigDecimal revenue) {
            this.name = name;
            this.quantity = quantity;
            this.revenue = revenue;
        }
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
                            .kdsStatus(item.getKdsStatus())
                            .createdAt(item.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .tableId(order.getTableId())
                .tableNumber(order.getTableNumber())
                .staffId(order.getStaffId())
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
                .cancelReason(order.getCancelReason())
                .cancelledBy(order.getCancelledBy())
                .version(order.getVersion())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
