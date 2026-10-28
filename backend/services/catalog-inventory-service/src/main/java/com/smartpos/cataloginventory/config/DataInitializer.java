package com.smartpos.cataloginventory.config;

import com.smartpos.cataloginventory.domain.Category;
import com.smartpos.cataloginventory.domain.ModifierGroup;
import com.smartpos.cataloginventory.domain.ModifierOption;
import com.smartpos.cataloginventory.domain.Product;
import com.smartpos.cataloginventory.domain.ProductVariant;
import com.smartpos.cataloginventory.repository.CategoryRepository;
import com.smartpos.cataloginventory.repository.ModifierGroupRepository;
import com.smartpos.cataloginventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ModifierGroupRepository modifierGroupRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            log.info("Dữ liệu Catalog đã tồn tại trong database ({} danh mục), bỏ qua bước nạp mẫu.", categoryRepository.count());
            return;
        }

        log.info("Database đang trống. Bắt đầu tự động nạp dữ liệu mẫu cho thực đơn SmartPOS...");

        // 1. Tạo Danh Mục (Categories)
        Category catMiCay = categoryRepository.save(Category.builder()
                .name("Mì Cay")
                .displayOrder(1)
                .isActive(true)
                .build());

        Category catAnKem = categoryRepository.save(Category.builder()
                .name("Món Ăn Kèm")
                .displayOrder(2)
                .isActive(true)
                .build());

        Category catNuoc = categoryRepository.save(Category.builder()
                .name("Trà & Thức Uống")
                .displayOrder(3)
                .isActive(true)
                .build());

        // 2. Tạo Nhóm Tùy Chọn / Topping (Modifier Groups & Options)
        ModifierGroup modToppingMi = ModifierGroup.builder()
                .name("Topping Mì Cay")
                .isMultiple(true)
                .isRequired(false)
                .options(new LinkedHashSet<>())
                .build();
        addTopping(modToppingMi, "Thịt bò thêm", new BigDecimal("25000"));
        addTopping(modToppingMi, "Trứng gà chần", new BigDecimal("10000"));
        addTopping(modToppingMi, "Xúc xích Đức", new BigDecimal("15000"));
        addTopping(modToppingMi, "Phô mai sợi", new BigDecimal("15000"));
        addTopping(modToppingMi, "Nấm kim châm", new BigDecimal("8000"));
        modToppingMi = modifierGroupRepository.save(modToppingMi);

        ModifierGroup modDuong = ModifierGroup.builder()
                .name("Lượng Đường")
                .isMultiple(false)
                .isRequired(false)
                .options(new LinkedHashSet<>())
                .build();
        addTopping(modDuong, "100% đường (Bình thường)", BigDecimal.ZERO);
        addTopping(modDuong, "70% đường", BigDecimal.ZERO);
        addTopping(modDuong, "50% đường (Ít ngọt)", BigDecimal.ZERO);
        addTopping(modDuong, "Không đường", BigDecimal.ZERO);
        modDuong = modifierGroupRepository.save(modDuong);

        ModifierGroup modToppingNuoc = ModifierGroup.builder()
                .name("Topping Thức Uống")
                .isMultiple(true)
                .isRequired(false)
                .options(new LinkedHashSet<>())
                .build();
        addTopping(modToppingNuoc, "Miếng đào giòn thêm", new BigDecimal("10000"));
        addTopping(modToppingNuoc, "Thạch nha đam", new BigDecimal("8000"));
        addTopping(modToppingNuoc, "Trân châu đen", new BigDecimal("8000"));
        modToppingNuoc = modifierGroupRepository.save(modToppingNuoc);

        // 3. Tạo Món ăn (Products) & Biến thể Size (Variants)
        // Món 1: Mì Cay Bò Mỹ
        Product p1 = Product.builder()
                .category(catMiCay)
                .name("Mì Cay Bò Mỹ")
                .code("MC-BO")
                .basePrice(new BigDecimal("75000"))
                .imageUrl("/menu/beef-noodles.jpg")
                .description("Mì sợi dai Hàn Quốc, thịt bò Mỹ cao cấp kết hợp nước dùng chua cay đậm đà chuẩn vị.")
                .isActive(true)
                .variants(new LinkedHashSet<>())
                .modifierGroups(new LinkedHashSet<>(Set.of(modToppingMi)))
                .build();
        addVariant(p1, "Cấp 1 (Cay nhẹ)", BigDecimal.ZERO, "MC-BO-C1");
        addVariant(p1, "Cấp 3 (Cay vừa)", BigDecimal.ZERO, "MC-BO-C3");
        addVariant(p1, "Cấp 7 (Siêu cay)", new BigDecimal("5000"), "MC-BO-C7");
        productRepository.save(p1);

        // Món 2: Mì Cay Hải Sản
        Product p2 = Product.builder()
                .category(catMiCay)
                .name("Mì Cay Hải Sản")
                .code("MC-HS")
                .basePrice(new BigDecimal("85000"))
                .imageUrl("/menu/beef-noodles.jpg")
                .description("Tôm sú tươi giòn ngọt, mực tươi kèm nấm kim châm và rau củ tươi ngon.")
                .isActive(true)
                .variants(new LinkedHashSet<>())
                .modifierGroups(new LinkedHashSet<>(Set.of(modToppingMi)))
                .build();
        addVariant(p2, "Cấp 1 (Cay nhẹ)", BigDecimal.ZERO, "MC-HS-C1");
        addVariant(p2, "Cấp 3 (Cay vừa)", BigDecimal.ZERO, "MC-HS-C3");
        addVariant(p2, "Cấp 7 (Siêu cay)", new BigDecimal("5000"), "MC-HS-C7");
        productRepository.save(p2);

        // Món 3: Gà Sốt Cay Hàn Quốc
        Product p3 = Product.builder()
                .category(catAnKem)
                .name("Gà Sốt Cay Hàn Quốc")
                .code("AK-GA-CAY")
                .basePrice(new BigDecimal("89000"))
                .imageUrl("/menu/spicy-chicken.jpg")
                .description("Gà giòn rụm áo sốt cay ngọt Hàn Quốc thơm nức mè rang.")
                .isActive(true)
                .variants(new LinkedHashSet<>())
                .modifierGroups(new LinkedHashSet<>())
                .build();
        addVariant(p3, "Phần 4 miếng", BigDecimal.ZERO, "AK-GA-4M");
        addVariant(p3, "Phần 8 miếng", new BigDecimal("60000"), "AK-GA-8M");
        productRepository.save(p3);

        // Món 4: Trà Đào Cam Sả
        Product p4 = Product.builder()
                .category(catNuoc)
                .name("Trà Đào Cam Sả")
                .code("NU-TRA-DAO")
                .basePrice(new BigDecimal("45000"))
                .imageUrl("/menu/peach-tea.jpg")
                .description("Trà thanh mát kết hợp lát đào giòn ngọt và hương sả thơm lừng giải nhiệt.")
                .isActive(true)
                .variants(new LinkedHashSet<>())
                .modifierGroups(new LinkedHashSet<>(Set.of(modDuong, modToppingNuoc)))
                .build();
        addVariant(p4, "Size M", BigDecimal.ZERO, "NU-DAO-M");
        addVariant(p4, "Size L", new BigDecimal("8000"), "NU-DAO-L");
        productRepository.save(p4);

        // Món 5: Matcha Latte
        Product p5 = Product.builder()
                .category(catNuoc)
                .name("Matcha Latte")
                .code("NU-MATCHA")
                .basePrice(new BigDecimal("55000"))
                .imageUrl("/menu/matcha-latte.jpg")
                .description("Bột trà xanh Nhật Bản nguyên chất hòa quyện cùng sữa tươi béo ngậy.")
                .isActive(true)
                .variants(new LinkedHashSet<>())
                .modifierGroups(new LinkedHashSet<>(Set.of(modDuong, modToppingNuoc)))
                .build();
        addVariant(p5, "Size M", BigDecimal.ZERO, "NU-MATCHA-M");
        addVariant(p5, "Size L", new BigDecimal("10000"), "NU-MATCHA-L");
        productRepository.save(p5);

        // Món 6: Cà Phê Sữa Đá
        Product p6 = Product.builder()
                .category(catNuoc)
                .name("Cà Phê Sữa Đá")
                .code("NU-CF-SUA")
                .basePrice(new BigDecimal("35000"))
                .imageUrl("/menu/iced-coffee.jpg")
                .description("Cà phê pha phin truyền thống đậm đà sánh quyện sữa đặc thơm béo.")
                .isActive(true)
                .variants(new LinkedHashSet<>())
                .modifierGroups(new LinkedHashSet<>(Set.of(modDuong)))
                .build();
        productRepository.save(p6);

        log.info(">>> Khởi tạo thành công 3 danh mục, 3 nhóm tùy chọn và 6 món ăn mẫu vào cơ sở dữ liệu!");
    }

    private void addTopping(ModifierGroup group, String name, BigDecimal price) {
        ModifierOption opt = ModifierOption.builder()
                .name(name)
                .price(price)
                .group(group)
                .build();
        group.getOptions().add(opt);
    }

    private void addVariant(Product product, String sizeName, BigDecimal priceAdjustment, String sku) {
        ProductVariant variant = ProductVariant.builder()
                .sizeName(sizeName)
                .priceAdjustment(priceAdjustment)
                .sku(sku)
                .product(product)
                .build();
        product.getVariants().add(variant);
    }
}
