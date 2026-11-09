package com.smartpos.sales_service.service;

import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.entity.Order;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.entity.OrderType;
import com.smartpos.sales_service.repository.OrderRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ActiveProfiles("test")
@SpringBootTest
class OrderOptimisticLockingTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockitoBean
    private InventoryClient inventoryClient;

    @AfterEach
    void tearDown() {
        orderRepository.deleteAll();
    }

    @Test
    @DisplayName("Hai giao dịch đồng thời cập nhật cùng một đơn hàng, giao dịch sau bị chặn bởi ObjectOptimisticLockingFailureException")
    void testOptimisticLocking_ConcurrentUpdates_ThrowsOptimisticLockException() {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        // 1. Tạo đơn hàng ban đầu với version = 0
        Long orderId = txTemplate.execute(status -> {
            Order order = Order.builder()
                    .orderCode("ORD-LOCK-001")
                    .tableNumber("12")
                    .orderType(OrderType.DINE_IN)
                    .status(OrderStatus.PENDING)
                    .totalAmount(new BigDecimal("100000"))
                    .note("Gốc")
                    .build();
            return orderRepository.saveAndFlush(order).getId();
        });

        // 2. Transaction 1 đọc đơn hàng (version = 0)
        Order orderTx1 = txTemplate.execute(status -> orderRepository.findById(orderId).orElseThrow());
        assertThat(orderTx1.getVersion()).isEqualTo(0L);

        // 3. Transaction 2 đọc cùng đơn hàng (version = 0), cập nhật và commit thành công (version nhảy lên 1)
        txTemplate.execute(status -> {
            Order orderTx2 = orderRepository.findById(orderId).orElseThrow();
            assertThat(orderTx2.getVersion()).isEqualTo(0L);
            orderTx2.setStatus(OrderStatus.CONFIRMED);
            orderTx2.setNote("Được duyệt bởi Thu ngân 1");
            return orderRepository.saveAndFlush(orderTx2);
        });

        // Xác nhận trong DB version đã là 1
        Order afterTx2 = txTemplate.execute(status -> orderRepository.findById(orderId).orElseThrow());
        assertThat(afterTx2.getVersion()).isEqualTo(1L);
        assertThat(afterTx2.getStatus()).isEqualTo(OrderStatus.CONFIRMED);

        // 4. Transaction 1 (với bản copy cũ version = 0) cố tình cập nhật -> Phải bị ném ngoại lệ khóa lạc quan
        orderTx1.setStatus(OrderStatus.CANCELLED);
        orderTx1.setNote("Cố tình hủy bởi Thu ngân 2");

        assertThatThrownBy(() -> txTemplate.execute(status -> orderRepository.saveAndFlush(orderTx1)))
                .isInstanceOf(ObjectOptimisticLockingFailureException.class);
    }

    @Test
    @DisplayName("Khi xảy ra xung đột khóa lạc quan, giao dịch thất bại được rollback và bảo toàn dữ liệu của giao dịch thành công trước")
    void testOptimisticLocking_Rollback_PreservesCommittedData() {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        Long orderId = txTemplate.execute(status -> {
            Order order = Order.builder()
                    .orderCode("ORD-LOCK-002")
                    .tableNumber("05")
                    .orderType(OrderType.DINE_IN)
                    .status(OrderStatus.PENDING)
                    .totalAmount(new BigDecimal("200000"))
                    .note("Bản đầu")
                    .build();
            return orderRepository.saveAndFlush(order).getId();
        });

        Order staleOrder = txTemplate.execute(status -> orderRepository.findById(orderId).orElseThrow());

        // Update hợp lệ lần 1
        txTemplate.execute(status -> {
            Order freshOrder = orderRepository.findById(orderId).orElseThrow();
            freshOrder.setStatus(OrderStatus.PREPARING);
            freshOrder.setNote("Đang nấu");
            return orderRepository.saveAndFlush(freshOrder);
        });

        // Giao dịch xung đột thất bại
        staleOrder.setNote("Ghi đè sai");
        try {
            txTemplate.execute(status -> orderRepository.saveAndFlush(staleOrder));
        } catch (ObjectOptimisticLockingFailureException ignored) {
            // Mong đợi ngoại lệ xảy ra
        }

        // Kiểm tra dữ liệu trong DB sau rollback: Vẫn giữ nguyên trạng thái từ lần update hợp lệ
        Order finalOrder = txTemplate.execute(status -> orderRepository.findById(orderId).orElseThrow());
        assertThat(finalOrder.getVersion()).isEqualTo(1L);
        assertThat(finalOrder.getStatus()).isEqualTo(OrderStatus.PREPARING);
        assertThat(finalOrder.getNote()).isEqualTo("Đang nấu");
    }
}
