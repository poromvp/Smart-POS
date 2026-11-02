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

    boolean existsByIngredientId(Long ingredientId);

    // Công thức theo size của một món
    @Query("SELECT r FROM Recipe r JOIN FETCH r.ingredient JOIN FETCH r.variant v WHERE v.product.id = :productId")
    List<Recipe> findByVariantProductIdWithIngredient(@Param("productId") Long productId);

    // Công thức theo topping/tùy chọn (ưu tiên theo món, nếu không có lấy toàn cục)
    @Query("SELECT r FROM Recipe r JOIN FETCH r.ingredient JOIN FETCH r.modifierOption o " +
           "WHERE o.id IN :optionIds AND (r.product.id = :productId OR r.product IS NULL)")
    List<Recipe> findModifierRecipesByProductAndOptionIds(
            @Param("productId") Long productId,
            @Param("optionIds") Collection<Long> optionIds);

    @Query("SELECT r FROM Recipe r JOIN FETCH r.ingredient JOIN FETCH r.modifierOption o WHERE o.id IN :optionIds")
    List<Recipe> findByModifierOptionIdInWithIngredient(@Param("optionIds") Collection<Long> optionIds);

    // Xóa công thức cũ trước khi ghi đè
    void deleteByProductId(Long productId);

    void deleteByVariantId(Long variantId);

    void deleteByModifierOptionId(Long modifierOptionId);

    void deleteByProductIdAndModifierOptionId(Long productId, Long modifierOptionId);

    // Dùng để chặn xóa Product/Size/Topping đang có công thức
    boolean existsByProductId(Long productId);

    boolean existsByVariantId(Long variantId);

    boolean existsByVariantProductId(Long productId);

    boolean existsByModifierOptionId(Long modifierOptionId);

    boolean existsByModifierOptionGroupId(Long groupId);

    @Query("SELECT r FROM Recipe r JOIN FETCH r.ingredient WHERE r.product.id = :productId")
    List<Recipe> findByProductIdWithIngredient(@Param("productId") Long productId);

    // Truy vấn tổng hợp định lượng khi nhận Order từ Order Service (ưu tiên công thức Topping theo món)
    @Query("SELECT r FROM Recipe r JOIN FETCH r.ingredient " +
            "LEFT JOIN FETCH r.product p " +
            "LEFT JOIN FETCH r.variant v " +
            "LEFT JOIN FETCH r.modifierOption o WHERE " +
            "(p.id IN :productIds AND v IS NULL AND o IS NULL) OR " +
            "(v.id IN :variantIds) OR " +
            "(o.id IN :optionIds AND (p.id IN :productIds OR p IS NULL))")
    List<Recipe> findApplicableRecipes(
            @Param("productIds") Collection<Long> productIds,
            @Param("variantIds") Collection<Long> variantIds,
            @Param("optionIds") Collection<Long> optionIds
    );
}
