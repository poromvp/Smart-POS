package com.smartpos.cataloginventory.config;

import com.smartpos.cataloginventory.domain.*;
import com.smartpos.cataloginventory.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Profile("!test")
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
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @Override
    @Transactional
    public void run(String... args) {
        initCatalogData();
        initIngredientsData();
        initRecipesData();
        initInventoryTransactionsData();
        initSuppliersAndPurchaseOrdersData();
    }

    /**
     * 1. Nạp danh mục, nhóm tùy chọn/topping, món ăn và biến thể size (Idempotent theo tên/mã)
     */
    private void initCatalogData() {
        log.info("Bắt đầu đồng bộ dữ liệu Catalog mẫu...");

        Category catMiCay = getOrCreateCategory("Mì Cay", 1);
        Category catAnKem = getOrCreateCategory("Món Ăn Kèm", 2);
        Category catComLau = getOrCreateCategory("Cơm & Lẩu Mini", 3);
        Category catNuoc = getOrCreateCategory("Trà & Thức Uống", 4);
        Category catTrangMieng = getOrCreateCategory("Tráng Miệng", 5);
        Category catCombo = getOrCreateCategory("Combo Tiết Kiệm", 6);

        ModifierGroup modToppingMi = getOrCreateModifierGroup("Topping Mì Cay", true, false, Map.of(
                "Thịt bò thêm", "25000",
                "Trứng gà chần", "10000",
                "Xúc xích Đức", "15000",
                "Phô mai sợi", "15000",
                "Nấm kim châm", "8000"
        ));

        ModifierGroup modDuong = getOrCreateModifierGroup("Lượng Đường", false, false, Map.of(
                "100% đường (Bình thường)", "0",
                "70% đường", "0",
                "50% đường (Ít ngọt)", "0",
                "Không đường", "0"
        ));

        ModifierGroup modDa = getOrCreateModifierGroup("Lượng Đá", false, false, Map.of(
                "100% đá", "0",
                "50% đá", "0",
                "Không đá", "0"
        ));

        ModifierGroup modToppingNuoc = getOrCreateModifierGroup("Topping Thức Uống", true, false, Map.of(
                "Miếng đào giòn thêm", "10000",
                "Thạch nha đam", "8000",
                "Trân châu đen", "8000"
        ));

        ModifierGroup modSotKem = getOrCreateModifierGroup("Nước Chấm & Sốt Kèm", true, false, Map.of(
                "Sốt Phô Mai Cay", "8000",
                "Sốt Mù Tạt Mật Ong", "5000",
                "Tương Ớt Hàn Quốc", "0"
        ));

        ModifierGroup modDoCayLau = getOrCreateModifierGroup("Độ Cay Lẩu", false, true, Map.of(
                "Không cay", "0",
                "Cay vừa", "0",
                "Siêu cay nồng", "0"
        ));

        // === 6 MÓN GỐC (Giữ đúng thứ tự ID 1..6 & Variant ID 1..12 đồng bộ với seed-data.sql và sales-service) ===
        createProductIfNotExists("MC-BO", "Mì Cay Bò Mỹ", catMiCay, "75000", "/menu/beef-noodles.jpg",
                "Mì sợi dai Hàn Quốc, thịt bò Mỹ cao cấp kết hợp nước dùng chua cay đậm đà chuẩn vị.",
                Set.of(modToppingMi),
                List.of(
                        new VariantDef("Cấp 1 (Cay nhẹ)", "0", "MC-BO-C1"),
                        new VariantDef("Cấp 3 (Cay vừa)", "0", "MC-BO-C3"),
                        new VariantDef("Cấp 7 (Siêu cay)", "5000", "MC-BO-C7")
                ));

        createProductIfNotExists("MC-HS", "Mì Cay Hải Sản", catMiCay, "85000", "/menu/beef-noodles.jpg",
                "Tôm sú tươi giòn ngọt, mực tươi kèm nấm kim châm và rau củ tươi ngon.",
                Set.of(modToppingMi),
                List.of(
                        new VariantDef("Cấp 1 (Cay nhẹ)", "0", "MC-HS-C1"),
                        new VariantDef("Cấp 3 (Cay vừa)", "0", "MC-HS-C3"),
                        new VariantDef("Cấp 7 (Siêu cay)", "5000", "MC-HS-C7")
                ));

        createProductIfNotExists("AK-GA-CAY", "Gà Sốt Cay Hàn Quốc", catAnKem, "89000", "/menu/spicy-chicken.jpg",
                "Gà giòn rụm áo sốt cay ngọt Hàn Quốc thơm nức mè rang.",
                Set.of(modSotKem),
                List.of(
                        new VariantDef("Phần 4 miếng", "0", "AK-GA-4M"),
                        new VariantDef("Phần 8 miếng", "60000", "AK-GA-8M")
                ));

        createProductIfNotExists("NU-TRA-DAO", "Trà Đào Cam Sả", catNuoc, "45000", "/menu/peach-tea.jpg",
                "Trà thanh mát kết hợp lát đào giòn ngọt và hương sả thơm lừng giải nhiệt.",
                Set.of(modDuong, modDa, modToppingNuoc),
                List.of(
                        new VariantDef("Size M", "0", "NU-DAO-M"),
                        new VariantDef("Size L", "8000", "NU-DAO-L")
                ));

        createProductIfNotExists("NU-MATCHA", "Matcha Latte", catNuoc, "55000", "/menu/matcha-latte.jpg",
                "Bột trà xanh Nhật Bản nguyên chất hòa quyện cùng sữa tươi béo ngậy.",
                Set.of(modDuong, modDa, modToppingNuoc),
                List.of(
                        new VariantDef("Size M", "0", "NU-MATCHA-M"),
                        new VariantDef("Size L", "10000", "NU-MATCHA-L")
                ));

        createProductIfNotExists("NU-CF-SUA", "Cà Phê Sữa Đá", catNuoc, "35000", "/menu/iced-coffee.jpg",
                "Cà phê pha phin truyền thống đậm đà sánh quyện sữa đặc thơm béo.",
                Set.of(modDuong, modDa),
                List.of());

        // === CÁC MÓN MỞ RỘNG (ID 7 trở đi) ===
        createProductIfNotExists("MC-GA", "Mì Cay Gà Giòn", catMiCay, "79000", "/menu/beef-noodles.jpg",
                "Thịt gà phi lê chiên giòn rụm dùng kèm nước mì cay chua thanh hấp dẫn.",
                Set.of(modToppingMi),
                List.of(
                        new VariantDef("Cấp 1 (Cay nhẹ)", "0", "MC-GA-C1"),
                        new VariantDef("Cấp 3 (Cay vừa)", "0", "MC-GA-C3"),
                        new VariantDef("Cấp 7 (Siêu cay)", "5000", "MC-GA-C7")
                ));

        createProductIfNotExists("MC-TC", "Mì Cay Thập Cẩm Đặc Biệt", catMiCay, "95000", "/menu/beef-noodles.jpg",
                "Đầy ắp thịt bò Mỹ, tôm sú, mực ống, xúc xích Đức và nấm kim châm tươi.",
                Set.of(modToppingMi),
                List.of(
                        new VariantDef("Cấp 1 (Cay nhẹ)", "0", "MC-TC-C1"),
                        new VariantDef("Cấp 3 (Cay vừa)", "0", "MC-TC-C3"),
                        new VariantDef("Cấp 7 (Siêu cay)", "5000", "MC-TC-C7")
                ));

        createProductIfNotExists("MC-TD", "Mì Tương Đen Jajangmyeon", catMiCay, "72000", "/menu/beef-noodles.jpg",
                "Sợi mì tươi quyện sốt tương đen truyền thống Hàn Quốc béo thơm đậm vị.",
                Set.of(modToppingMi),
                List.of());

        createProductIfNotExists("AK-TOKBOKKI", "Tokbokki Lắc Phô Mai", catAnKem, "55000", "/menu/spicy-chicken.jpg",
                "Bánh gạo Hàn Quốc mềm dẻo chiên giòn lắc cùng bột phô mai béo ngậy.",
                Set.of(modSotKem),
                List.of(
                        new VariantDef("Phần Thường", "0", "AK-TOK-STD"),
                        new VariantDef("Phần Lớn", "20000", "AK-TOK-LRG")
                ));

        createProductIfNotExists("AK-KHOAI", "Khoai Tây Chiên Phô Mai", catAnKem, "39000", "/menu/spicy-chicken.jpg",
                "Khoai tây cọng giòn tan phủ bột phô mai mặn ngọt thơm lừng.",
                Set.of(modSotKem),
                List.of());

        createProductIfNotExists("AK-KIMBAP", "Kimbap Truyền Thống", catAnKem, "49000", "/menu/spicy-chicken.jpg",
                "Cơm cuộn rong biển nhân trứng chiên, xúc xích, cà rốt và dưa leo giòn ngon.",
                Set.of(modSotKem),
                List.of());

        createProductIfNotExists("CL-BIBIMBAP", "Cơm Trộn Bibimbap Bò", catComLau, "85000", "/menu/beef-noodles.jpg",
                "Cơm dẻo Nhật Bản trộn thịt bò xào, kim chi, nấm và trứng ốp la lòng đào.",
                Set.of(modSotKem),
                List.of());

        createProductIfNotExists("CL-LAU-KC", "Lẩu Kim Chi Mini 1 Người", catComLau, "119000", "/menu/beef-noodles.jpg",
                "Nồi lẩu kim chi chua cay nóng hổi đầy đủ thịt bò, nấm kim châm và mì sợi.",
                Set.of(modDoCayLau, modToppingMi),
                List.of(
                        new VariantDef("Size Tiêu Chuẩn", "0", "CL-LAU-STD"),
                        new VariantDef("Size Đặc Biệt (Thêm Bò)", "30000", "CL-LAU-SP")
                ));

        createProductIfNotExists("NU-TS-DD", "Trà Sữa Trân Châu Đường Đen", catNuoc, "49000", "/menu/matcha-latte.jpg",
                "Trà đen đậm vị hòa quyện sữa tươi thanh trùng cùng trân châu đen dẻo mềm.",
                Set.of(modDuong, modDa, modToppingNuoc),
                List.of(
                        new VariantDef("Size M", "0", "NU-TSDD-M"),
                        new VariantDef("Size L", "10000", "NU-TSDD-L")
                ));

        createProductIfNotExists("TM-PANNA", "Panna Cotta Dâu Tây", catTrangMieng, "35000", "/menu/peach-tea.jpg",
                "Panna Cotta mềm mịn béo nhẹ hòa quyện cùng sốt dâu tây chua ngọt thanh mát.",
                Set.of(),
                List.of());

        createProductIfNotExists("CB-BO-DAO", "Combo Mì Cay Bò + Trà Đào", catCombo, "109000", "/menu/beef-noodles.jpg",
                "Tiết kiệm hơn với 1 phần Mì Cay Bò Mỹ Cấp 3 kèm 1 ly Trà Đào Cam Sả thanh mát.",
                Set.of(modToppingMi, modDuong, modDa),
                List.of());

        log.info(">>> Đồng bộ Catalog hoàn tất! Tổng số món hiện có: {}", productRepository.count());
    }

    /**
     * 2. Nạp danh mục nguyên liệu thô (Ingredients) - gồm cả các nguyên liệu Low Stock để test cảnh báo.
     */
    private void initIngredientsData() {
        log.info("Bắt đầu kiểm tra và đồng bộ nguyên liệu mẫu vào kho...");

        List<Ingredient> ingredients = List.of(
                createIng("NL-BO", "Thịt bò Mỹ đông lạnh", "kg", "220000", "25.500", "5.000"),
                createIng("NL-TOM", "Tôm sú tươi sống", "kg", "260000", "15.000", "3.000"),
                createIng("NL-MUC", "Mực ống tươi", "kg", "180000", "12.000", "3.000"),
                createIng("NL-MI", "Mì sợi dai Hàn Quốc", "gói", "8000", "150.000", "30.000"),
                createIng("NL-TRUNG", "Trứng gà tươi", "quả", "3500", "200.000", "50.000"),
                createIng("NL-XUCXICH", "Xúc xích Đức xông khói", "cây", "7000", "80.000", "20.000"),
                createIng("NL-PHOMAI", "Phô mai sợi Mozzarella", "kg", "190000", "8.500", "2.000"),
                createIng("NL-NAM", "Nấm kim châm tươi", "gói", "9000", "45.000", "10.000"),
                createIng("NL-RAU", "Rau củ tươi Đà Lạt", "kg", "35000", "30.000", "10.000"),
                createIng("NL-NUOCDUNG", "Cốt nước dùng mì cay", "lít", "25000", "40.000", "10.000"),

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

                // Nguyên liệu bổ sung cho món ăn mới
                createIng("NL-TOKBOKKI", "Bánh gạo Hàn Quốc Tokbokki", "kg", "55000", "18.000", "4.000"),
                createIng("NL-KHOAI", "Khoai tây cọng đông lạnh", "kg", "48000", "22.000", "5.000"),
                createIng("NL-COM", "Gạo dẻo Nhật Bản", "kg", "32000", "35.000", "10.000"),

                // Các nguyên liệu sắp hết (Low Stock) phục vụ kiểm thử cảnh báo & lỗi hết kho
                createIng("NL-GA", "Gà phi lê tươi CP", "kg", "85000", "2.500", "5.000"),
                createIng("NL-KIMCHI", "Kim chi cải thảo Hàn Quốc", "kg", "45000", "3.000", "5.000"),
                createIng("NL-PHOMAI-BOT", "Bột phô mai lắc Hàn Quốc", "kg", "180000", "0.200", "1.000")
        );

        int addedCount = 0;
        for (Ingredient ing : ingredients) {
            if (!ingredientRepository.existsByCodeIgnoreCase(ing.getCode())) {
                ingredientRepository.save(ing);
                addedCount++;
            }
        }
        log.info(">>> Đồng bộ nguyên liệu hoàn tất (đã thêm {} mới, tổng: {})", addedCount, ingredientRepository.count());
    }

    /**
     * 3. Nạp công thức BOM định lượng 3 tầng cho cả các món cũ và món mới (Idempotent theo từng món)
     */
    private void initRecipesData() {
        log.info("Bắt đầu kiểm tra và đồng bộ công thức định lượng BOM...");

        Map<String, Ingredient> ingMap = ingredientRepository.findAll().stream()
                .filter(i -> i.getCode() != null)
                .collect(Collectors.toMap(i -> i.getCode().toUpperCase(), Function.identity(), (a, b) -> a));

        Map<String, Product> prodMap = productRepository.findAll().stream()
                .filter(p -> p.getCode() != null)
                .collect(Collectors.toMap(p -> p.getCode().toUpperCase(), Function.identity(), (a, b) -> a));

        List<Recipe> newRecipes = new ArrayList<>();

        // Công thức cho từng món nếu món đó chưa có công thức base
        seedProductBaseRecipe(newRecipes, prodMap.get("MC-BO"), ingMap, Map.of(
                "NL-MI", "1.000", "NL-NUOCDUNG", "0.500", "NL-BO", "0.100", "NL-NAM", "0.500"));
        seedVariantRecipe(newRecipes, prodMap.get("MC-BO"), "MC-BO-C7", ingMap.get("NL-NUOCDUNG"), "0.100");

        seedProductBaseRecipe(newRecipes, prodMap.get("MC-HS"), ingMap, Map.of(
                "NL-MI", "1.000", "NL-NUOCDUNG", "0.500", "NL-TOM", "0.100", "NL-MUC", "0.080"));
        seedProductBaseRecipe(newRecipes, prodMap.get("MC-GA"), ingMap, Map.of(
                "NL-MI", "1.000", "NL-NUOCDUNG", "0.500", "NL-GA", "0.120"));
        seedProductBaseRecipe(newRecipes, prodMap.get("MC-TC"), ingMap, Map.of(
                "NL-MI", "1.000", "NL-NUOCDUNG", "0.500", "NL-BO", "0.080", "NL-TOM", "0.080", "NL-XUCXICH", "1.000"));
        seedProductBaseRecipe(newRecipes, prodMap.get("AK-GA-CAY"), ingMap, Map.of(
                "NL-GA", "0.250"));
        seedProductBaseRecipe(newRecipes, prodMap.get("AK-TOKBOKKI"), ingMap, Map.of(
                "NL-TOKBOKKI", "0.250", "NL-PHOMAI-BOT", "0.030"));
        seedProductBaseRecipe(newRecipes, prodMap.get("AK-KHOAI"), ingMap, Map.of(
                "NL-KHOAI", "0.200", "NL-PHOMAI-BOT", "0.020"));
        seedProductBaseRecipe(newRecipes, prodMap.get("CL-BIBIMBAP"), ingMap, Map.of(
                "NL-COM", "0.200", "NL-BO", "0.100", "NL-KIMCHI", "0.080", "NL-TRUNG", "1.000"));
        seedProductBaseRecipe(newRecipes, prodMap.get("CL-LAU-KC"), ingMap, Map.of(
                "NL-KIMCHI", "0.200", "NL-BO", "0.150", "NL-MI", "1.000", "NL-NUOCDUNG", "0.700"));
        seedProductBaseRecipe(newRecipes, prodMap.get("NU-CF-SUA"), ingMap, Map.of(
                "NL-CAPHE", "25.000", "NL-SUA-DAC", "40.000", "NL-DUONG", "5.000"));
        seedProductBaseRecipe(newRecipes, prodMap.get("NU-TRA-DAO"), ingMap, Map.of(
                "NL-TRA", "15.000", "NL-CAM", "0.050", "NL-SA", "0.030", "NL-DUONG", "30.000"));
        seedVariantRecipe(newRecipes, prodMap.get("NU-TRA-DAO"), "NU-DAO-L", ingMap.get("NL-TRA"), "5.000");

        seedProductBaseRecipe(newRecipes, prodMap.get("NU-MATCHA"), ingMap, Map.of(
                "NL-MATCHA", "10.000", "NL-SUA-TUOI", "150.000", "NL-SUA-DAC", "20.000"));
        seedVariantRecipe(newRecipes, prodMap.get("NU-MATCHA"), "NU-MATCHA-L", ingMap.get("NL-SUA-TUOI"), "50.000");

        seedProductBaseRecipe(newRecipes, prodMap.get("NU-TS-DD"), ingMap, Map.of(
                "NL-TRA", "12.000", "NL-SUA-TUOI", "150.000", "NL-TRAN-CHAU", "50.000", "NL-DUONG", "25.000"));
        seedProductBaseRecipe(newRecipes, prodMap.get("CB-BO-DAO"), ingMap, Map.of(
                "NL-MI", "1.000", "NL-NUOCDUNG", "0.500", "NL-BO", "0.100", "NL-TRA", "15.000", "NL-DAO-HOP", "0.100"));

        // Công thức cho các Topping / Tùy chọn (Modifier Options)
        modifierOptionRepository.findAll().forEach(opt -> {
            if (!recipeRepository.existsByModifierOptionId(opt.getId())) {
                switch (opt.getName()) {
                    case "Thịt bò thêm" -> addRecipeIfValid(newRecipes, null, null, opt, ingMap.get("NL-BO"), "0.080");
                    case "Trứng gà chần" -> addRecipeIfValid(newRecipes, null, null, opt, ingMap.get("NL-TRUNG"), "1.000");
                    case "Xúc xích Đức" -> addRecipeIfValid(newRecipes, null, null, opt, ingMap.get("NL-XUCXICH"), "1.000");
                    case "Phô mai sợi" -> addRecipeIfValid(newRecipes, null, null, opt, ingMap.get("NL-PHOMAI"), "0.050");
                    case "Nấm kim châm" -> addRecipeIfValid(newRecipes, null, null, opt, ingMap.get("NL-NAM"), "0.500");
                    case "Miếng đào giòn thêm" -> addRecipeIfValid(newRecipes, null, null, opt, ingMap.get("NL-DAO-HOP"), "0.200");
                    case "Thạch nha đam" -> addRecipeIfValid(newRecipes, null, null, opt, ingMap.get("NL-NHA-DAM"), "0.050");
                    case "Trân châu đen" -> addRecipeIfValid(newRecipes, null, null, opt, ingMap.get("NL-TRAN-CHAU"), "40.000");
                }
            }
        });

        if (!newRecipes.isEmpty()) {
            recipeRepository.saveAll(newRecipes);
            log.info(">>> Đã bổ sung {} dòng công thức BOM mới!", newRecipes.size());
        }
    }

    /**
     * 4. Nạp lịch sử giao dịch kho (IMPORT, SALE_DEDUCT, AUDIT_ADJUST, SPOILAGE)
     */
    private void initInventoryTransactionsData() {
        if (!inventoryTransactionRepository.existsByOrderCodeAndTransactionType("INIT-STOCK-2026", InventoryTransactionType.IMPORT)) {
            List<InventoryTransaction> initTxs = ingredientRepository.findAll().stream()
                    .filter(ing -> ing.getCurrentStock() != null && ing.getCurrentStock().compareTo(BigDecimal.ZERO) > 0)
                    .map(ing -> InventoryTransaction.builder()
                            .ingredient(ing)
                            .orderCode("INIT-STOCK-2026")
                            .quantity(ing.getCurrentStock())
                            .transactionType(InventoryTransactionType.IMPORT)
                            .build())
                    .toList();
            if (!initTxs.isEmpty()) {
                inventoryTransactionRepository.saveAll(initTxs);
            }
        }

        // Thêm các giao dịch mẫu khác (Xuất hủy, Kiểm kê, Bán trừ kho) nếu chưa có
        if (!inventoryTransactionRepository.existsByOrderCodeAndTransactionType("AUDIT-20261108", InventoryTransactionType.AUDIT_ADJUST)) {
            List<InventoryTransaction> sampleTxs = new ArrayList<>();
            ingredientRepository.findByCode("NL-RAU").ifPresent(ing -> sampleTxs.add(InventoryTransaction.builder()
                    .ingredient(ing)
                    .orderCode("SPOIL-20261108")
                    .quantity(new BigDecimal("-1.500"))
                    .transactionType(InventoryTransactionType.SPOILAGE)
                    .build()));
            ingredientRepository.findByCode("NL-TRUNG").ifPresent(ing -> sampleTxs.add(InventoryTransaction.builder()
                    .ingredient(ing)
                    .orderCode("AUDIT-20261108")
                    .quantity(new BigDecimal("-4.000"))
                    .transactionType(InventoryTransactionType.AUDIT_ADJUST)
                    .build()));
            ingredientRepository.findByCode("NL-BO").ifPresent(ing -> sampleTxs.add(InventoryTransaction.builder()
                    .ingredient(ing)
                    .orderCode("ORD-DEMO-1001")
                    .quantity(new BigDecimal("-0.300"))
                    .transactionType(InventoryTransactionType.SALE_DEDUCT)
                    .build()));
            if (!sampleTxs.isEmpty()) {
                inventoryTransactionRepository.saveAll(sampleTxs);
                log.info(">>> Đã bổ sung {} giao dịch kho mẫu (SPOILAGE/AUDIT/SALE_DEDUCT)!", sampleTxs.size());
            }
        }
    }

    /**
     * 5. Nạp 5 Nhà cung cấp & 5 Đơn nhập kho mẫu đa trạng thái (COMPLETED, DRAFT, CANCELLED)
     */
    private void initSuppliersAndPurchaseOrdersData() {
        log.info("Bắt đầu đồng bộ Nhà cung cấp & Phiếu nhập kho mẫu...");

        Supplier sup1 = getOrCreateSupplier("Công ty TNHH Thực Phẩm Tươi Sống Nam An", "0901234567",
                "contact@namanfood.vn", "123 Kha Vạn Cân, TP. Thủ Đức, TP. HCM");
        Supplier sup2 = getOrCreateSupplier("Nhà Cung Cấp Nông Sản Đà Lạt Xanh", "0988776655",
                "sales@dalatxanh.com", "45 Lê Hồng Phong, TP. Đà Lạt");
        Supplier sup3 = getOrCreateSupplier("Đại Lý Gia Vị & Đồ Khô Tân Bình", "0912348899",
                "giavi.tanbinh@gmail.com", "78 Lý Thường Kiệt, Q. Tân Bình, TP. HCM");
        Supplier sup4 = getOrCreateSupplier("Công Ty Cổ Phần Trà & Cà Phê Bảo Lộc", "0933445566",
                "order@baolocbeverage.vn", "210 Trần Phú, TP. Bảo Lộc, Lâm Đồng");
        Supplier sup5 = getOrCreateSupplier("Nhà Phân Phối Nguyên Liệu Hàn Quốc Seoul Mart", "0977889900",
                "b2b@seoulmart.vn", "88 Nguyễn Văn Linh, Q. 7, TP. HCM");

        createPurchaseOrderIfNotExists("PO-20261028-1001", sup1, LocalDate.now().minusDays(12), LocalDate.now().minusDays(12),
                PurchaseOrderStatus.COMPLETED, "Đơn nhập thịt tươi đầu tuần phục vụ cơ sở chính",
                Map.of("NL-BO", new PoItemDef("20.000", "175000.00"), "NL-GA", new PoItemDef("15.000", "62000.00")));

        createPurchaseOrderIfNotExists("PO-20261030-1002", sup2, LocalDate.now().minusDays(5), LocalDate.now().minusDays(4),
                PurchaseOrderStatus.DRAFT, "Dự trù nấm và rau củ tươi cho cuối tuần",
                Map.of("NL-NAM", new PoItemDef("10.000", "40000.00"), "NL-RAU", new PoItemDef("25.000", "14000.00")));

        createPurchaseOrderIfNotExists("PO-20261105-1003", sup4, LocalDate.now().minusDays(3), LocalDate.now().minusDays(3),
                PurchaseOrderStatus.COMPLETED, "Nhập bổ sung trà Phúc Long và cà phê Robusta",
                Map.of("NL-TRA", new PoItemDef("2000.000", "240.00"), "NL-CAPHE", new PoItemDef("2500.000", "195.00")));

        createPurchaseOrderIfNotExists("PO-20261109-1004", sup5, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1),
                PurchaseOrderStatus.DRAFT, "Đặt gấp Kim Chi, Tokbokki và Bột Phô Mai (sắp hết kho)",
                Map.of("NL-KIMCHI", new PoItemDef("15.000", "42000.00"), "NL-PHOMAI-BOT", new PoItemDef("5.000", "170000.00")));

        createPurchaseOrderIfNotExists("PO-20261102-1005", sup3, LocalDate.now().minusDays(8), null,
                PurchaseOrderStatus.CANCELLED, "Hủy do nhà cung cấp giao trễ hẹn",
                Map.of("NL-DUONG", new PoItemDef("10000.000", "22.00")));
    }

    // === Helper records & methods ===
    private record VariantDef(String sizeName, String priceAdjustment, String sku) {}
    private record PoItemDef(String quantity, String unitPrice) {}

    private Category getOrCreateCategory(String name, int displayOrder) {
        return categoryRepository.findAll().stream()
                .filter(c -> name.equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(name)
                        .displayOrder(displayOrder)
                        .isActive(true)
                        .build()));
    }

    private ModifierGroup getOrCreateModifierGroup(String name, boolean isMultiple, boolean isRequired, Map<String, String> options) {
        return modifierGroupRepository.findAll().stream()
                .filter(g -> name.equalsIgnoreCase(g.getName()))
                .findFirst()
                .orElseGet(() -> {
                    ModifierGroup group = ModifierGroup.builder()
                            .name(name)
                            .isMultiple(isMultiple)
                            .isRequired(isRequired)
                            .isActive(true)
                            .options(new LinkedHashSet<>())
                            .build();
                    options.forEach((optName, optPrice) -> addTopping(group, optName, new BigDecimal(optPrice)));
                    return modifierGroupRepository.save(group);
                });
    }

    private void createProductIfNotExists(String code, String name, Category category, String basePrice,
                                          String imageUrl, String description,
                                          Set<ModifierGroup> modifierGroups, List<VariantDef> variants) {
        if (productRepository.existsByCodeIgnoreCase(code)) {
            return;
        }
        Product product = Product.builder()
                .category(category)
                .name(name)
                .code(code)
                .basePrice(new BigDecimal(basePrice))
                .imageUrl(imageUrl)
                .description(description)
                .isActive(true)
                .variants(new LinkedHashSet<>())
                .modifierGroups(new LinkedHashSet<>(modifierGroups))
                .build();
        for (VariantDef v : variants) {
            addVariant(product, v.sizeName(), new BigDecimal(v.priceAdjustment()), v.sku());
        }
        productRepository.save(product);
    }

    private void seedProductBaseRecipe(List<Recipe> recipes, Product p, Map<String, Ingredient> ingMap, Map<String, String> items) {
        if (p == null || recipeRepository.existsByProductId(p.getId())) {
            return;
        }
        items.forEach((code, qty) -> addRecipeIfValid(recipes, p, null, null, ingMap.get(code), qty));
    }

    private void seedVariantRecipe(List<Recipe> recipes, Product p, String sku, Ingredient ing, String qty) {
        if (p == null || ing == null) {
            return;
        }
        productVariantRepository.findByProductId(p.getId()).stream()
                .filter(v -> sku.equalsIgnoreCase(v.getSku()))
                .findFirst()
                .ifPresent(v -> {
                    if (!recipeRepository.existsByVariantId(v.getId())) {
                        addRecipeIfValid(recipes, null, v, null, ing, qty);
                    }
                });
    }

    private Supplier getOrCreateSupplier(String name, String phone, String email, String address) {
        return supplierRepository.findAll().stream()
                .filter(s -> name.equalsIgnoreCase(s.getName()))
                .findFirst()
                .orElseGet(() -> supplierRepository.save(Supplier.builder()
                        .name(name)
                        .phone(phone)
                        .email(email)
                        .address(address)
                        .isActive(true)
                        .build()));
    }

    private void createPurchaseOrderIfNotExists(String poNumber, Supplier supplier, LocalDate orderDate,
                                                LocalDate deliveryDate, PurchaseOrderStatus status, String note,
                                                Map<String, PoItemDef> itemDefs) {
        if (purchaseOrderRepository.existsByPoNumber(poNumber)) {
            return;
        }
        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(poNumber)
                .supplier(supplier)
                .staffId(1L)
                .orderDate(orderDate)
                .deliveryDate(deliveryDate)
                .status(status)
                .note(note)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<String, PoItemDef> entry : itemDefs.entrySet()) {
            Optional<Ingredient> ingOpt = ingredientRepository.findByCode(entry.getKey());
            if (ingOpt.isPresent()) {
                BigDecimal qty = new BigDecimal(entry.getValue().quantity());
                BigDecimal unitPrice = new BigDecimal(entry.getValue().unitPrice());
                BigDecimal lineTotal = qty.multiply(unitPrice);
                total = total.add(lineTotal);
                po.getItems().add(PurchaseOrderItem.builder()
                        .purchaseOrder(po)
                        .ingredient(ingOpt.get())
                        .quantity(qty)
                        .unitPrice(unitPrice)
                        .totalPrice(lineTotal)
                        .build());
            }
        }
        po.setTotalAmount(total);
        if (!po.getItems().isEmpty()) {
            purchaseOrderRepository.save(po);
        }
    }

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
