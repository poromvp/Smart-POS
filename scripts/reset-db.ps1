# Script reset CSDL Smart-POS và nạp lại toàn bộ schema & seed data
Write-Host "Đang dừng và dọn dẹp các container & volume cũ..." -ForegroundColor Yellow
docker compose down -v

Write-Host "Đang khởi động PostgreSQL và nạp dữ liệu init-scripts..." -ForegroundColor Cyan
docker compose up -d

Write-Host "Cơ sở dữ liệu Smart-POS đã được làm sạch và nạp lại cấu trúc mới nhất!" -ForegroundColor Green
