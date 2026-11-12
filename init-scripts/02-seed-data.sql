-- ============================================================================
-- DỮ LIỆU MẪU TOÀN DIỆN CHO CẢ 3 DỊCH VỤ MICROSERVICES (SMART-POS)
-- ============================================================================

-- ============================================================================
-- DỊCH VỤ 1: IDENTITY SERVICE (pos_identity_db)
-- ============================================================================
\c pos_identity_db;

INSERT INTO "roles" ("id", "name", "description", "is_system") VALUES 
(1, 'ADMIN', 'Quản trị viên toàn quyền', true),
(2, 'CASHIER', 'Nhân viên thu ngân', true),
(3, 'CHEF', 'Nhân viên bếp', true),
(4, 'MANAGER', 'Quản lý nhà hàng', true),
(5, 'WAITER', 'Nhân viên phục vụ', true)
ON CONFLICT (id) DO NOTHING;
SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles));

-- Users, Permissions & Role-Permissions sẽ được khởi tạo đồng bộ bởi Auth Service (DataInitializer)
-- với mật khẩu mặc định là 12345678 cho 10 tài khoản kiểm thử (2 tài khoản/vai trò).

-- ============================================================================
-- DỊCH VỤ 2: CATALOG & INVENTORY SERVICE (pos_catalog_inventory_db)
-- ============================================================================
\c pos_catalog_inventory_db;

-- 1. KHU VỰC & BÀN ĂN (Đủ 20 bàn khớp sơ đồ POS)
INSERT INTO "areas" ("id", "name", "description") VALUES 
(1, 'Tầng 1', 'Khu vực máy lạnh'), 
(2, 'Tầng 2 (VIP)', 'Khu vực yên tĩnh cho nhóm'),
(3, 'Sân thượng', 'Khu vực ngoài trời thoáng mát')
ON CONFLICT (id) DO NOTHING;
SELECT setval('areas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM areas));

INSERT INTO "dining_tables" ("id", "area_id", "table_number", "capacity", "status") VALUES 
(1, 1, '1', 4, 'OCCUPIED'), 
(2, 1, '2', 4, 'OCCUPIED'),
(3, 1, '3', 4, 'OCCUPIED'),
(4, 1, '4', 4, 'EMPTY'),
(5, 1, '5', 4, 'OCCUPIED'),
(6, 1, '6', 4, 'EMPTY'),
(7, 1, '7', 4, 'EMPTY'),
(8, 1, '8', 6, 'OCCUPIED'),
(9, 2, '9', 4, 'EMPTY'),
(10, 2, '10', 4, 'EMPTY'),
(11, 2, '11', 6, 'EMPTY'),
(12, 2, '12', 6, 'EMPTY'),
(13, 2, '13', 8, 'RESERVED'),
(14, 2, '14', 4, 'EMPTY'),
(15, 3, '15', 4, 'EMPTY'),
(16, 3, '16', 4, 'EMPTY'),
(17, 3, '17', 6, 'EMPTY'),
(18, 3, '18', 6, 'EMPTY'),
(19, 3, '19', 4, 'EMPTY'),
(20, 3, '20', 8, 'EMPTY')
ON CONFLICT (id) DO NOTHING;
SELECT setval('dining_tables_id_seq', (SELECT COALESCE(MAX(id), 1) FROM dining_tables));

-- 2. DANH MỤC THỰC ĐƠN
INSERT INTO categories (id, name, display_order, is_active) VALUES
(1, 'Mì Cay', 1, true),
(2, 'Món Ăn Kèm', 2, true),
(3, 'Trà & Thức Uống', 3, true)
ON CONFLICT (id) DO NOTHING;
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));

-- 3. NHÓM TÙY CHỌN (MODIFIER GROUPS)
INSERT INTO modifier_groups (id, name, is_multiple, is_required) VALUES
(1, 'Topping Mì Cay', true, false),
(2, 'Lượng Đường', false, false),
(3, 'Topping Thức Uống', true, false),
(4, 'Lượng Đá', false, false)
ON CONFLICT (id) DO NOTHING;
SELECT setval('modifier_groups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM modifier_groups));

-- 4. CÁC TÙY CHỌN CON (MODIFIER OPTIONS)
INSERT INTO modifier_options (id, group_id, name, price) VALUES
(1, 1, 'Thịt bò thêm', 25000),
(2, 1, 'Trứng gà chần', 10000),
(3, 1, 'Xúc xích Đức', 15000),
(4, 1, 'Phô mai sợi', 15000),
(5, 1, 'Nấm kim châm', 8000),
(6, 2, '100% đường (Bình thường)', 0),
(7, 2, '70% đường', 0),
(8, 2, '50% đường (Ít ngọt)', 0),
(9, 2, 'Không đường', 0),
(10, 3, 'Miếng đào giòn thêm', 10000),
(11, 3, 'Thạch nha đam', 8000),
(12, 3, 'Trân châu đen', 8000),
(13, 4, '100% đá', 0),
(14, 4, '50% đá', 0),
(15, 4, 'Không đá', 0)
ON CONFLICT (id) DO NOTHING;
SELECT setval('modifier_options_id_seq', (SELECT COALESCE(MAX(id), 1) FROM modifier_options));

-- 5. MÓN ĂN (PRODUCTS)
INSERT INTO products (id, category_id, name, code, base_price, image_url, description, is_active, created_at) VALUES
(1, 1, 'Mì Cay Bò Mỹ', 'MC-BO', 75000, '/menu/beef-noodles.jpg', 'Mì sợi dai Hàn Quốc, thịt bò Mỹ cao cấp kết hợp nước dùng chua cay đậm đà chuẩn vị.', true, NOW()),
(2, 1, 'Mì Cay Hải Sản', 'MC-HS', 85000, '/menu/beef-noodles.jpg', 'Tôm sú tươi giòn ngọt, mực tươi kèm nấm kim châm và rau củ tươi ngon.', true, NOW()),
(3, 2, 'Gà Sốt Cay Hàn Quốc', 'AK-GA-CAY', 89000, '/menu/spicy-chicken.jpg', 'Gà giòn rụm áo sốt cay ngọt Hàn Quốc thơm nức mè rang.', true, NOW()),
(4, 3, 'Trà Đào Cam Sả', 'NU-TRA-DAO', 45000, '/menu/peach-tea.jpg', 'Trà thanh mát kết hợp lát đào giòn ngọt và hương sả thơm lừng giải nhiệt.', true, NOW()),
(5, 3, 'Matcha Latte', 'NU-MATCHA', 55000, '/menu/matcha-latte.jpg', 'Bột trà xanh Nhật Bản nguyên chất hòa quyện cùng sữa tươi béo ngậy.', true, NOW()),
(6, 3, 'Cà Phê Sữa Đá', 'NU-CF-SUA', 35000, '/menu/iced-coffee.jpg', 'Cà phê pha phin truyền thống đậm đà sánh quyện sữa đặc thơm béo.', true, NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));

-- 6. BIẾN THỂ SIZE (PRODUCT VARIANTS)
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
SELECT setval('product_variants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_variants));

-- 7. LIÊN KẾT MÓN ĂN VÀ NHÓM TÙY CHỌN (PRODUCT_MODIFIER_GROUPS)
INSERT INTO product_modifier_groups (product_id, modifier_group_id) VALUES
(1, 1),
(2, 1),
(4, 2),
(4, 3),
(5, 2),
(5, 3),
(4, 4),
(5, 4),
(6, 2),
(6, 4)
ON CONFLICT DO NOTHING;

-- 8. KHO HÀNG NGUYÊN LIỆU (INGREDIENTS)
INSERT INTO "ingredients" ("id", "name", "code", "unit", "current_stock", "min_threshold", "cost_per_unit", "is_active") VALUES 
(1, 'Thịt Bò Mỹ', 'NL-BO', 'kg', 25.000, 5.000, 250000, true),
(2, 'Mì Tròn Hàn Quốc', 'NL-MI', 'gói', 150.000, 20.000, 15000, true),
(3, 'Tôm Sú Tươi', 'NL-TOM', 'kg', 20.000, 3.000, 280000, true),
(4, 'Đào Hộp Kronos', 'NL-DAO', 'hộp', 50.000, 5.000, 45000, true),
(5, 'Trà Đen Phúc Long', 'NL-TRA-DEN', 'kg', 15.000, 2.000, 120000, true),
(6, 'Rau Củ Tươi', 'NL-RAU', 'kg', 30.000, 5.000, 20000, true),
(7, 'Sữa Đặc Ngôi Sao', 'NL-MILK', 'hộp', 60.000, 10.000, 22000, true),
(8, 'Cà Phê Robusta', 'NL-CF', 'kg', 15.000, 3.000, 180000, true)
ON CONFLICT (id) DO NOTHING;
SELECT setval('ingredients_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ingredients));

-- 9. ĐỊNH LƯỢNG CÔNG THỨC (RECIPES)
INSERT INTO "recipes" ("product_id", "ingredient_id", "quantity_needed") VALUES 
(1, 1, 0.150), -- Mì Cay Bò Mỹ: 150g thịt bò
(1, 2, 1.000), -- Mì Cay Bò Mỹ: 1 gói mì
(1, 6, 0.100), -- Mì Cay Bò Mỹ: 100g rau củ
(2, 3, 0.150), -- Mì Cay Hải Sản: 150g tôm sú
(2, 2, 1.000), -- Mì Cay Hải Sản: 1 gói mì
(2, 6, 0.100), -- Mì Cay Hải Sản: 100g rau củ
(4, 4, 0.100), -- Trà Đào Cam Sả: 0.1 hộp đào
(4, 5, 0.030), -- Trà Đào Cam Sả: 30g trà đen
(6, 8, 0.025), -- Cà Phê Sữa Đá: 25g cà phê
(6, 7, 0.030)  -- Cà Phê Sữa Đá: 30ml sữa đặc
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DỊCH VỤ 3: SALES SERVICE (pos_sales_db)
-- ============================================================================
\c pos_sales_db;

-- 1. KHÁCH HÀNG THÂN THIẾT
INSERT INTO "customers" ("id", "phone", "full_name", "current_points", "total_spent") VALUES 
(1, '0988777666', 'Trần Văn Bình (VIP)', 250, 2500000),
(2, '0909090909', 'Lê Khách Mới', 0, 0)
ON CONFLICT (id) DO NOTHING;
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM customers));

-- 2. KHUYẾN MÃI
INSERT INTO "promotions" ("id", "code", "name", "discount_percent", "start_date", "end_date", "is_active") VALUES 
(1, 'OPENING', 'Khai trương giảm 10%', 10.00, '2026-10-01 00:00:00', '2026-12-31 23:59:59', true),
(2, 'VIP5', 'Khách VIP giảm 5%', 5.00, '2026-10-01 00:00:00', '2026-12-31 23:59:59', true)
ON CONFLICT (id) DO NOTHING;
SELECT setval('promotions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM promotions));
