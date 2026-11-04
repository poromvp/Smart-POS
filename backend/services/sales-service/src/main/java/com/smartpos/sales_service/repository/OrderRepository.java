package com.smartpos.sales_service.repository;

import com.smartpos.sales_service.entity.Order;
import com.smartpos.sales_service.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);

    List<Order> findByTableNumber(String tableNumber);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByTableNumberAndStatusNot(String tableNumber, OrderStatus status);
}
