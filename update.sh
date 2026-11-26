#!/bin/bash
set -e

echo "=========================================================="
echo "   SMART POS & KDS - CẬP NHẬT TÍNH NĂNG MỚI (UPDATE)"
echo "=========================================================="

echo "[1/3] Đang kéo mã nguồn mới nhất từ GitHub..."
git pull origin hbao || git pull

echo "[2/3] Đang tự động build và áp dụng các cập nhật..."
docker compose -f docker-compose.prod.yml up -d --build

echo "[3/3] Kiểm tra trạng thái hệ thống sau khi cập nhật..."
docker compose -f docker-compose.prod.yml ps

echo "=========================================================="
echo "✓ CẬP NHẬT THÀNH CÔNG!"
echo "Toàn bộ dữ liệu database (món ăn, đơn hàng, tài khoản) vẫn được giữ nguyên an toàn."
echo "=========================================================="
