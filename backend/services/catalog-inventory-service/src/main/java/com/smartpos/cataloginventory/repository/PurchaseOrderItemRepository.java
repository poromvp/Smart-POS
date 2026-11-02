package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {
    boolean existsByIngredientId(Long ingredientId);
}
