# PROJECT_CONTEXT.md

## Source-backed academic context

The proposal document defines the topic as:

**Hệ thống Quản lý Chuỗi Nhà hàng, Gọi món Không chạm & Điều phối Bếp Thông minh**

The proposal structure includes:

1. Lý do chọn đề tài/tính cấp thiết
2. Tổng quan/lịch sử nghiên cứu
3. Mục đích nghiên cứu
4. Nhiệm vụ nghiên cứu
5. Đối tượng và phạm vi
6. Phương pháp nghiên cứu
7. Giả thuyết/đóng góp
8. Kế hoạch nghiên cứu
9. Nội dung tiểu luận

Planned report chapters:

- Chương 1: Mở đầu
- Chương 2: Cơ sở lý thuyết và tổng quan tài liệu
- Chương 3: Phân tích yêu cầu hệ thống
- Chương 4: Thiết kế hệ thống
- Chương 5: Triển khai và thực hiện
- Chương 6: Kết quả thực hiện
- Chương 7: Kết luận và đề xuất

## Product concept

The project concept is a restaurant platform combining:

- contactless QR ordering at table,
- realtime kitchen display/coordination (KDS),
- POS/cashier operations,
- ingredient inventory management using recipe/BOM quantities,
- payment and operational flows.

## Current UI baseline observed

Current screens supplied by the team show:

- Landing/home screen for Smart POS & KDS.
- Customer menu with categories and menu cards.
- Customer cart with cash/VietQR payment choices.
- KDS with hot/cold/beverage stations, order cards, elapsed time, target time, warning/late states and completion action.
- POS with table map, current order and payment action.
- Login with internal roles.
- Admin dashboard placeholder.
- Waiter/order-taking placeholder.

## Assigned implementation scope

For Nguyễn Hoàng Lập:

- Mobile UI for QR ordering.
- Tablet UI for KDS.
- Timer logic.
- Late-order warning.
- Report sections 5.2 and 5.3.

## Important distinction

This file is a working project context, not a substitute for the official academic proposal or a backend API specification.

If a future requirement is not supported by:

1. the official proposal,
2. an agreed team document/API contract,
3. or an explicit user decision,

mark it as an assumption before implementing it.
