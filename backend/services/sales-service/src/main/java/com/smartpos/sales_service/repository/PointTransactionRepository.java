package com.smartpos.sales_service.repository;

import com.smartpos.sales_service.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<PointTransaction> findByOrderId(Long orderId);
}
