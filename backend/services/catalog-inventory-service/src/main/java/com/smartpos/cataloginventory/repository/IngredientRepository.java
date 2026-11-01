package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.Ingredient;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    Optional<Ingredient> findByCode(String code);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    List<Ingredient> findAllByOrderByNameAsc();

    List<Ingredient> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCaseOrderByNameAsc(
            String name, String code);

    @Query("SELECT i FROM Ingredient i WHERE " +
           "(:activeOnly IS NULL OR :activeOnly = false OR i.isActive = true) AND " +
           "(:pattern IS NULL OR LOWER(i.name) LIKE :pattern OR LOWER(i.code) LIKE :pattern) " +
           "ORDER BY i.name ASC")
    List<Ingredient> searchIngredients(@Param("pattern") String pattern, @Param("activeOnly") Boolean activeOnly);

    // Khóa bi quan chống Race Condition khi nhiều đơn hàng trừ kho cùng lúc
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Ingredient i WHERE i.id = :id")
    Optional<Ingredient> findByIdWithLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Ingredient i WHERE i.id IN :ids ORDER BY i.id")
    List<Ingredient> findAllByIdWithLock(@Param("ids") Collection<Long> ids);

    // Tra cứu các nguyên liệu sắp hết hàng
    @Query("SELECT i FROM Ingredient i WHERE i.currentStock <= i.minThreshold")
    List<Ingredient> findLowStockIngredients();
}
