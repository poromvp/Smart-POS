# 🍽️ Smart Multi-Branch POS & Realtime KDS

## 📖 Giới thiệu (Introduction)
Dự án **Hệ thống Quản lý Chuỗi Nhà hàng, Gọi món Không chạm & Điều phối Bếp Thông minh** được phát triển nhằm hiện đại hóa quy trình vận hành F&B[cite: 1]. Hệ thống giúp xóa bỏ tình trạng chậm trễ trong giờ cao điểm thông qua tính năng gọi món bằng mã QR tại bàn, truyền đơn hàng tức thời đến trạm bếp và tự động hóa việc khấu trừ nguyên liệu tồn kho[cite: 1].

## ✨ Các tính năng chính (Core Features)
1. **📱 Gọi món không chạm (QR Ordering):** Khách hàng quét mã QR tại bàn để xem thực đơn thời gian thực, tùy chỉnh món (topping, ghi chú) và gửi đơn trực tiếp mà không cần cài ứng dụng[cite: 1].
2. **🍳 Màn hình điều phối bếp (KDS):** Hiển thị đơn hàng theo thời gian thực cho từng trạm (Bếp nóng, Bếp lạnh, Pha chế), có bộ đếm thời gian chờ, cảnh báo trễ hạn và nút xác nhận hoàn thành[cite: 1].
3. **📦 Quản lý kho định lượng (BOM):** Cấu hình công thức thành phần cho từng món ăn, hệ thống tự động trừ kho nguyên liệu thô theo thời gian thực khi bếp bắt đầu chế biến[cite: 1].
4. **💳 Thu ngân & Thanh toán:** Hỗ trợ tính tiền, gộp/tách bàn, chia hóa đơn (split-bill), và thanh toán qua mã VietQR động với khả năng tự nhận diện giao dịch[cite: 1].

## 🛠️ Công nghệ sử dụng (Tech Stack)
* **Frontend:** React.js (Web POS và giao diện KDS)[cite: 1].
* **Backend:** Node.js (NestJS) hoặc C# .NET 8 Web API[cite: 1].
* **Realtime Communication:** Socket.io hoặc SignalR[cite: 1].
* **Database:** MySQL hoặc PostgreSQL[cite: 1].
* **Phần cứng hỗ trợ:** Máy in hóa đơn ESC/POS mạng LAN/Bluetooth, Thiết bị Sunmi POS cảm ứng[cite: 1].

## 📂 Cấu trúc thư mục (Folder Structure)
Dự án được tổ chức thành các thư mục chính sau:
- `docs/`: Chứa các tài liệu thiết kế, API và hướng dẫn hệ thống.
- `frontend/`: Source code UI cho Web POS và màn hình KDS.
- `backend/`: Source code xử lý logic, API và kết nối CSDL.
- `database/`: Các file script khởi tạo cơ sở dữ liệu và cấu trúc bảng (ERD).

## 👥 Đội ngũ phát triển (Contributors)
* **Lê Quang Kiệt (Team Leader / Frontend)**
* **Thành viên 2 (Tên)**: BA / Tài liệu & UI Design
* **Thành viên 3 (Tên)**: Backend / CSDL
* **Thành viên 4 (Tên)**: Backend / Database Schema & BOM logic
* **Thành viên 5 (Tên)**: Infrastructure / Realtime & KDS Integration

## 📞 Thông tin liên hệ (Contact)
Nếu có bất kỳ thắc mắc hoặc cần hỗ trợ về dự án, vui lòng liên hệ:
- **Email:** quangkietle382@gmail.com / 3123410180@sv.sgu.edu.vn
- **Sinh viên:** Lê Quang Kiệt (MSSV: 3123410180)



sequenceDiagram
    autonumber
    actor Khach as 📱 Khách Hàng
    participant POS as 💻 Web POS (Thu Ngân)
    participant KDS as 🍳 KDS (Bếp)
    participant BE as ⚙️ Backend (Node/C#)
    participant DB as 🗄️ Database

    Khach->>BE: Quét mã QR, yêu cầu Menu
    BE-->>Khach: Trả về danh sách món ăn thời gian thực
    Khach->>BE: Tùy chỉnh món và gửi đơn trực tiếp
    BE->>DB: Lưu Order & OrderDetail
    DB-->>BE: Xác nhận đã lưu
    
    rect rgb(255, 230, 204)
    Note over BE, KDS: Giao tiếp Realtime (Socket)
    BE-)KDS: Truyền đơn tức thời xuống trạm bếp
    end

    KDS->>KDS: Hiển thị đếm giờ & Cảnh báo màu trễ hạn
    KDS->>BE: Bếp bấm "Hoàn thành" để báo phục vụ
    
    rect rgb(230, 255, 230)
    Note over BE, DB: Logic Trừ kho tự động (BOM)
    BE->>DB: Đọc công thức thành phần & Trừ nguyên liệu thô
    DB-->>BE: Khấu trừ thành công
    end

    BE-)POS: Cập nhật trạng thái nhận món lên Web POS
    
    POS->>BE: Yêu cầu mã thanh toán VietQR động
    BE-->>POS: Trả về mã VietQR
    Khach->>POS: Quét mã thanh toán
    BE-)POS: Nhận diện giao dịch thành công tự động
    BE->>DB: Cập nhật trạng thái Order hoàn thành
