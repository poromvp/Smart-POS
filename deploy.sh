#!/bin/bash
set -e

echo "=========================================================="
echo "   SMART POS & KDS - PRODUCTION DEPLOY SCRIPT"
echo "=========================================================="

# 1. Tạo Swap Memory (2GB) để đảm bảo không bị tràn RAM khi build
if [ $(swapon --show | wc -l) -le 1 ]; then
    echo "[1/5] Thiết lập 2GB Swap Memory để chống tràn RAM..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✓ Đã kích hoạt 2GB Swap thành công."
else
    echo "[1/5] Swap memory đã tồn tại, bỏ qua."
fi

# 2. Kiểm tra và cài đặt Docker nếu chưa có
echo "[2/5] Kiểm tra môi trường Docker..."
if ! command -v docker &> /dev/null; then
    echo "Docker chưa được cài đặt. Đang tiến hành cài đặt tự động..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✓ Cài đặt Docker hoàn tất."
else
    echo "✓ Docker đã sẵn sàng."
fi

# 3. Kiểm tra file cấu hình .env
echo "[3/5] Kiểm tra file cấu hình môi trường .env..."
if [ ! -f ".env" ]; then
    echo "Chưa có file .env, tự động tạo từ .env.production.example..."
    cp .env.production.example .env
    echo "✓ Đã tạo file .env. Bạn có thể chỉnh sửa lại sau bằng lệnh 'nano .env'."
else
    echo "✓ File .env đã tồn tại."
fi

# 4. Tạo thư mục uploads nếu chưa có
mkdir -p uploads/products

# 5. Build và khởi động toàn bộ hệ thống
echo "[4/5] Đang build và khởi động các container (Postgres, 4 Java Backend, Next.js, Nginx)..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

echo "[5/5] Kiểm tra trạng thái các container..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo "=========================================================="
echo "✓ DEPLOY THÀNH CÔNG!"
echo "Truy cập hệ thống tại: http://<ĐỊA_CHỈ_IP_MÁY_CHỦ>"
echo "Để xem log hệ thống: docker compose -f docker-compose.prod.yml logs -f"
echo "=========================================================="
