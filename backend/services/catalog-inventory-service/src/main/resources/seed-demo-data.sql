-- =========================================================================
-- SmartPOS - Catalog & Inventory Service Demo Data Seeder (PostgreSQL)
-- File: seed-demo-data.sql
-- =========================================================================

-- 1. Danh mục thực đơn (Categories)
INSERT INTO categories (id, name, display_order, is_active) VALUES
(1, 'Mì Cay', 1, true),
(2, 'Món Ăn Kèm', 2, true),
(3, 'Trà & Thức Uống', 3, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Nhóm tùy chọn & Topping (Modifier Groups)
INSERT INTO modifier_groups (id, name, is_multiple, is_required) VALUES
(1, 'Topping Mì Cay', true, false),
(2, 'Lượng Đường', false, false),
(3, 'Lượng Đá', false, false),
(4, 'Topping Thức Uống', true, false)
ON CONFLICT (id) DO NOTHING;

-- Tùy chọn chi tiết (Modifier Options)
INSERT INTO modifier_options (id, group_id, name, price) VALUES
-- Topping Mì Cay
(1, 1, 'Thịt bò thêm', 25000),
(2, 1, 'Trứng gà chần', 10000),
(3, 1, 'Xúc xích Đức', 15000),
(4, 1, 'Phô mai sợi', 15000),
(5, 1, 'Nấm kim châm', 8000),
-- Lượng đường
(6, 2, '100% đường (Bình thường)', 0),
(7, 2, '70% đường', 0),
(8, 2, '50% đường (Ít ngọt)', 0),
(9, 2, 'Không đường', 0),
-- Lượng đá
(10, 3, '100% đá', 0),
(11, 3, '50% đá', 0),
(12, 3, 'Không đá', 0),
-- Topping Nước
(13, 4, 'Miếng đào giòn thêm', 10000),
(14, 4, 'Thạch nha đam', 8000),
(15, 4, 'Trân châu đen', 8000)
ON CONFLICT (id) DO NOTHING;

-- 3. Món ăn (Products)
INSERT INTO products (id, category_id, name, code, base_price, image_url, description, is_active) VALUES
(1, 1, 'Mì Cay Bò Mỹ', 'MC-BO', 75000, '/menu/beef-noodles.jpg', 'Mì sợi dai Hàn Quốc, thịt bò Mỹ cao cấp kết hợp nước dùng chua cay đậm đà chuẩn vị.', true),
(2, 1, 'Mì Cay Hải Sản', 'MC-HS', 85000, '/menu/beef-noodles.jpg', 'Tôm sú tươi giòn ngọt, mực tươi kèm nấm kim châm và rau củ tươi ngon.', true),
(3, 2, 'Gà Sốt Cay Hàn Quốc', 'AK-GA-CAY', 89000, '/menu/spicy-chicken.jpg', 'Gà giòn rụm áo sốt cay ngọt Hàn Quốc thơm nức mè rang.', true),
(4, 3, 'Trà Đào Cam Sả', 'NU-TRA-DAO', 45000, '/menu/peach-tea.jpg', 'Trà thanh mát kết hợp lát đào giòn ngọt và hương sả thơm lừng giải nhiệt.', true),
(5, 3, 'Matcha Latte', 'NU-MATCHA', 55000, '/menu/matcha-latte.jpg', 'Bột trà xanh Nhật Bản nguyên chất hòa quyện cùng sữa tươi béo ngậy.', true),
(6, 3, 'Cà Phê Sữa Đá', 'NU-CF-SUA', 35000, '/menu/iced-coffee.jpg', 'Cà phê pha phin truyền thống đậm đà sánh quyện sữa đặc thơm béo.', true)
ON CONFLICT (id) DO NOTHING;

-- Gắn Modifier Group vào Product
INSERT INTO product_modifier_groups (product_id, modifier_group_id) VALUES
(1, 1), -- Mì cay bò: Topping mì cay
(2, 1), -- Mì cay hải sản: Topping mì cay
(4, 2), (4, 3), (4, 4), -- Trà đào: Đường, Đá, Topping nước
(5, 2), (5, 3), (5, 4), -- Matcha: Đường, Đá, Topping nước
(6, 2), (6, 3)          -- Cà phê sữa: Đường, Đá
ON CONFLICT DO NOTHING;

-- Biến thể Size (Product Variants)
INSERT INTO product_variants (id, product_id, size_name, price_adjustment, sku) VALUES
(1, 1, 'Cấp 1 (Cay nhẹ)', 0, 'MC-BO-C1'),
(2, 1, 'Cấp 3 (Cay vừa)', 0, 'MC-BO-C3'),
(3, 1, 'Cấp 7 (Siêu cay)', 5000, 'MC-BO-C7'),
(4, 2, 'Cấp 1 (Cay nhẹ)', 0, 'MC-HS-C1'),
(5, 2, 'Cấp 3 (Cay vừa)', 0, 'MC-HS-C3'),
(6, 2, 'Cấp 7 (Siêu cay)', 5000, 'MC-HS-C7'),
(7, 3, 'Phần 4 miếng', 0, 'AK-GA-4M'),
(8, 3, 'Phần 8 miếng', 60000, 'AK-GA-8M'),
(9, 4, 'Size M', 0, 'NU-DAO-M'),
(10, 4, 'Size L', 8000, 'NU-DAO-L'),
(11, 5, 'Size M', 0, 'NU-MATCHA-M'),
(12, 5, 'Size L', 10000, 'NU-MATCHA-L')
ON CONFLICT (id) DO NOTHING;

-- 4. Nguyên liệu thô (Ingredients)
INSERT INTO ingredients (id, code, name, unit, cost_per_unit, current_stock, min_threshold) VALUES
(1, 'NL-BO', 'Thịt bò Mỹ đông lạnh', 'kg', 220000, 25.500, 5.000),
(2, 'NL-TOM', 'Tôm sú tươi sống', 'kg', 260000, 15.000, 3.000),
(3, 'NL-MUC', 'Mực ống tươi', 'kg', 180000, 12.000, 3.000),
(4, 'NL-MI', 'Mì sợi dai Hàn Quốc', 'gói', 8000, 150.000, 30.000),
(5, 'NL-TRUNG', 'Trứng gà tươi', 'quả', 3500, 200.000, 50.000),
(6, 'NL-XUCXICH', 'Xúc xích Đức xông khói', 'cây', 7000, 80.000, 20.000),
(7, 'NL-PHOMAI', 'Phô mai sợi Mozzarella', 'kg', 190000, 8.500, 2.000),
(8, 'NL-NAM', 'Nấm kim châm tươi', 'gói', 9000, 45.000, 10.000),
(9, 'NL-NUOCDUNG', 'Cốt nước dùng mì cay', 'lít', 25000, 40.000, 10.000),
(10, 'NL-TRA', 'Trà đen Phúc Long khô', 'g', 250, 5000.000, 1000.000),
(11, 'NL-CAPHE', 'Hạt cà phê rang Robusta', 'g', 200, 4500.000, 1000.000),
(12, 'NL-DAO-HOP', 'Đào ngâm Kronos', 'hộp', 42000, 20.000, 5.000),
(13, 'NL-CAM', 'Cam vàng tươi', 'kg', 45000, 18.000, 5.000),
(14, 'NL-SA', 'Sả cây tươi', 'kg', 20000, 10.000, 2.000),
(15, 'NL-SUA-TUOI', 'Sữa tươi thanh trùng Barista', 'ml', 35, 15000.000, 3000.000),
(16, 'NL-SUA-DAC', 'Sữa đặc Ông Thọ', 'g', 80, 8000.000, 1500.000),
(17, 'NL-DUONG', 'Đường cát trắng Biên Hòa', 'g', 24, 25000.000, 5000.000),
(18, 'NL-MATCHA', 'Bột Matcha Uji Nhật Bản', 'g', 1200, 1200.000, 300.000),
(19, 'NL-TRAN-CHAU', 'Trân châu đen tươi Gia Thịnh', 'g', 60, 6000.000, 1500.000),
(20, 'NL-NHA-DAM', 'Thạch nha đam Aloka', 'kg', 40000, 15.000, 3.000),
(21, 'NL-GA', 'Gà phi lê tươi CP', 'kg', 85000, 2.500, 5.000) -- Cảnh báo lowStock (2.5 <= 5.0)
ON CONFLICT (id) DO NOTHING;

-- 5. Công thức định lượng (Recipes - BOM 3 tầng)
INSERT INTO recipes (id, product_id, variant_id, modifier_option_id, ingredient_id, quantity_needed) VALUES
-- Mì Cay Bò Mỹ (Món gốc - Product ID 1)
(1, 1, NULL, NULL, 4, 1.000),    -- 1 gói mì sợi
(2, 1, NULL, NULL, 9, 0.500),    -- 0.5 lít nước cốt
(3, 1, NULL, NULL, 1, 0.100),    -- 0.1 kg thịt bò Mỹ
(4, 1, NULL, NULL, 8, 0.500),    -- 0.5 gói nấm kim châm

-- Mì Cay Bò Cấp 7 (Variant ID 3 - thêm nước cốt)
(5, NULL, 3, NULL, 9, 0.100),

-- Cà Phê Sữa Đá (Product ID 6)
(6, 6, NULL, NULL, 11, 25.000),  -- 25g cà phê
(7, 6, NULL, NULL, 16, 40.000),  -- 40g sữa đặc
(8, 6, NULL, NULL, 17, 5.000),   -- 5g đường

-- Trà Đào Cam Sả (Product ID 4)
(9, 4, NULL, NULL, 10, 15.000),  -- 15g trà đen
(10, 4, NULL, NULL, 13, 0.050),  -- 0.05 kg cam
(11, 4, NULL, NULL, 14, 0.030),  -- 0.03 kg sả
(12, 4, NULL, NULL, 17, 30.000), -- 30g đường

-- Trà Đào Size L (Variant ID 10)
(13, NULL, 10, NULL, 10, 5.000), -- thêm 5g trà
(14, NULL, 10, NULL, 17, 10.000),-- thêm 10g đường

-- Matcha Latte (Product ID 5)
(15, 5, NULL, NULL, 18, 10.000),  -- 10g bột matcha
(16, 5, NULL, NULL, 15, 150.000), -- 150ml sữa tươi
(17, 5, NULL, NULL, 16, 20.000),  -- 20g sữa đặc

-- Matcha Latte Size L (Variant ID 12)
(18, NULL, 12, NULL, 15, 50.000), -- thêm 50ml sữa tươi
(19, NULL, 12, NULL, 18, 3.000),  -- thêm 3g matcha

-- Toppings (Modifier Options)
(20, NULL, NULL, 1, 1, 0.080),    -- Thịt bò thêm (0.08 kg thịt bò)
(21, NULL, NULL, 2, 5, 1.000),    -- Trứng gà chần (1 quả trứng)
(22, NULL, NULL, 3, 6, 1.000),    -- Xúc xích Đức (1 cây)
(23, NULL, NULL, 4, 7, 0.050),    -- Phô mai sợi (0.05 kg phô mai)
(24, NULL, NULL, 5, 8, 0.500),    -- Nấm kim châm (0.5 gói)
(25, NULL, NULL, 13, 12, 0.200),  -- Miếng đào giòn thêm (0.2 hộp đào)
(26, NULL, NULL, 14, 20, 0.050),  -- Thạch nha đam (0.05 kg nha đam)
(27, NULL, NULL, 15, 19, 40.000)  -- Trân châu đen (40g trân châu)
ON CONFLICT (id) DO NOTHING;

-- 6. Giao dịch khởi tạo kho ban đầu (Inventory Transactions)
INSERT INTO inventory_transactions (ingredient_id, order_code, quantity, transaction_type, created_at)
SELECT id, 'INIT-STOCK-2026', current_stock, 'IMPORT', NOW()
FROM ingredients
ON CONFLICT DO NOTHING;

-- Cập nhật sequence tự tăng cho PostgreSQL sau khi chèn ID cố định
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('modifier_groups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM modifier_groups));
SELECT setval('modifier_options_id_seq', (SELECT COALESCE(MAX(id), 1) FROM modifier_options));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
SELECT setval('product_variants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_variants));
SELECT setval('ingredients_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ingredients));
SELECT setval('recipes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM recipes));
SELECT setval('inventory_transactions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM inventory_transactions));
