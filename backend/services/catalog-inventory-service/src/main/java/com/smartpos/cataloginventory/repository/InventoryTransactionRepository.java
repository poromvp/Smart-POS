package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.InventoryTransaction;
import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    boolean existsByIngredientId(Long ingredientId);

    boolean existsByOrderCodeAndTransactionType(String orderCode, InventoryTransactionType transactionType);

    @EntityGraph(attributePaths = {"ingredient"})
    @Query("SELECT tx FROM InventoryTransaction tx WHERE " +
           "(:ingredientId IS NULL OR tx.ingredient.id = :ingredientId) AND " +
           "(:transactionType IS NULL OR tx.transactionType = :transactionType) AND " +
           "(:pattern IS NULL OR LOWER(tx.orderCode) LIKE :pattern) AND " +
           "(:fromDate IS NULL OR tx.createdAt >= :fromDate) AND " +
           "(:toDate IS NULL OR tx.createdAt <= :toDate) " +
           "ORDER BY tx.createdAt DESC, tx.id DESC")
    List<InventoryTransaction> searchTransactions(
            @Param("ingredientId") Long ingredientId,
            @Param("transactionType") InventoryTransactionType transactionType,
            @Param("pattern") String pattern,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);
}
