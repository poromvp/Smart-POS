-- ==========================================================
-- MIGRATION 04: BỔ SUNG CỘT KDS STATUS, VERSION VÀ AUDIT CHO SALES SERVICE
-- ==========================================================
\c pos_sales_db;

-- 1. Bổ sung các cột cho bảng orders (Optimistic Locking & Audit)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "version" BIGINT DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "table_id" BIGINT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "staff_id" BIGINT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancel_reason" VARCHAR(500);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancelled_by" VARCHAR(100);

-- 2. Bổ sung các cột cho bảng order_items (KDS tracking & Creation Time)
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "kds_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT now();

-- 3. Tạo index phục vụ tra cứu phân trang và báo cáo thống kê
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON "orders"("created_at");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "orders"("status");
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON "orders"("table_number");
CREATE INDEX IF NOT EXISTS idx_order_items_kds_status ON "order_items"("kds_status");

COMMENT ON COLUMN "orders"."version" IS 'Phiên bản phục vụ Optimistic Locking chống concurrency race condition';
COMMENT ON COLUMN "orders"."staff_id" IS 'Logical ID nhân viên phụ trách';
COMMENT ON COLUMN "order_items"."kds_status" IS 'Trạng thái chế biến của món: PENDING, COOKING, READY, SERVED';
