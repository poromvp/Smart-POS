package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.InventoryTransaction;
import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long>, JpaSpecificationExecutor<InventoryTransaction> {

    boolean existsByIngredientId(Long ingredientId);

    boolean existsByOrderCodeAndTransactionType(String orderCode, InventoryTransactionType transactionType);

    @Override
    @EntityGraph(attributePaths = {"ingredient"})
    List<InventoryTransaction> findAll(Specification<InventoryTransaction> spec, Sort sort);
}
