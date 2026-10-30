package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.PurchaseOrder;
import com.smartpos.cataloginventory.domain.PurchaseOrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    boolean existsBySupplierId(Long supplierId);

    boolean existsByPoNumber(String poNumber);

    Optional<PurchaseOrder> findByPoNumber(String poNumber);

    @EntityGraph(attributePaths = {"supplier", "items", "items.ingredient"})
    Optional<PurchaseOrder> findWithDetailsById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"supplier", "items", "items.ingredient"})
    @Query("SELECT po FROM PurchaseOrder po WHERE po.id = :id")
    Optional<PurchaseOrder> findWithDetailsByIdWithLock(@Param("id") Long id);


    @EntityGraph(attributePaths = {"supplier", "items", "items.ingredient"})
    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(:status IS NULL OR po.status = :status) AND " +
           "(:supplierId IS NULL OR po.supplier.id = :supplierId) AND " +
           "(:fromDate IS NULL OR po.orderDate >= :fromDate) AND " +
           "(:toDate IS NULL OR po.orderDate <= :toDate) " +
           "ORDER BY po.id DESC")
    List<PurchaseOrder> searchPurchaseOrders(
            @Param("status") PurchaseOrderStatus status,
            @Param("supplierId") Long supplierId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
}
