package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.Ingredient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import jakarta.persistence.EntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class IngredientRepositoryTest {

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private EntityManager entityManager;

    private Ingredient beef;
    private Ingredient chicken;
    private Ingredient noodle;

    @BeforeEach
    void setUp() {
        beef = Ingredient.builder()
                .code("ING-BEEF")
                .name("Thịt Bò Mỹ")
                .unit("kg")
                .currentStock(new BigDecimal("2.00"))
                .minThreshold(new BigDecimal("5.00")) // Tồn 2 <= 5 -> Cảnh báo sắp hết
                .costPerUnit(new BigDecimal("250000"))
                .isActive(true)
                .build();

        chicken = Ingredient.builder()
                .code("ING-CHICKEN")
                .name("Thịt Gà Ta")
                .unit("kg")
                .currentStock(new BigDecimal("15.00"))
                .minThreshold(new BigDecimal("5.00")) // Tồn 15 > 5 -> Đủ hàng
                .costPerUnit(new BigDecimal("90000"))
                .isActive(true)
                .build();

        noodle = Ingredient.builder()
                .code("ING-NOODLE")
                .name("Mì Trứng")
                .unit("gói")
                .currentStock(new BigDecimal("50.00"))
                .minThreshold(new BigDecimal("10.00"))
                .costPerUnit(new BigDecimal("5000"))
                .isActive(false) // Ngừng kinh doanh
                .build();

        entityManager.persist(beef);
        entityManager.persist(chicken);
        entityManager.persist(noodle);
        entityManager.flush();
    }

    @Test
    @DisplayName("Khóa bi quan tìm nguyên liệu theo ID (findByIdWithLock) thành công")
    void testFindByIdWithLock_Success() {
        Optional<Ingredient> found = ingredientRepository.findByIdWithLock(beef.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getCode()).isEqualTo("ING-BEEF");
        assertThat(found.get().getCurrentStock()).isEqualByComparingTo("2.00");
    }

    @Test
    @DisplayName("Khóa bi quan danh sách ID nguyên liệu (findAllByIdWithLock) trả về đúng thứ tự")
    void testFindAllByIdWithLock_Success() {
        List<Ingredient> lockedList = ingredientRepository.findAllByIdWithLock(List.of(beef.getId(), chicken.getId()));

        assertThat(lockedList).hasSize(2);
        assertThat(lockedList).extracting(Ingredient::getCode)
                .containsExactlyInAnyOrder("ING-BEEF", "ING-CHICKEN");
    }

    @Test
    @DisplayName("Truy vấn nguyên liệu sắp hết hàng (findLowStockIngredients) lọc đúng currentStock <= minThreshold")
    void testFindLowStockIngredients() {
        List<Ingredient> lowStock = ingredientRepository.findLowStockIngredients();

        // Chỉ có thịt bò: tồn 2 <= ngưỡng 5
        assertThat(lowStock).hasSize(1);
        assertThat(lowStock.get(0).getCode()).isEqualTo("ING-BEEF");
    }

    @Test
    @DisplayName("Tìm kiếm nguyên liệu theo tên/mã và trạng thái hoạt động (searchIngredients)")
    void testSearchIngredients_FilterActiveAndPattern() {
        // Tìm chữ "thịt" và chỉ lấy active = true
        List<Ingredient> activeMeats = ingredientRepository.searchIngredients("%thịt%", true);

        assertThat(activeMeats).hasSize(2);
        assertThat(activeMeats).extracting(Ingredient::getCode)
                .containsExactlyInAnyOrder("ING-BEEF", "ING-CHICKEN");

        // Tìm với activeOnly = false (lấy cả inactive)
        List<Ingredient> allNoodles = ingredientRepository.searchIngredients("%mì%", false);
        assertThat(allNoodles).hasSize(1);
        assertThat(allNoodles.get(0).getCode()).isEqualTo("ING-NOODLE");
    }
}
