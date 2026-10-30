package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.InventoryTransaction;
import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    boolean existsByIngredientId(Long ingredientId);

    boolean existsByOrderCodeAndTransactionType(String orderCode, InventoryTransactionType transactionType);
}
