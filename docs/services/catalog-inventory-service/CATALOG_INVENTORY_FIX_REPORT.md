# 📋 BÁO CÁO KỸ THUẬT: KẾT QUẢ KHẮC PHỤC TOÀN DIỆN (GIAI ĐOẠN 1, 2, 3) & KẾ HOẠCH GIAI ĐOẠN 4

> **Dự án:** Smart-POS (Hệ thống Quản lý Bán hàng & Quản trị Nhà hàng Đa Nền tảng)  
> **Phân hệ trọng tâm:** `catalog-inventory-service` (Backend Spring Boot 4 / Java 25) & Next.js 16 / React 19 (Frontend)  
> **Thời điểm cập nhật:** Ngày 01/11/2026  
> **Tài liệu tham chiếu:** [`docs/CATALOG_INVENTORY_EVALUATION.md`](./CATALOG_INVENTORY_EVALUATION.md) (Giữ nguyên vẹn theo đúng quy định)  
> **Tài liệu tích hợp liên dịch vụ:** [`docs/SALES_CATALOG_INTEGRATION_SPEC.md`](./SALES_CATALOG_INTEGRATION_SPEC.md)

---

## 📌 PHẦN 1: TỔNG KẾT KHẮC PHỤC LỖI NGHIÊM TRỌNG (GIAI ĐOẠN 1 - ƯU TIÊN P0)

Trong Giai đoạn 1, toàn bộ các lỗi nghiêm trọng gây tê liệt giao diện, sai lệch dữ liệu tồn kho số lẻ, lỗi race condition cộng đúp tồn kho và mất thông báo lỗi validation đã được xử lý triệt để:

1. **[FE-01] Khắc phục Bão Request & Ổn Định Màn Hình `/admin/menu-bom`:**
   - Memoize các hàm toast trong `ToastProvider.tsx` (`useCallback`, `useMemo`) để triệt tiêu vòng lặp re-render vô tận.
   - Sửa logic chọn món tại `menu-bom/page.tsx`: bảo toàn `selectedProductId` đang thao tác khi danh mục tải lại, chống reset về món số 1.
2. **[DB-01 & DB-02] Đồng Bộ Schema Cơ Sở Dữ Liệu Docker & Chuẩn Hóa Dữ Liệu Mẫu:**
   - Chuyển `current_stock`, `min_threshold` sang `decimal(12,3)` trong `01-init-all-databases.sql`.
   - Bổ sung cột `"order_code" varchar(50)` vào `inventory_transactions`.
   - Bổ sung nhóm tùy chọn 4 ("Lượng Đá") vào `02-seed-data.sql` và thêm nguyên liệu `NL-RAU` để khởi tạo thành công phiếu `PO-20261030-1002`.
   - Tháo bỏ `CascadeType.ALL` trên `Category.products` tránh xóa nhầm dữ liệu thực đơn.
3. **[BE-02] Triệt Tiêu Race Condition Cộng Đúp Tồn Kho Khi Duyệt Phiếu Nhập:**
   - Bổ sung truy vấn khóa bi quan hàng phiếu nhập `@Lock(LockModeType.PESSIMISTIC_WRITE)` `findWithDetailsByIdWithLock(id)`.
   - Luồng duyệt sau sẽ đợi luồng trước commit, sau đó đọc lại trạng thái đã là `COMPLETED` và bị từ chối ngay.
   - Bổ sung `@EntityGraph` loại bỏ hoàn toàn vấn đề N+1 query.
4. **[EX-01 & EX-02] Chuẩn Hóa Cơ Chế Xử Lý Ngoại Lệ & Hiển Thị Lỗi Chi Tiết:**
   - `GlobalExceptionHandler.java`: Tự động gom toàn bộ `FieldError` vào chuỗi `detail` tiếng Việt; bổ sung 7 handler ngoại lệ phổ biến (`DataIntegrityViolationException`, `MaxUploadSizeExceededException`, v.v.).
   - `frontend/src/lib/api.ts`: Bóc tách mảng `errorJson.errors` ưu tiên hiển thị chi tiết lên Toast người dùng.
5. **[DB-03 & BE-05 & FE-07] Bổ Sung Cờ Trạng Thái `is_active` Cho Nguyên Liệu & Nhóm Topping:**
   - Cơ sở dữ liệu: Cột `"is_active" boolean DEFAULT true` trên bảng `ingredients` và `modifier_groups`.
   - Entity & DTO: Thêm `isActive` vào các Entity, Create/Update Request và Response.
   - Chặn xóa cứng khi đã có liên kết lịch sử, cung cấp API toggle trạng thái `PATCH .../status` và bộ lọc `activeOnly`.
   - Frontend: Bổ sung bộ lọc 3 nút ("Tất cả", "Đang dùng", "Ngừng dùng") và nút gạt bật/tắt nhanh 1 click.

---

## 🎯 PHẦN 2: KẾT QUẢ THỰC HIỆN GIAI ĐOẠN 2 (P1: NGHIỆP VỤ CỐT LÕI & TRẢI NGHIỆM BÁN HÀNG)

Theo các phương án đã được thống nhất từ 5 điểm nghiệp vụ:

1. **[BE-01] Chuẩn hóa mã `code` và hỗ trợ xóa trắng ô nhập liệu tùy chọn:**
   - Áp dụng phương thức `trimToNull()` / `trimToNullUpper()` tại `ProductServiceImpl` và `SupplierServiceImpl`.
   - Các chuỗi rỗng `""` được chuẩn hóa thành `null` trước khi lưu DB, cho phép người dùng xóa trắng thông tin (`code`, `description`, `imageUrl`, `email`, `address`) mà không bị lỗi trùng lặp `UNIQUE` trên cột `code`.
2. **[BE-BOM] Định lượng Topping theo phạm vi món (Per-Product Scope BOM):**
   - Hỗ trợ lưu công thức định lượng Topping gắn với cả `productId` và `modifierOptionId`.
   - Khi trừ kho (`InventoryServiceImpl.java`), hệ thống ưu tiên tìm định lượng riêng của món trước (`product_id = :pId AND modifier_option_id = :optId`). Nếu không có, tự động chuyển sang lấy định lượng chung toàn cục (`product_id IS NULL AND modifier_option_id = :optId`).
3. **[BE-03 & FE-03] Nghiệp vụ Kiểm kê kho (`AUDIT_ADJUST`) & Xuất hủy hỏng hóc (`SPOILAGE`):**
   - **Backend:** Thêm DTO `InventoryAdjustmentRequest`, `InventoryAdjustmentResponse`, phương thức `adjustInventory` có khóa bi quan `@Lock(PESSIMISTIC_WRITE)`, endpoint `POST /api/inventory/adjust`.
   - **Nghiệp vụ:**
     - *Kiểm kê (`AUDIT_ADJUST`):* Thủ kho nhập số lượng đếm thực tế `actualStock` $\rightarrow$ hệ thống tự tính độ lệch `diffQuantity = actualStock - currentStock` và đồng bộ thẻ kho.
     - *Xuất hủy (`SPOILAGE`):* Nhập số lượng hao hụt/hư hỏng kèm lý do $\rightarrow$ hệ thống trừ kho và ghi nhận giao dịch `SPOILAGE`.
   - **Frontend:** Xây dựng modal cảm ứng chuyên dụng `InventoryAdjustmentModal.tsx` và tích hợp tại `/admin/inventory`.
4. **[BE-04 & LAN-Friendly] Phục vụ ảnh món ăn thân thiện qua mạng LAN:**
   - `FileStorageService.java` trả về URL tương đối `/uploads/products/<storedFileName>`.
   - `frontend/next.config.mjs` bổ sung cấu hình proxy rewrite `/uploads/:path*` trỏ tới `http://localhost:8082/uploads/:path*`, giúp hiển thị hình ảnh hoàn hảo trên điện thoại thực khách khi quét QR tại bàn qua Wi-Fi nội bộ.
5. **[FE-02 & FE-03] Tối ưu trải nghiệm POS Thu ngân & Giỏ hàng QR Order:**
   - Xây dựng component `PosItemModal.tsx` trên giao diện POS (`/pos`): chọn Size, tick chọn Topping, tính chuẩn đơn giá `finalPrice`, hiển thị chi tiết Size và Topping trên dòng hóa đơn `InvoicePanel.tsx`.
   - `ModifierModal.tsx` (QR Order): Ràng buộc bắt buộc chọn đối với nhóm `isRequired = true` trước khi thêm vào giỏ hàng, cho phép click để bỏ chọn (uncheck) các radio option không bắt buộc.
   - `FloatingCart.tsx`: Bổ sung hiển thị tên biến thể Size dưới tên món ăn.
6. **[Tài liệu liên dịch vụ] Đặc tả tích hợp `sales-service` và Gateway:**
   - Soạn thảo và ban hành tài liệu [`docs/SALES_CATALOG_INTEGRATION_SPEC.md`](./SALES_CATALOG_INTEGRATION_SPEC.md) hướng dẫn chi tiết sơ đồ mạng Docker, cấu hình Gateway route, cấu trúc bảng `order_items` lưu `variant_id` và `modifier_option_ids`, cùng mã mẫu FeignClient gọi `POST /api/inventory/deduct` kèm retry idempotent.

---

## ⚡ PHẦN 3: KẾT QUẢ THỰC HIỆN GIAI ĐOẠN 3 (P2: TỐI ƯU RÀNG BUỘC & HOÀN THIỆN UI)

Giai đoạn 3 đã hoàn tất toàn bộ các hạng mục tối ưu validation, chi tiết UI và dọn dẹp mã nguồn thừa:

### 3.1. [EX-03] Bổ Sung Ràng Buộc Dữ Liệu Chặt Chẽ Cho Các DTO
- Gắn `@Digits(integer = 10, fraction = 2, message = "...")` cho các trường tiền tệ trên các DTO:
  - `ProductCreateRequest` & `ProductUpdateRequest`: trường `basePrice`.
  - `ProductVariantRequest`: trường `priceAdjustment`.
  - `ModifierOptionRequest`: trường `price`.
- `DeductItemRequest`: Bổ sung `@NotNull` cho `productId` và `quantity`, đồng thời tạo hàm getter null-safe `getModifierOptionIds()` (trả về danh sách rỗng nếu client gửi `null`), triệt tiêu hoàn toàn nguy cơ `NullPointerException` khi trừ kho.

### 3.2. [FE-04] Quản Lý Chi Tiết Nhóm Topping & Bảo Toàn Trạng Thái Danh Mục
- **`ModifierGroupModal.tsx` & `api.ts`:**
  - Bổ sung `updateModifierGroup(id, data)` và nút icon bút chì (`<Edit2 />`) cạnh tên nhóm: cho phép đổi tên nhóm trực tiếp inline một chạm mà không cần xóa đi tạo lại.
  - Bổ sung hàm API `addOptionToGroup` và `deleteOptionFromGroup`.
  - Thêm form nhập nhanh một chạm: thêm ngay Option mới (Tên option, Phụ thu) vào nhóm đang sửa mà không cần thao tác phức tạp.
  - Thêm nút xóa (`×`) cho từng option lẻ kèm cảnh báo xác nhận trước khi xóa.
- **`CategoryModal.tsx` & `api.ts`:**
  - Khắc phục lỗi reset `isActive`: lưu giữ trạng thái `editIsActive` khi bắt đầu sửa (`handleStartEdit`) và gửi đúng `isActive` khi gọi `updateCategory`.
  - Bổ sung nút chuyển đổi trạng thái `Đang dùng` / `Ngừng dùng` ngay trong form chỉnh sửa dòng danh mục.
  - Bổ sung badge hiển thị trạng thái và nút toggle trạng thái 1 click cho danh mục trong danh sách, kết nối trực tiếp với endpoint `PATCH /api/categories/{id}/status?isActive=...` qua hàm `toggleCategoryStatus`.

### 3.3. [FE-05] Bổ Sung Cột Hạn Sử Dụng (HSD) & Chống Trùng Lặp Nguyên Liệu Trong `PurchaseOrderModal.tsx`
- Bổ sung cột **"Hạn sử dụng"** (`HSD` / `expiryDate`) vào bảng chi tiết phiếu nhập kho:
  - Khi lập phiếu: hiển thị ô nhập ngày `input[type="date"]`.
  - Khi xem phiếu đã duyệt: hiển thị ngày định dạng chuẩn Việt Nam (`dd/mm/yyyy`).
- Nâng cấp modal container lên `max-w-4xl` giúp bảng hiển thị rộng rãi, cân đối.
- Cơ chế chống trùng nguyên liệu:
  - Hàm `handleAddRow`: Kiểm tra nguyên liệu khả dụng chưa được thêm; báo lỗi nếu đã thêm hết toàn bộ nguyên liệu vào bảng.
  - Dropdown chọn nguyên liệu: Tự động `disabled` các nguyên liệu đã được chọn ở các dòng khác kèm nhãn `(Đã chọn)` hoặc `(Ngừng HT)`.

### 3.4. [FE-06 & BE-FIX] Nâng Cấp Bộ Lọc Sổ Thẻ Kho & Xử Lý Triệt Để Lỗi PostgreSQL `could not determine data type of parameter`
- **Khắc phục lỗi SQLState 42P18:**
  - *Nguyên nhân:* Trước đây trong `InventoryTransactionRepository` và `PurchaseOrderRepository`, câu truy vấn JPQL dùng `(:fromDate IS NULL OR tx.createdAt >= :fromDate)`. Khi client gọi API mà không truyền ngày (`fromDate = null`), Hibernate sinh ra mệnh đề `(? is null or ...)`. Do `$7 is null` đứng cô lập không có ngữ cảnh kiểu dữ liệu, PostgreSQL Extended Query Protocol từ chối biên dịch câu lệnh với lỗi `ERROR: could not determine data type of parameter $7`.
  - *Giải pháp:* Chuyển đổi toàn bộ sang chuẩn Spring Data JPA `JpaSpecificationExecutor` + Criteria API `Specification`. Khi tham số `null`, câu truy vấn hoàn toàn **không sinh mệnh đề WHERE thừa**, triệt tiêu vĩnh viễn lỗi suy luận kiểu dữ liệu trên PostgreSQL và cho phép database sử dụng B-tree index tối ưu.
- **Frontend Sổ thẻ kho:**
  - Bổ sung nút lọc nghiệp vụ **"Xuất hủy (SPOILAGE)"** bên cạnh các nút *Nhập kho (IMPORT)*, *Xuất bán (SALE)*, *Kiểm kê (AUDIT)*.
  - Bổ sung thanh công cụ lọc khoảng ngày biến động thẻ kho với 2 ô chọn ngày `fromDate` – `toDate` và nút "Xóa lọc ngày".
  - Bổ sung hiển thị huy hiệu thẻ kho cho giao dịch xuất hủy: màu đỏ nổi bật kèm biểu tượng cảnh báo `<AlertTriangle />`.

### 3.5. [DB-04] Dọn Dẹp Triệt Để Mã Nguồn Thừa (Dead Code Cleanup)
- Rà soát toàn bộ dự án frontend: xác nhận 2 component `IngredientList.tsx` và `RecipeEditor.tsx` là các file nguyên mẫu ban đầu, có 0 lượt import trong toàn bộ mã nguồn.
- Tiến hành xóa an toàn 2 file này khỏi `frontend/src/components/admin/`, giúp cấu trúc dự án tinh gọn và ngăn ngừa nhầm lẫn kỹ thuật.

---

## 📊 PHẦN 4: BẢNG TỔNG HỢP KIỂM THỬ TOÀN DIỆN SAU GIAI ĐOẠN 3

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả thực tế | Trạng thái |
| :--- | :--- | :---: | :---: |
| **Backend Java Compiler** | `mvn -f backend/services/catalog-inventory-service/pom.xml test-compile` | `BUILD SUCCESS` (0 errors) | ✅ 100% PASS |
| **Frontend TypeScript Type Check** | `node ./frontend/node_modules/typescript/bin/tsc -p ./frontend/tsconfig.json --noEmit` | `0 errors` | ✅ 100% PASS |
| **Frontend ESLint Linter** | `npm --prefix frontend run lint` | `0 errors, 0 warnings` | ✅ 100% PASS |
| **Frontend Unit Tests** | `npm --prefix frontend test` | `6/6 passed` | ✅ 100% PASS |
| **PostgreSQL Schema Integrity** | Docker container `smartpos-postgres` port 5433 | `is_active`, `decimal(12,3)`, `order_code` đầy đủ | ✅ 100% PASS |

---

## 🚀 PHẦN 5: KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 4 (ƯU TIÊN P3)

Giai đoạn tiếp theo tập trung vào việc tự động hóa kiểm thử và khép kín luồng tích hợp hệ thống:

1. **Bộ Unit Test & Concurrency Integration Test cho Backend:**
   - `InventoryServiceImplTest`:
     - Kiểm thử tính toán trừ kho theo BOM 3 tầng (Món gốc + Size + Topping).
     - Kiểm thử tính Idempotent: gọi trừ kho 2 lần với cùng `orderCode` phải từ chối yêu cầu thứ hai.
     - Kiểm thử Rollback toàn bộ khi có 1 nguyên liệu không đủ tồn kho.
     - Kiểm thử kiểm kê `adjustInventory` với số lượng đếm thực tế và xuất hủy hàng hỏng.
   - `PurchaseOrderServiceImplTest`:
     - Kiểm thử tính lại giá vốn bình quân gia quyền.
     - Kiểm thử chống race condition duyệt đồng thời nhiều luồng bằng khóa bi quan.
   - `RecipeServiceImplTest`:
     - Kiểm thử lưu và tra cứu công thức theo phạm vi món (Per-Product) và phạm vi toàn cục (Global).
2. **Triển khai tích hợp liên dịch vụ với `sales-service`:**
   - Cung cấp FeignClient hoặc RestClient trên `sales-service` gọi `POST /api/inventory/deduct` khi đơn hàng chuyển sang `PAID`.
   - Kiểm tra luồng bán hàng hoàn chỉnh từ Web POS / QR Order $\rightarrow$ `sales-service` $\rightarrow$ `catalog-inventory-service` $\rightarrow$ Tự động trừ kho và cập nhật Thẻ kho.
