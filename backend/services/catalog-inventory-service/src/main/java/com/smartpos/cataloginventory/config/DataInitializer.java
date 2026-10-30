package com.smartpos.cataloginventory.config;

import com.smartpos.cataloginventory.domain.*;
import com.smartpos.cataloginventory.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ModifierGroupRepository modifierGroupRepository;
    private final ModifierOptionRepository modifierOptionRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        initCatalogData();
        initIngredientsData();
        initRecipesData();
        initInventoryTransactionsData();
    }

    /**
     * 1. Nạp danh mục, nhóm tùy chọn/topping, món ăn và biến thể size
     */
    private void initCatalogData() {
        if (categoryRepository.count() > 0) {
            log.info("Dữ liệu Catalog đã tồn tại ({} danh mục), bỏ qua.", categoryRepository.count());
            return;
        }

        log.info("Bắt đầu nạp dữ liệu Catalog mẫu...");

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

        // Nhóm Topping Mì Cay
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

        // Nhóm Lượng Đường
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

        // Nhóm Lượng Đá
        ModifierGroup modDa = ModifierGroup.builder()
                .name("Lượng Đá")
                .isMultiple(false)
                .isRequired(false)
                .options(new LinkedHashSet<>())
                .build();
        addTopping(modDa, "100% đá", BigDecimal.ZERO);
        addTopping(modDa, "50% đá", BigDecimal.ZERO);
        addTopping(modDa, "Không đá", BigDecimal.ZERO);
        modDa = modifierGroupRepository.save(modDa);

        // Nhóm Topping Nước
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
                .modifierGroups(new LinkedHashSet<>(Set.of(modDuong, modDa, modToppingNuoc)))
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
                .modifierGroups(new LinkedHashSet<>(Set.of(modDuong, modDa, modToppingNuoc)))
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
                .modifierGroups(new LinkedHashSet<>(Set.of(modDuong, modDa)))
                .build();
        productRepository.save(p6);

        log.info(">>> Khởi tạo Catalog hoàn tất!");
    }

    /**
     * 2. Nạp danh mục nguyên liệu thô (Ingredients).
     * Kiểm tra theo từng mã nguyên liệu (code) để đảm bảo luôn nạp đủ 21 nguyên liệu mẫu,
     * kể cả khi trong DB đã có sẵn các bản ghi nguyên liệu trước đó.
     */
    private void initIngredientsData() {
        log.info("Bắt đầu kiểm tra và đồng bộ nguyên liệu mẫu vào kho...");

        List<Ingredient> ingredients = List.of(
                // Đạm tươi & thực phẩm mì cay
                createIng("NL-BO", "Thịt bò Mỹ đông lạnh", "kg", "220000", "25.500", "5.000"),
                createIng("NL-TOM", "Tôm sú tươi sống", "kg", "260000", "15.000", "3.000"),
                createIng("NL-MUC", "Mực ống tươi", "kg", "180000", "12.000", "3.000"),
                createIng("NL-MI", "Mì sợi dai Hàn Quốc", "gói", "8000", "150.000", "30.000"),
                createIng("NL-TRUNG", "Trứng gà tươi", "quả", "3500", "200.000", "50.000"),
                createIng("NL-XUCXICH", "Xúc xích Đức xông khói", "cây", "7000", "80.000", "20.000"),
                createIng("NL-PHOMAI", "Phô mai sợi Mozzarella", "kg", "190000", "8.500", "2.000"),
                createIng("NL-NAM", "Nấm kim châm tươi", "gói", "9000", "45.000", "10.000"),
                createIng("NL-NUOCDUNG", "Cốt nước dùng mì cay", "lít", "25000", "40.000", "10.000"),

                // Nguyên liệu pha chế thức uống
                createIng("NL-TRA", "Trà đen Phúc Long khô", "g", "250", "5000.000", "1000.000"),
                createIng("NL-CAPHE", "Hạt cà phê rang Robusta", "g", "200", "4500.000", "1000.000"),
                createIng("NL-DAO-HOP", "Đào ngâm Kronos", "hộp", "42000", "20.000", "5.000"),
                createIng("NL-CAM", "Cam vàng tươi", "kg", "45000", "18.000", "5.000"),
                createIng("NL-SA", "Sả cây tươi", "kg", "20000", "10.000", "2.000"),
                createIng("NL-SUA-TUOI", "Sữa tươi thanh trùng Barista", "ml", "35", "15000.000", "3000.000"),
                createIng("NL-SUA-DAC", "Sữa đặc Ông Thọ", "g", "80", "8000.000", "1500.000"),
                createIng("NL-DUONG", "Đường cát trắng Biên Hòa", "g", "24", "25000.000", "5000.000"),
                createIng("NL-MATCHA", "Bột Matcha Uji Nhật Bản", "g", "1200", "1200.000", "300.000"),
                createIng("NL-TRAN-CHAU", "Trân châu đen tươi Gia Thịnh", "g", "60", "6000.000", "1500.000"),
                createIng("NL-NHA-DAM", "Thạch nha đam Aloka", "kg", "40000", "15.000", "3.000"),

                // Mặt hàng sắp hết để test cờ cảnh báo lowStock trên giao diện (2.5kg < minThreshold 5.0kg)
                createIng("NL-GA", "Gà phi lê tươi CP", "kg", "85000", "2.500", "5.000")
        );

        int addedCount = 0;
        for (Ingredient ing : ingredients) {
            if (!ingredientRepository.existsByCodeIgnoreCase(ing.getCode())) {
                ingredientRepository.save(ing);
                addedCount++;
            }
        }
        log.info(">>> Đồng bộ nguyên liệu hoàn tất (đã thêm {} nguyên liệu mới, tổng hiện có: {})",
                addedCount, ingredientRepository.count());
    }

    /**
     * 3. Nạp công thức BOM định lượng 3 tầng: Món gốc, Size biến thể, và Topping.
     * Sử dụng addRecipeIfValid để đảm bảo nguyên liệu tồn tại, không bao giờ chèn ingredient_id = null.
     */
    private void initRecipesData() {
        if (recipeRepository.count() > 0) {
            log.info("Dữ liệu công thức BOM đã tồn tại ({} công thức), bỏ qua.", recipeRepository.count());
            return;
        }

        log.info("Bắt đầu nạp công thức định lượng BOM mẫu...");

        Map<String, Ingredient> ingMap = new HashMap<>();
        ingredientRepository.findAll().forEach(i -> {
            if (i.getCode() != null) {
                ingMap.put(i.getCode().toUpperCase(), i);
            }
        });

        List<Recipe> recipes = new ArrayList<>();

        // 1. Công thức Mì Cay Bò Mỹ (MC-BO)
        productRepository.findAll().stream()
                .filter(p -> "MC-BO".equalsIgnoreCase(p.getCode()))
                .findFirst()
                .ifPresent(p -> {
                    // Món gốc (Base)
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-MI"), "1.000");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-NUOCDUNG"), "0.500");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-BO"), "0.100");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-NAM"), "0.500");

                    // Size Cấp 7 siêu cay (cộng thêm nước cốt)
                    productVariantRepository.findByProductId(p.getId()).stream()
                            .filter(v -> "MC-BO-C7".equalsIgnoreCase(v.getSku()))
                            .findFirst()
                            .ifPresent(v -> addRecipeIfValid(recipes, null, v, null, ingMap.get("NL-NUOCDUNG"), "0.100"));
                });

        // 2. Công thức Cà Phê Sữa Đá (NU-CF-SUA)
        productRepository.findAll().stream()
                .filter(p -> "NU-CF-SUA".equalsIgnoreCase(p.getCode()))
                .findFirst()
                .ifPresent(p -> {
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-CAPHE"), "25.000");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-SUA-DAC"), "40.000");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-DUONG"), "5.000");
                });

        // 3. Công thức Trà Đào Cam Sả (NU-TRA-DAO)
        productRepository.findAll().stream()
                .filter(p -> "NU-TRA-DAO".equalsIgnoreCase(p.getCode()))
                .findFirst()
                .ifPresent(p -> {
                    // Base Món gốc
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-TRA"), "15.000");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-CAM"), "0.050");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-SA"), "0.030");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-DUONG"), "30.000");

                    // Size L (cộng thêm trà và đường)
                    productVariantRepository.findByProductId(p.getId()).stream()
                            .filter(v -> "NU-DAO-L".equalsIgnoreCase(v.getSku()))
                            .findFirst()
                            .ifPresent(v -> {
                                addRecipeIfValid(recipes, null, v, null, ingMap.get("NL-TRA"), "5.000");
                                addRecipeIfValid(recipes, null, v, null, ingMap.get("NL-DUONG"), "10.000");
                            });
                });

        // 4. Công thức Matcha Latte (NU-MATCHA)
        productRepository.findAll().stream()
                .filter(p -> "NU-MATCHA".equalsIgnoreCase(p.getCode()))
                .findFirst()
                .ifPresent(p -> {
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-MATCHA"), "10.000");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-SUA-TUOI"), "150.000");
                    addRecipeIfValid(recipes, p, null, null, ingMap.get("NL-SUA-DAC"), "20.000");

                    productVariantRepository.findByProductId(p.getId()).stream()
                            .filter(v -> "NU-MATCHA-L".equalsIgnoreCase(v.getSku()))
                            .findFirst()
                            .ifPresent(v -> {
                                addRecipeIfValid(recipes, null, v, null, ingMap.get("NL-SUA-TUOI"), "50.000");
                                addRecipeIfValid(recipes, null, v, null, ingMap.get("NL-MATCHA"), "3.000");
                            });
                });

        // 5. Công thức cho các Topping / Tùy chọn (Modifier Options)
        modifierOptionRepository.findAll().forEach(opt -> {
            switch (opt.getName()) {
                case "Thịt bò thêm" -> addRecipeIfValid(recipes, null, null, opt, ingMap.get("NL-BO"), "0.080");
                case "Trứng gà chần" -> addRecipeIfValid(recipes, null, null, opt, ingMap.get("NL-TRUNG"), "1.000");
                case "Xúc xích Đức" -> addRecipeIfValid(recipes, null, null, opt, ingMap.get("NL-XUCXICH"), "1.000");
                case "Phô mai sợi" -> addRecipeIfValid(recipes, null, null, opt, ingMap.get("NL-PHOMAI"), "0.050");
                case "Nấm kim châm" -> addRecipeIfValid(recipes, null, null, opt, ingMap.get("NL-NAM"), "0.500");
                case "Miếng đào giòn thêm" -> addRecipeIfValid(recipes, null, null, opt, ingMap.get("NL-DAO-HOP"), "0.200");
                case "Thạch nha đam" -> addRecipeIfValid(recipes, null, null, opt, ingMap.get("NL-NHA-DAM"), "0.050");
                case "Trân châu đen" -> addRecipeIfValid(recipes, null, null, opt, ingMap.get("NL-TRAN-CHAU"), "40.000");
            }
        });

        if (!recipes.isEmpty()) {
            recipeRepository.saveAll(recipes);
            log.info(">>> Khởi tạo {} dòng công thức định lượng BOM thành công!", recipes.size());
        }
    }

    /**
     * 4. Nạp lịch sử giao dịch kho khởi tạo (IMPORT) để xem biểu đồ và bảng log giao dịch
     */
    private void initInventoryTransactionsData() {
        if (inventoryTransactionRepository.count() > 0) {
            log.info("Lịch sử giao dịch kho đã tồn tại, bỏ qua.");
            return;
        }

        List<Ingredient> ingredients = ingredientRepository.findAll();
        List<InventoryTransaction> txs = ingredients.stream()
                .filter(ing -> ing.getCurrentStock() != null && ing.getCurrentStock().compareTo(BigDecimal.ZERO) > 0)
                .map(ing -> InventoryTransaction.builder()
                        .ingredient(ing)
                        .orderCode("INIT-STOCK-2026")
                        .quantity(ing.getCurrentStock())
                        .transactionType(InventoryTransactionType.IMPORT)
                        .build())
                .toList();

        if (!txs.isEmpty()) {
            inventoryTransactionRepository.saveAll(txs);
            log.info(">>> Khởi tạo {} giao dịch nhập kho ban đầu thành công!", txs.size());
        }
    }

    // Các hàm phụ trợ
    private Ingredient createIng(String code, String name, String unit, String cost, String stock, String min) {
        return Ingredient.builder()
                .code(code)
                .name(name)
                .unit(unit)
                .costPerUnit(new BigDecimal(cost))
                .currentStock(new BigDecimal(stock))
                .minThreshold(new BigDecimal(min))
                .build();
    }

    private void addRecipeIfValid(List<Recipe> recipes, Product p, ProductVariant v, ModifierOption o, Ingredient ing, String qty) {
        if (ing != null && (p != null || v != null || o != null)) {
            recipes.add(Recipe.builder()
                    .product(p)
                    .variant(v)
                    .modifierOption(o)
                    .ingredient(ing)
                    .quantityNeeded(new BigDecimal(qty))
                    .build());
        }
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
