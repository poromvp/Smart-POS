-- ==========================================================
-- MIGRATION: BỔ SUNG CỘT CHO ORDER_ITEMS PHỤC VỤ TRỪ KHO TỰ ĐỘNG
-- ==========================================================
\c pos_sales_db;

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_id" BIGINT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_id" BIGINT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "item_id" VARCHAR(64);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "name" VARCHAR(255);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "modifier_total" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "modifier_option_ids" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "toppings" VARCHAR(500);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "sweetness" VARCHAR(50);

COMMENT ON COLUMN "order_items"."product_id" IS 'Logical ID tham chiếu sang pos_catalog_inventory_db.products.id';
COMMENT ON COLUMN "order_items"."variant_id" IS 'Logical ID tham chiếu sang pos_catalog_inventory_db.product_variants.id';
COMMENT ON COLUMN "order_items"."modifier_option_ids" IS 'Mảng JSON chứa các ID của modifier_options (Topping, Mức đường, Mức đá)';
