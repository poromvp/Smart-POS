-- ============================================================================
-- DỮ LIỆU MẪU CHO DỊCH VỤ CATALOG & INVENTORY SERVICE (pos_catalog_inventory_db)
-- ============================================================================
\c pos_catalog_inventory_db;

-- 1. DANH MỤC
INSERT INTO categories (id, name, display_order, is_active) VALUES
(1, 'Mì Cay', 1, true),
(2, 'Món Ăn Kèm', 2, true),
(3, 'Trà & Thức Uống', 3, true)
ON CONFLICT (id) DO NOTHING;

-- 2. NHÓM TÙY CHỌN (MODIFIER GROUPS)
INSERT INTO modifier_groups (id, name, is_multiple, is_required) VALUES
(1, 'Topping Mì Cay', true, false),
(2, 'Lượng Đường', false, false),
(3, 'Topping Thức Uống', true, false)
ON CONFLICT (id) DO NOTHING;

-- 3. CÁC TÙY CHỌN CON (MODIFIER OPTIONS)
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
(12, 3, 'Trân châu đen', 8000)
ON CONFLICT (id) DO NOTHING;

-- 4. MÓN ĂN (PRODUCTS)
INSERT INTO products (id, category_id, name, code, base_price, image_url, description, is_active, created_at) VALUES
(1, 1, 'Mì Cay Bò Mỹ', 'MC-BO', 75000, '/menu/beef-noodles.jpg', 'Mì sợi dai Hàn Quốc, thịt bò Mỹ cao cấp kết hợp nước dùng chua cay đậm đà chuẩn vị.', true, NOW()),
(2, 1, 'Mì Cay Hải Sản', 'MC-HS', 85000, '/menu/beef-noodles.jpg', 'Tôm sú tươi giòn ngọt, mực tươi kèm nấm kim châm và rau củ tươi ngon.', true, NOW()),
(3, 2, 'Gà Sốt Cay Hàn Quốc', 'AK-GA-CAY', 89000, '/menu/spicy-chicken.jpg', 'Gà giòn rụm áo sốt cay ngọt Hàn Quốc thơm nức mè rang.', true, NOW()),
(4, 3, 'Trà Đào Cam Sả', 'NU-TRA-DAO', 45000, '/menu/peach-tea.jpg', 'Trà thanh mát kết hợp lát đào giòn ngọt và hương sả thơm lừng giải nhiệt.', true, NOW()),
(5, 3, 'Matcha Latte', 'NU-MATCHA', 55000, '/menu/matcha-latte.jpg', 'Bột trà xanh Nhật Bản nguyên chất hòa quyện cùng sữa tươi béo ngậy.', true, NOW()),
(6, 3, 'Cà Phê Sữa Đá', 'NU-CF-SUA', 35000, '/menu/iced-coffee.jpg', 'Cà phê pha phin truyền thống đậm đà sánh quyện sữa đặc thơm béo.', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. BIẾN THỂ SIZE (PRODUCT VARIANTS)
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

-- 6. LIÊN KẾT MÓN ĂN VÀ NHÓM TÙY CHỌN (PRODUCT_MODIFIER_GROUPS)
INSERT INTO product_modifier_groups (product_id, modifier_group_id) VALUES
(1, 1),
(2, 1),
(4, 2),
(4, 3),
(5, 2),
(5, 3),
(6, 2)
ON CONFLICT DO NOTHING;

-- CẬP NHẬT LẠI SEQUENCE ĐỂ TRÁNH TRÙNG LẶP ID KHI THÊM MỚI BẰNG API
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('modifier_groups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM modifier_groups));
SELECT setval('modifier_options_id_seq', (SELECT COALESCE(MAX(id), 1) FROM modifier_options));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
SELECT setval('product_variants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_variants));
