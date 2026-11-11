package com.smartpos.sales_service.config;

import com.smartpos.sales_service.entity.*;
import com.smartpos.sales_service.repository.CustomerRepository;
import com.smartpos.sales_service.repository.OrderRepository;
import com.smartpos.sales_service.repository.PointTransactionRepository;
import com.smartpos.sales_service.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final PromotionRepository promotionRepository;
    private final OrderRepository orderRepository;
    private final PointTransactionRepository pointTransactionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        initCustomers();
        initPromotions();
        initOrdersAndTransactions();
    }

    private void initCustomers() {
        log.info("Bắt đầu đồng bộ dữ liệu Khách hàng thân thiết mẫu...");
        List<Customer> customers = List.of(
                Customer.builder().phone("0988777666").fullName("Trần Văn Bình (VIP)").currentPoints(250).totalSpent(new BigDecimal("2500000")).build(),
                Customer.builder().phone("0909090909").fullName("Lê Khách Mới").currentPoints(0).totalSpent(BigDecimal.ZERO).build(),
                Customer.builder().phone("0901112233").fullName("Nguyễn Thị Minh Anh (Kim Cương)").currentPoints(1250).totalSpent(new BigDecimal("12500000")).build(),
                Customer.builder().phone("0912345678").fullName("Phạm Hoàng Nam (Vàng)").currentPoints(820).totalSpent(new BigDecimal("8200000")).build(),
                Customer.builder().phone("0987654321").fullName("Lê Thu Thảo").currentPoints(450).totalSpent(new BigDecimal("4500000")).build(),
                Customer.builder().phone("0938112244").fullName("Đặng Quốc Bảo").currentPoints(180).totalSpent(new BigDecimal("1850000")).build(),
                Customer.builder().phone("0976554433").fullName("Vũ Ngọc Hân").currentPoints(120).totalSpent(new BigDecimal("1200000")).build(),
                Customer.builder().phone("0945667788").fullName("Huỳnh Tấn Phát").currentPoints(85).totalSpent(new BigDecimal("850000")).build(),
                Customer.builder().phone("0966778899").fullName("Bùi Phương Linh").currentPoints(40).totalSpent(new BigDecimal("420000")).build(),
                Customer.builder().phone("0922334455").fullName("Trương Gia Huy").currentPoints(15).totalSpent(new BigDecimal("160000")).build()
        );

        int added = 0;
        for (Customer c : customers) {
            if (customerRepository.findByPhone(c.getPhone()).isEmpty()) {
                customerRepository.save(c);
                added++;
            }
        }
        log.info(">>> Đồng bộ Khách hàng hoàn tất (đã thêm {} mới, tổng: {})", added, customerRepository.count());
    }

    private void initPromotions() {
        log.info("Bắt đầu đồng bộ dữ liệu Khuyến mãi mẫu...");
        LocalDateTime now = LocalDateTime.now();

        List<Promotion> promotions = List.of(
                Promotion.builder()
                        .code("OPENING")
                        .name("Khai trương giảm 10% (tối đa 50k)")
                        .discountPercent(new BigDecimal("10.00"))
                        .maxDiscountAmount(new BigDecimal("50000"))
                        .minOrderAmount(new BigDecimal("50000"))
                        .startDate(now.minusMonths(1))
                        .endDate(now.plusMonths(6))
                        .usageLimit(500)
                        .usedCount(24)
                        .isActive(true)
                        .build(),
                Promotion.builder()
                        .code("VIP5")
                        .name("Khách VIP giảm 5% mọi đơn")
                        .discountPercent(new BigDecimal("5.00"))
                        .maxDiscountAmount(new BigDecimal("100000"))
                        .minOrderAmount(BigDecimal.ZERO)
                        .startDate(now.minusMonths(1))
                        .endDate(now.plusMonths(12))
                        .usageLimit(null)
                        .usedCount(42)
                        .isActive(true)
                        .build(),
                Promotion.builder()
                        .code("SUMMER20")
                        .name("Ưu đãi nhóm giảm 20% (tối đa 100k)")
                        .discountPercent(new BigDecimal("20.00"))
                        .maxDiscountAmount(new BigDecimal("100000"))
                        .minOrderAmount(new BigDecimal("200000"))
                        .startDate(now.minusWeeks(2))
                        .endDate(now.plusMonths(3))
                        .usageLimit(100)
                        .usedCount(15)
                        .isActive(true)
                        .build(),
                Promotion.builder()
                        .code("HAPPYHOUR15")
                        .name("Giờ vàng trưa giảm 15% (đơn từ 100k)")
                        .discountPercent(new BigDecimal("15.00"))
                        .maxDiscountAmount(new BigDecimal("40000"))
                        .minOrderAmount(new BigDecimal("100000"))
                        .startDate(now.minusDays(10))
                        .endDate(now.plusMonths(2))
                        .usageLimit(200)
                        .usedCount(31)
                        .isActive(true)
                        .build(),
                Promotion.builder()
                        .code("LIMITED10")
                        .name("Voucher săn deal đã hết lượt (Test)")
                        .discountPercent(new BigDecimal("30.00"))
                        .maxDiscountAmount(new BigDecimal("80000"))
                        .minOrderAmount(new BigDecimal("100000"))
                        .startDate(now.minusDays(5))
                        .endDate(now.plusDays(15))
                        .usageLimit(10)
                        .usedCount(10)
                        .isActive(true)
                        .build(),
                Promotion.builder()
                        .code("EXPIRED_OLD")
                        .name("Voucher đã hết hạn (Test)")
                        .discountPercent(new BigDecimal("15.00"))
                        .maxDiscountAmount(new BigDecimal("50000"))
                        .minOrderAmount(BigDecimal.ZERO)
                        .startDate(now.minusMonths(3))
                        .endDate(now.minusDays(5))
                        .usageLimit(100)
                        .usedCount(88)
                        .isActive(false)
                        .build()
        );

        int added = 0;
        for (Promotion p : promotions) {
            if (promotionRepository.findByCodeIgnoreCase(p.getCode()).isEmpty()) {
                promotionRepository.save(p);
                added++;
            }
        }
        log.info(">>> Đồng bộ Khuyến mãi hoàn tất (đã thêm {} mới, tổng: {})", added, promotionRepository.count());
    }

    private void initOrdersAndTransactions() {
        log.info("Bắt đầu đồng bộ Đơn hàng & Lịch sử giao dịch mẫu...");

        Customer vip1 = customerRepository.findByPhone("0988777666").orElse(null);
        Customer vip2 = customerRepository.findByPhone("0901112233").orElse(null);
        Customer vip3 = customerRepository.findByPhone("0912345678").orElse(null);
        Customer norm1 = customerRepository.findByPhone("0987654321").orElse(null);
        Customer norm2 = customerRepository.findByPhone("0938112244").orElse(null);

        Promotion promoOpening = promotionRepository.findByCodeIgnoreCase("OPENING").orElse(null);
        Promotion promoVip = promotionRepository.findByCodeIgnoreCase("VIP5").orElse(null);
        Promotion promoSummer = promotionRepository.findByCodeIgnoreCase("SUMMER20").orElse(null);
        Promotion promoHappy = promotionRepository.findByCodeIgnoreCase("HAPPYHOUR15").orElse(null);

        LocalDateTime now = LocalDateTime.now();

        // =========================================================================
        // NHÓM 1: 6 ĐƠN HÀNG ĐANG HOẠT ĐỘNG (Hiển thị ngay trên Bàn POS & KDS)
        // =========================================================================

        // 1. Bàn 1: Đơn mới từ QR/Waiter (PENDING)
        saveOrderIfNotExists("ORD-DEMO-ACT-01", 1L, "1", 9L, null, null,
                OrderType.DINE_IN, OrderStatus.PENDING, PaymentStatus.UNPAID, null,
                BigDecimal.ZERO, BigDecimal.ZERO, "Khách quét QR tại bàn 1 - Ít cay giúp",
                null, null, now.minusMinutes(5),
                List.of(
                        buildItem(1L, 2L, "Mì Cay Bò Mỹ (Cấp 3)", 2, "75000", "10000", "Trứng gà chần", null, ItemKdsStatus.PENDING, "Làm nóng giúp"),
                        buildItem(4L, 10L, "Trà Đào Cam Sả (Size L)", 2, "53000", "0", null, "70% đường, 100% đá", ItemKdsStatus.PENDING, null)
                ), 0);

        // 2. Bàn 2: Đã xác nhận (CONFIRMED), 1 món đang nấu, 1 món chờ
        saveOrderIfNotExists("ORD-DEMO-ACT-02", 2L, "2", 9L, vip1, null,
                OrderType.DINE_IN, OrderStatus.CONFIRMED, PaymentStatus.UNPAID, null,
                BigDecimal.ZERO, BigDecimal.ZERO, "Bàn 2 khách quen",
                null, null, now.minusMinutes(12),
                List.of(
                        buildItem(2L, 6L, "Mì Cay Hải Sản (Cấp 7)", 1, "90000", "25000", "Thịt bò thêm", null, ItemKdsStatus.COOKING, "Siêu cay"),
                        buildItem(3L, 7L, "Gà Sốt Cay Hàn Quốc (4 miếng)", 1, "89000", "0", null, null, ItemKdsStatus.PENDING, null)
                ), 0);

        // 3. Bàn 3: Đang chế biến (PREPARING) - nhiều trạng thái KDS
        saveOrderIfNotExists("ORD-DEMO-ACT-03", 3L, "3", 10L, null, null,
                OrderType.DINE_IN, OrderStatus.PREPARING, PaymentStatus.UNPAID, null,
                BigDecimal.ZERO, BigDecimal.ZERO, "Nhóm 4 người",
                null, null, now.minusMinutes(18),
                List.of(
                        buildItem(1L, 1L, "Mì Cay Bò Mỹ (Cấp 1)", 2, "75000", "15000", "Phô mai sợi", null, ItemKdsStatus.COOKING, null),
                        buildItem(5L, 12L, "Matcha Latte (Size L)", 2, "65000", "8000", "Trân châu đen", "50% đường, 50% đá", ItemKdsStatus.SERVED, null)
                ), 0);

        // 4. Bàn 5: Món đã làm xong (READY) chờ mang ra & thanh toán
        saveOrderIfNotExists("ORD-DEMO-ACT-04", 5L, "5", 7L, norm1, null,
                OrderType.DINE_IN, OrderStatus.READY, PaymentStatus.UNPAID, null,
                BigDecimal.ZERO, BigDecimal.ZERO, "Bàn 5 gần cửa sổ",
                null, null, now.minusMinutes(25),
                List.of(
                        buildItem(2L, 5L, "Mì Cay Hải Sản (Cấp 3)", 1, "85000", "15000", "Xúc xích Đức", null, ItemKdsStatus.READY, null),
                        buildItem(6L, null, "Cà Phê Sữa Đá", 1, "35000", "0", null, "100% đường, 100% đá", ItemKdsStatus.READY, null)
                ), 0);

        // 5. Bàn 8: Đã phục vụ hết (SERVED), chuẩn bị thanh toán
        saveOrderIfNotExists("ORD-DEMO-ACT-05", 8L, "8", 7L, vip2, null,
                OrderType.DINE_IN, OrderStatus.SERVED, PaymentStatus.UNPAID, null,
                BigDecimal.ZERO, BigDecimal.ZERO, "Khách VIP đang dùng bữa",
                null, null, now.minusMinutes(35),
                List.of(
                        buildItem(1L, 2L, "Mì Cay Bò Mỹ (Cấp 3)", 2, "75000", "25000", "Thịt bò thêm", null, ItemKdsStatus.SERVED, null),
                        buildItem(3L, 8L, "Gà Sốt Cay Hàn Quốc (8 miếng)", 1, "149000", "0", null, null, ItemKdsStatus.SERVED, null),
                        buildItem(4L, 9L, "Trà Đào Cam Sả (Size M)", 3, "45000", "8000", "Thạch nha đam", "70% đường, 50% đá", ItemKdsStatus.SERVED, null)
                ), 0);

        // 6. Đơn Mang về (TAKEAWAY) đang chuẩn bị
        saveOrderIfNotExists("ORD-DEMO-ACT-06", null, null, 8L, null, null,
                OrderType.TAKEAWAY, OrderStatus.PREPARING, PaymentStatus.UNPAID, null,
                BigDecimal.ZERO, BigDecimal.ZERO, "Khách mang về đứng đợi tại quầy",
                null, null, now.minusMinutes(8),
                List.of(
                        buildItem(6L, null, "Cà Phê Sữa Đá", 2, "35000", "0", null, "50% đường, 100% đá", ItemKdsStatus.COOKING, null),
                        buildItem(4L, 10L, "Trà Đào Cam Sả (Size L)", 1, "53000", "10000", "Miếng đào giòn thêm", "100% đường, 50% đá", ItemKdsStatus.PENDING, null)
                ), 0);

        // =========================================================================
        // NHÓM 2: 4 ĐƠN HOÀN TẤT HÔM NAY (Hiển thị báo cáo Today)
        // =========================================================================
        saveOrderIfNotExists("ORD-DEMO-TD-01", 4L, "4", 7L, vip1, promoVip,
                OrderType.DINE_IN, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.VIETQR,
                new BigDecimal("11000"), BigDecimal.ZERO, "Khách thanh toán VietQR buổi sáng",
                null, null, now.minusHours(4),
                List.of(
                        buildItem(1L, 2L, "Mì Cay Bò Mỹ (Cấp 3)", 2, "75000", "10000", "Trứng gà chần", null, ItemKdsStatus.SERVED, null),
                        buildItem(6L, null, "Cà Phê Sữa Đá", 2, "35000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 24);

        saveOrderIfNotExists("ORD-DEMO-TD-02", 6L, "6", 7L, vip2, promoSummer,
                OrderType.DINE_IN, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.CREDIT_CARD,
                new BigDecimal("65800"), new BigDecimal("20000"), "Thanh toán thẻ + đổi 20 điểm",
                null, null, now.minusHours(3),
                List.of(
                        buildItem(2L, 5L, "Mì Cay Hải Sản (Cấp 3)", 2, "85000", "15000", "Phô mai sợi", null, ItemKdsStatus.SERVED, null),
                        buildItem(3L, 7L, "Gà Sốt Cay Hàn Quốc (4 miếng)", 1, "89000", "0", null, null, ItemKdsStatus.SERVED, null),
                        buildItem(5L, 11L, "Matcha Latte (Size M)", 2, "55000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 31);

        saveOrderIfNotExists("ORD-DEMO-TD-03", null, null, 8L, norm2, promoOpening,
                OrderType.TAKEAWAY, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.CASH,
                new BigDecimal("18000"), BigDecimal.ZERO, "Đơn mang về trưa",
                null, null, now.minusHours(2),
                List.of(
                        buildItem(4L, 10L, "Trà Đào Cam Sả (Size L)", 2, "53000", "8000", "Thạch nha đam", null, ItemKdsStatus.SERVED, null),
                        buildItem(5L, 12L, "Matcha Latte (Size L)", 1, "65000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 16);

        saveOrderIfNotExists("ORD-DEMO-TD-04", 10L, "10", 8L, vip3, promoHappy,
                OrderType.DINE_IN, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.VIETQR,
                new BigDecimal("36000"), BigDecimal.ZERO, "Bàn 10 thanh toán tiền bàn buổi trưa",
                null, null, now.minusHours(1),
                List.of(
                        buildItem(1L, 3L, "Mì Cay Bò Mỹ (Cấp 7)", 2, "80000", "0", null, null, ItemKdsStatus.SERVED, null),
                        buildItem(4L, 9L, "Trà Đào Cam Sả (Size M)", 2, "45000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 21);

        // =========================================================================
        // NHÓM 3: 6 ĐƠN HOÀN TẤT HÔM QUA / TUẦN NÀY / THÁNG NÀY (Biểu đồ lịch sử)
        // =========================================================================
        saveOrderIfNotExists("ORD-DEMO-YD-01", 12L, "12", 7L, vip1, promoOpening,
                OrderType.DINE_IN, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.CASH,
                new BigDecimal("22500"), BigDecimal.ZERO, "Hóa đơn ngày hôm qua",
                null, null, now.minusDays(1).minusHours(3),
                List.of(
                        buildItem(2L, 5L, "Mì Cay Hải Sản (Cấp 3)", 2, "85000", "0", null, null, ItemKdsStatus.SERVED, null),
                        buildItem(5L, 11L, "Matcha Latte (Size M)", 1, "55000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 20);

        saveOrderIfNotExists("ORD-DEMO-YD-02", 14L, "14", 8L, norm1, null,
                OrderType.DINE_IN, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.VIETQR,
                BigDecimal.ZERO, BigDecimal.ZERO, "Khách lẻ hôm qua",
                null, null, now.minusDays(1).minusHours(1),
                List.of(
                        buildItem(3L, 8L, "Gà Sốt Cay Hàn Quốc (8 miếng)", 1, "149000", "0", null, null, ItemKdsStatus.SERVED, null),
                        buildItem(6L, null, "Cà Phê Sữa Đá", 2, "35000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 21);

        saveOrderIfNotExists("ORD-DEMO-WK-01", 15L, "15", 7L, vip2, promoSummer,
                OrderType.DINE_IN, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.CREDIT_CARD,
                new BigDecimal("74000"), BigDecimal.ZERO, "Tiệc sinh nhật mini trong tuần",
                null, null, now.minusDays(3),
                List.of(
                        buildItem(1L, 2L, "Mì Cay Bò Mỹ (Cấp 3)", 3, "75000", "15000", "Xúc xích Đức", null, ItemKdsStatus.SERVED, null),
                        buildItem(4L, 10L, "Trà Đào Cam Sả (Size L)", 2, "53000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 30);

        saveOrderIfNotExists("ORD-DEMO-WK-02", 7L, "7", 8L, vip3, null,
                OrderType.DINE_IN, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.CASH,
                BigDecimal.ZERO, BigDecimal.ZERO, "Hóa đơn 5 ngày trước",
                null, null, now.minusDays(5),
                List.of(
                        buildItem(2L, 4L, "Mì Cay Hải Sản (Cấp 1)", 2, "85000", "0", null, null, ItemKdsStatus.SERVED, null),
                        buildItem(5L, 12L, "Matcha Latte (Size L)", 2, "65000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 30);

        saveOrderIfNotExists("ORD-DEMO-MO-01", 18L, "18", 7L, vip1, promoVip,
                OrderType.DINE_IN, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.VIETQR,
                new BigDecimal("14000"), BigDecimal.ZERO, "Đơn cách đây 9 ngày",
                null, null, now.minusDays(9),
                List.of(
                        buildItem(1L, 1L, "Mì Cay Bò Mỹ (Cấp 1)", 2, "75000", "0", null, null, ItemKdsStatus.SERVED, null),
                        buildItem(3L, 7L, "Gà Sốt Cay Hàn Quốc (4 miếng)", 1, "89000", "0", null, null, ItemKdsStatus.SERVED, null),
                        buildItem(6L, null, "Cà Phê Sữa Đá", 1, "35000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 26);

        saveOrderIfNotExists("ORD-DEMO-MO-02", null, null, 8L, norm2, null,
                OrderType.TAKEAWAY, OrderStatus.COMPLETED, PaymentStatus.PAID, PaymentMethod.CASH,
                BigDecimal.ZERO, BigDecimal.ZERO, "Đơn mang về cách đây 14 ngày",
                null, null, now.minusDays(14),
                List.of(
                        buildItem(4L, 9L, "Trà Đào Cam Sả (Size M)", 3, "45000", "0", null, null, ItemKdsStatus.SERVED, null)
                ), 13);

        // =========================================================================
        // NHÓM 4: 2 ĐƠN ĐÃ HỦY (CANCELLED)
        // =========================================================================
        saveOrderIfNotExists("ORD-DEMO-CAN-01", 9L, "9", 7L, null, null,
                OrderType.DINE_IN, OrderStatus.CANCELLED, PaymentStatus.UNPAID, null,
                BigDecimal.ZERO, BigDecimal.ZERO, "Khách đặt nhầm bàn",
                "Khách chuyển sang ngồi bàn khác và đặt lại đơn mới", "cashier01", now.minusHours(5),
                List.of(
                        buildItem(1L, 1L, "Mì Cay Bò Mỹ (Cấp 1)", 1, "75000", "0", null, null, ItemKdsStatus.PENDING, null)
                ), 0);

        saveOrderIfNotExists("ORD-DEMO-CAN-02", null, null, 8L, null, null,
                OrderType.TAKEAWAY, OrderStatus.CANCELLED, PaymentStatus.UNPAID, null,
                BigDecimal.ZERO, BigDecimal.ZERO, null,
                "Khách có việc đột xuất xin hủy trước khi chế biến", "admin", now.minusDays(2),
                List.of(
                        buildItem(5L, 11L, "Matcha Latte (Size M)", 2, "55000", "0", null, null, ItemKdsStatus.PENDING, null)
                ), 0);

        log.info(">>> Đồng bộ Đơn hàng mẫu hoàn tất! Tổng số đơn hiện có: {}", orderRepository.count());
    }

    private OrderItem buildItem(Long productId, Long variantId, String name, int quantity,
                                String unitPriceStr, String modifierTotalStr,
                                String toppings, String sweetness, ItemKdsStatus kdsStatus, String note) {
        BigDecimal unitPrice = new BigDecimal(unitPriceStr);
        BigDecimal modifierTotal = new BigDecimal(modifierTotalStr);
        BigDecimal totalPrice = unitPrice.add(modifierTotal).multiply(BigDecimal.valueOf(quantity));

        return OrderItem.builder()
                .productId(productId)
                .variantId(variantId)
                .itemId(String.valueOf(productId))
                .name(name)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .modifierTotal(modifierTotal)
                .totalPrice(totalPrice)
                .modifierOptionIds(new ArrayList<>())
                .toppings(toppings)
                .sweetness(sweetness)
                .kdsStatus(kdsStatus)
                .note(note)
                .build();
    }

    private void saveOrderIfNotExists(String orderCode, Long tableId, String tableNumber, Long staffId,
                                      Customer customer, Promotion promotion, OrderType orderType,
                                      OrderStatus status, PaymentStatus paymentStatus, PaymentMethod paymentMethod,
                                      BigDecimal discountAmount, BigDecimal pointsDiscountAmount, String note,
                                      String cancelReason, String cancelledBy, LocalDateTime createdAt,
                                      List<OrderItem> items, int pointsEarned) {
        if (orderRepository.findByOrderCode(orderCode).isPresent()) {
            return;
        }

        BigDecimal subtotal = items.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmount = subtotal.subtract(discountAmount).subtract(pointsDiscountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        Order order = Order.builder()
                .orderCode(orderCode)
                .tableId(tableId)
                .tableNumber(tableNumber)
                .staffId(staffId)
                .customer(customer)
                .promotion(promotion)
                .orderType(orderType)
                .status(status)
                .paymentStatus(paymentStatus)
                .paymentMethod(paymentMethod)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .pointsDiscountAmount(pointsDiscountAmount)
                .totalAmount(totalAmount)
                .note(note)
                .cancelReason(cancelReason)
                .cancelledBy(cancelledBy)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();

        for (OrderItem item : items) {
            item.setCreatedAt(createdAt);
            order.addItem(item);
        }

        Order savedOrder = orderRepository.save(order);

        if (customer != null && pointsEarned > 0) {
            pointTransactionRepository.save(PointTransaction.builder()
                    .customer(customer)
                    .order(savedOrder)
                    .pointsChange(pointsEarned)
                    .type("EARN")
                    .createdAt(createdAt)
                    .build());
        }
        if (customer != null && pointsDiscountAmount != null && pointsDiscountAmount.compareTo(BigDecimal.ZERO) > 0) {
            int redeemed = pointsDiscountAmount.divideToIntegralValue(BigDecimal.valueOf(1000)).intValue();
            if (redeemed > 0) {
                pointTransactionRepository.save(PointTransaction.builder()
                        .customer(customer)
                        .order(savedOrder)
                        .pointsChange(-redeemed)
                        .type("REDEEM")
                        .createdAt(createdAt)
                        .build());
            }
        }
    }
}
