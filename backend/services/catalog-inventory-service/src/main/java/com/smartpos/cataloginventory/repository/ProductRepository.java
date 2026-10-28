package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByCategoryId(Long categoryId);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    // Tải chi tiết Product kèm Category, Variants và ModifierGroups để tránh lỗi Lazy Loading
    @EntityGraph(attributePaths = {"category", "variants", "modifierGroups", "modifierGroups.options"})
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findDetailById(@Param("id") Long id);

    // Lấy toàn bộ món ăn đang kinh doanh kèm chi tiết để phục vụ render Menu tổng hợp
    @EntityGraph(attributePaths = {"category", "variants", "modifierGroups", "modifierGroups.options"})
    @Query("SELECT DISTINCT p FROM Product p WHERE p.isActive = true AND p.category.isActive = true ORDER BY p.id ASC")
    List<Product> findActiveMenuProducts();

    // Tìm kiếm và lọc danh sách sản phẩm
    @Query("SELECT p FROM Product p WHERE " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:activeOnly IS NULL OR :activeOnly = false OR p.isActive = true) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.id DESC")
    List<Product> searchProducts(@Param("categoryId") Long categoryId,
                                @Param("activeOnly") Boolean activeOnly,
                                @Param("search") String search);
}
