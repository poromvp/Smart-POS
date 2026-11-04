-- ==========================================================
-- MIGRATION: BỔ SUNG CỘT CHO SALES SERVICE PHỤC VỤ TRỪ KHO TỰ ĐỘNG VÀ ĐỒNG BỘ
-- ==========================================================
\c pos_sales_db;

-- 1. Bổ sung các cột cho bảng order_items
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_id" BIGINT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_id" BIGINT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "item_id" VARCHAR(64);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "name" VARCHAR(255);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "modifier_total" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "modifier_option_ids" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "toppings" VARCHAR(500);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "sweetness" VARCHAR(50);
ALTER TABLE "order_items" ALTER COLUMN "total_price" DROP NOT NULL;

-- 2. Bổ sung các cột cho bảng orders (đồng bộ với Order entity)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "table_number" VARCHAR(32);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(32) DEFAULT 'UNPAID';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR(32);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "note" TEXT;

COMMENT ON COLUMN "order_items"."product_id" IS 'Logical ID tham chiếu sang pos_catalog_inventory_db.products.id';
COMMENT ON COLUMN "order_items"."variant_id" IS 'Logical ID tham chiếu sang pos_catalog_inventory_db.product_variants.id';
COMMENT ON COLUMN "order_items"."modifier_option_ids" IS 'Mảng JSON chứa các ID của modifier_options (Topping, Mức đường, Mức đá)';
