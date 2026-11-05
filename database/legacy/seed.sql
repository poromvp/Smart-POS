-- ==========================================================
-- DỮ LIỆU MẪU: IDENTITY SERVICE
-- ==========================================================
\c pos_identity_db;

INSERT INTO "roles" ("name", "description") VALUES 
('ADMIN', 'Quản trị viên toàn quyền'),
('CASHIER', 'Nhân viên thu ngân'),
('KITCHEN', 'Nhân viên bếp');

INSERT INTO "users" ("username", "password_hash", "full_name", "phone") VALUES 
('admin', '$2a$10$X/xyz123...', 'Kiệt Lê', '0901234567'),
('thungan1', '$2a$10$X/xyz123...', 'Nguyễn Thị A', '0911222333');

INSERT INTO "user_roles" ("user_id", "role_id") VALUES 
(1, 1), -- admin có quyền ADMIN
(2, 2); -- thungan1 có quyền CASHIER

-- ==========================================================
-- DỮ LIỆU MẪU: CATALOG & INVENTORY SERVICE
-- ==========================================================
\c pos_catalog_inventory_db;

-- Bàn ăn & Khu vực
INSERT INTO "areas" ("name", "description") VALUES ('Tầng 1', 'Khu vực máy lạnh'), ('Sân thượng', 'Khu vực ngoài trời');
INSERT INTO "dining_tables" ("area_id", "table_number", "capacity") VALUES 
(1, 'T1-01', 4), (1, 'T1-02', 4),
(2, 'ST-01', 6);

-- Menu: Danh mục & Sản phẩm
INSERT INTO "categories" ("name", "display_order") VALUES ('Cà phê', 1), ('Trà trái cây', 2);
INSERT INTO "products" ("category_id", "name", "code", "base_price") VALUES 
(1, 'Cà phê Sữa đá', 'CFSD', 25000),
(2, 'Trà Đào Cam Sả', 'TDCS', 35000);

-- Biến thể (Size)
INSERT INTO "product_variants" ("product_id", "size_name", "price_adjustment") VALUES 
(1, 'Size M', 0), (1, 'Size L', 5000),
(2, 'Size M', 0), (2, 'Size L', 10000);

-- Kho hàng nguyên liệu
INSERT INTO "ingredients" ("name", "code", "unit", "current_stock", "min_threshold") VALUES 
('Hạt Cà Phê Robusta', 'ING-CF', 'kg', 10.5, 2.0),
('Sữa Đặc Ngôi Sao', 'ING-MILK', 'hộp', 50, 10),
('Trà Đen', 'ING-TEA', 'kg', 5.0, 1.0);

-- Định lượng (Recipe) cho Cà phê Sữa đá (Product 1)
INSERT INTO "recipes" ("product_id", "ingredient_id", "quantity_needed") VALUES 
(1, 1, 0.02), -- 20g cà phê
(1, 2, 0.03); -- 30ml (0.03 hộp) sữa đặc

-- ==========================================================
-- DỮ LIỆU MẪU: SALES SERVICE
-- ==========================================================
\c pos_sales_db;

INSERT INTO "customers" ("phone", "full_name", "current_points") VALUES 
('0988777666', 'Trần Văn B', 150),
('0909090909', 'Lê Khách Mới', 0);

INSERT INTO "promotions" ("code", "name", "discount_percent", "start_date", "end_date") VALUES 
('OPENING', 'Khai trương giảm 10%', 10.00, '2026-10-01 00:00:00', '2026-12-31 23:59:59');