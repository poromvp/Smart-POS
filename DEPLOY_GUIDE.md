# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG SMART POS & KDS
*(Dành cho thành viên phụ trách quản lý máy chủ / Cloud)*

Tài liệu này hướng dẫn từng bước để triển khai (deploy) trọn gói toàn bộ hệ thống Smart POS & KDS lên máy chủ Ubuntu (Microsoft Azure, Google Cloud, DigitalOcean hoặc bất kỳ VPS nào) bằng Docker.

---

## 1. Chuẩn bị máy ảo (Cloud Virtual Machine)
* **Hệ điều hành:** Ubuntu 24.04 LTS hoặc 22.04 LTS x64.
* **Cấu hình tối thiểu:** 2 vCPU, 4GB RAM (Gói `Standard_B2s` trên Azure hoặc `e2-medium` trên Google Cloud).
* **Mở cổng tường lửa (Inbound Ports):** Bắt buộc mở cổng **22** (SSH), **80** (HTTP), và **443** (HTTPS).

Sau khi tạo xong máy ảo, bạn sẽ nhận được:
* **Địa chỉ IPv4 công khai** (Ví dụ: `20.198.54.120`).
* **Tài khoản đăng nhập** (Mặc định Azure là `azureuser`).

---

## 2. Quy trình Deploy chỉ với 4 câu lệnh

### Bước 1: Kết nối SSH vào máy chủ
Mở PowerShell hoặc Terminal trên máy tính của bạn và chạy:
```bash
ssh azureuser@<ĐỊA_CHỈ_IP_CỦA_MÁY_CHỦ>
```
*(Nhập mật khẩu máy chủ khi được hỏi).*

---

### Bước 2: Kéo mã nguồn dự án từ GitHub
Chạy các lệnh sau để tải source code mới nhất:
```bash
git clone https://github.com/poromvp/Smart-POS.git
cd Smart-POS
```
*(Nếu sau này nhóm có cập nhật code mới, chỉ cần chạy lệnh `git pull` để nhận code mới).*

---

### Bước 3: Phân quyền thực thi cho kịch bản deploy
```bash
chmod +x deploy.sh
```

---

### Bước 4: Chạy script Deploy tự động
```bash
./deploy.sh
```

**Script `deploy.sh` sẽ tự động thực hiện 100% các công việc sau:**
1. Tạo 2GB Swap Memory (chống tràn RAM khi build).
2. Tự cài đặt Docker & Docker Compose Engine (nếu máy ảo chưa có).
3. Tạo file cấu hình môi trường `.env` mẫu.
4. Tự động build và khởi động 7 container:
   - `PostgreSQL 16` (tự động nạp CSDL & dữ liệu mẫu từ `init-scripts`).
   - `Auth Service` (Spring Boot :8081).
   - `Catalog & Inventory Service` (Spring Boot :8082).
   - `Sales Service` (Spring Boot WebSocket :8083).
   - `API Gateway` (Spring Cloud Gateway :8088).
   - `Frontend` (Next.js 16 :3000).
   - `Nginx Reverse Proxy` (Cổng 80 - tiếp nhận mọi request bên ngoài).

---

## 3. Kiểm tra kết quả sau khi Deploy

Mở trình duyệt bất kỳ (trên điện thoại hoặc laptop), truy cập vào:
```
http://<ĐỊA_CHỈ_IP_CỦA_MÁY_CHỦ>
```

### Các đường dẫn kiểm thử chính:
* **Giao diện bán hàng (POS):** `http://<IP>/pos`
* **Màn hình bếp (KDS):** `http://<IP>/kds`
* **Trang quản trị (Admin):** `http://<IP>/admin`
* **Gọi món qua mã QR tại bàn 01:** `http://<IP>/menu?table=01`

*(Dùng camera điện thoại quét mã QR từ màn hình POS hoặc in mã QR có chứa đường link trên để thử nghiệm tính năng gọi món).*

---

## 4. Các câu lệnh quản trị thường dùng trên Server

* **Xem trạng thái các container:**
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```

* **Xem log toàn bộ hệ thống theo thời gian thực:**
  ```bash
  docker compose -f docker-compose.prod.yml logs -f
  ```

* **Xem log riêng của 1 dịch vụ (ví dụ Gateway hoặc Sales):**
  ```bash
  docker compose -f docker-compose.prod.yml logs -f gateway
  docker compose -f docker-compose.prod.yml logs -f sales-service
  ```

* **Khởi động lại toàn bộ hệ thống:**
  ```bash
  docker compose -f docker-compose.prod.yml restart
  ```

* **Dừng toàn bộ hệ thống:**
  ```bash
  docker compose -f docker-compose.prod.yml down
  ```

* **Khi có code mới từ GitHub, cập nhật lại:**
  ```bash
  git pull
  ./deploy.sh
  ```
