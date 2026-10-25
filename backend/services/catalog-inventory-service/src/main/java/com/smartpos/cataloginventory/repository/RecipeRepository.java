package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Query("SELECT r FROM Recipe r JOIN FETCH r.ingredient WHERE r.product.id = :productId")
    List<Recipe> findByProductIdWithIngredient(@Param("productId") Long productId);

    // Truy vấn tổng hợp định lượng khi nhận Order từ Order Service
    @Query("SELECT r FROM Recipe r JOIN FETCH r.ingredient WHERE " +
            "r.product.id IN :productIds OR " +
            "r.variant.id IN :variantIds OR " +
            "r.modifierOption.id IN :optionIds")
    List<Recipe> findApplicableRecipes(
            @Param("productIds") Collection<Long> productIds,
            @Param("variantIds") Collection<Long> variantIds,
            @Param("optionIds") Collection<Long> optionIds
    );
}
