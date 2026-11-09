# TỔNG QUAN TÀI LIỆU DỰ ÁN SMART-POS

> **Hệ thống Quản lý Chuỗi Nhà hàng, Gọi món Không chạm (QR Ordering) & Điều phối Bếp Thông minh (KDS)**  
> Cấu trúc thư mục tài liệu được chuẩn hóa và phân loại khoa học theo từng phân hệ.

---

## 🗂️ CẤU TRÚC THƯ MỤC TÀI LIỆU (DOCUMENTATION SITEMAP)

```
docs/
├── README.md                                          # Mục lục & Điều hướng tổng thể
├── academic/                                          # Đề cương & Báo cáo học thuật đồ án
│   ├── PROJECT_CONTEXT.md                             # Bối cảnh & Mục tiêu đề tài đồ án
│   ├── smartpos_required.pdf                          # Đề bài & Yêu cầu đồ án chính thức
│   ├── Mau_DeCuong.docx                               # Đề cương mẫu nghiên cứu
│   ├── DACN_08_Nhom2B_BC_01.docx                      # Báo cáo tiến độ đồ án chính thức
│   └── AI_WORKFLOW.md                                 # Quy trình cộng tác AI Pair Programming
├── architecture/                                      # Kiến trúc, Thiết kế & Giao diện
│   ├── diagrams/                                      # Sơ đồ hệ thống (BPMN, Sequence, Usecase, BFD)
│   ├── ui/wireframes/                                 # Bản vẽ Wireframe các màn hình (WF01 - WF09)
│   ├── SALES_CATALOG_INTEGRATION_SPEC.md              # Đặc tả giao tiếp liên dịch vụ Sales - Catalog (BOM)
│   └── PLAN.md                                        # Kế hoạch kiến trúc ban đầu
├── services/                                          # Tài liệu kỹ thuật chuyên sâu theo Microservice
│   ├── sales-service/                                 # Phân hệ Bán hàng, Thu ngân POS, Bếp KDS & WebSocket
│   │   ├── KE_HOACH_HOAN_THIEN_SALES_SERVICE.md       # Kế hoạch hoàn thiện Sales Service (5 giai đoạn)
│   │   ├── ke-hoach-dong-bo-sales-va-frontend.md      # Kế hoạch đồng bộ Backend - Frontend
│   │   └── bao-cao-kiem-tra-hoan-thanh-sales-va-frontend.md # Báo cáo nghiệm thu Sales & Frontend
│   └── catalog-inventory-service/                     # Phân hệ Thực đơn, Định lượng BOM & Quản lý Kho
│       ├── CATALOG_INVENTORY_PLAN.md                  # Kế hoạch khắc phục Catalog & Inventory
│       ├── CATALOG_INVENTORY_FIX_REPORT.md            # Báo cáo khắc phục lỗi Catalog & Inventory
│       ├── CATALOG_INVENTORY_EVALUATION.md            # Báo cáo đánh giá chi tiết dịch vụ
│       ├── bang1.png                                  # Ảnh biểu đồ phụ trợ
│       └── bang2.png                                  # Ảnh biểu đồ phụ trợ
└── testing/                                           # Kế hoạch & Báo cáo Kiểm thử phần mềm (QA)
    ├── KE_HOACH_BO_SUNG_TEST_SALES_SERVICE.md         # Kế hoạch bổ sung test chuyên sâu (Unit & Integration)
    ├── ke-hoach-kiem-thu-toan-dien.md                 # Kế hoạch kiểm thử toàn diện hệ thống
    ├── ke-hoach-unit-test-va-integration-test.md      # Kế hoạch Unit & Integration Test
    ├── bao-cao-danh-gia-kiem-thu.md                   # Báo cáo đánh giá kết quả kiểm thử
    └── Bao_Cao_Chi_Tiet_99_Test_Cases_SmartPOS.docx   # Báo cáo chi tiết 99 Test Cases đồ án
```

---

## 📌 HƯỚNG DẪN TRA CỨU NHANH THEO MỤC TIÊU

| Bạn đang tìm kiếm... | Tệp tài liệu nên xem |
| :--- | :--- |
| **Bối cảnh, đề bài đồ án & yêu cầu giảng viên** | [`academic/PROJECT_CONTEXT.md`](academic/PROJECT_CONTEXT.md) & [`academic/smartpos_required.pdf`](academic/smartpos_required.pdf) |
| **Sơ đồ Use Case, BPMN, Sequence POS** | [`architecture/diagrams/`](architecture/diagrams/) |
| **Thiết kế giao diện POS, KDS, Giỏ hàng QR** | [`architecture/ui/wireframes/`](architecture/ui/wireframes/) |
| **Đặc tả kết nối trừ kho BOM (OpenFeign)** | [`architecture/SALES_CATALOG_INTEGRATION_SPEC.md`](architecture/SALES_CATALOG_INTEGRATION_SPEC.md) |
| **Kế hoạch hoàn thiện Sales Service & WebSocket** | [`services/sales-service/KE_HOACH_HOAN_THIEN_SALES_SERVICE.md`](services/sales-service/KE_HOACH_HOAN_THIEN_SALES_SERVICE.md) |
| **Kế hoạch & Báo cáo Catalog & Kho nguyên liệu** | [`services/catalog-inventory-service/CATALOG_INVENTORY_PLAN.md`](services/catalog-inventory-service/CATALOG_INVENTORY_PLAN.md) |
| **Kế hoạch bổ sung bài test Backend & Frontend** | [`testing/KE_HOACH_BO_SUNG_TEST_SALES_SERVICE.md`](testing/KE_HOACH_BO_SUNG_TEST_SALES_SERVICE.md) |
| **Báo cáo chi tiết các Test Cases nghiệm thu** | [`testing/Bao_Cao_Chi_Tiet_99_Test_Cases_SmartPOS.docx`](testing/Bao_Cao_Chi_Tiet_99_Test_Cases_SmartPOS.docx) |
