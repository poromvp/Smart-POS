package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.PurchaseOrder;
import com.smartpos.cataloginventory.domain.PurchaseOrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long>, JpaSpecificationExecutor<PurchaseOrder> {

    boolean existsBySupplierId(Long supplierId);

    boolean existsByPoNumber(String poNumber);

    Optional<PurchaseOrder> findByPoNumber(String poNumber);

    @EntityGraph(attributePaths = {"supplier", "items", "items.ingredient"})
    Optional<PurchaseOrder> findWithDetailsById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"supplier", "items", "items.ingredient"})
    @Query("SELECT po FROM PurchaseOrder po WHERE po.id = :id")
    Optional<PurchaseOrder> findWithDetailsByIdWithLock(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = {"supplier", "items", "items.ingredient"})
    List<PurchaseOrder> findAll(Specification<PurchaseOrder> spec, Sort sort);
}
