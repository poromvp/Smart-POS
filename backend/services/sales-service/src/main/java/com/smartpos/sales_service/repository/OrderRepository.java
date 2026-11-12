package com.smartpos.sales_service.repository;

import com.smartpos.sales_service.entity.Order;
import com.smartpos.sales_service.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByOrderCode(String orderCode);

    List<Order> findByTableNumber(String tableNumber);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByTableNumberAndStatusNot(String tableNumber, OrderStatus status);

    List<Order> findByTableNumberAndStatusNotIn(String tableNumber, List<OrderStatus> statuses);

    @Query("SELECT o FROM Order o WHERE o.status = :status AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    List<Order> findCompletedOrdersBetween(@Param("status") OrderStatus status,
                                          @Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);
}
