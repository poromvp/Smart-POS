# 📋 BÁO CÁO KIỂM TOÁN TOÀN DIỆN (END-TO-END AUDIT REPORT)
## Phân Hệ `catalog-inventory-service` — Backend, Database, Exception Handling & Frontend

> **Dự án:** Smart-POS (Hệ thống Quản lý Bán hàng & Quản trị Nhà hàng)  
> **Phạm vi rà soát:** Toàn bộ mã nguồn từ đầu đến cuối (Giai đoạn 0 $\rightarrow$ Giai đoạn 4) trên cả **Backend (`catalog-inventory-service`)**, **Database (`init-scripts`, `seed-demo-data.sql`, JPA Entities/Repositories)**, **Cơ chế Xử lý Ngoại lệ & Validation**, và **Frontend (`Next.js 16 / React 19`)**.  
> **Thời điểm kiểm toán:** 19:15, Ngày 30/10/2026.  
> **Nguyên tắc thực hiện:** Chỉ kiểm toán và xuất báo cáo hướng dẫn khắc phục chi tiết; tuyệt đối không can thiệp mã nguồn dự án và không chỉnh sửa `CATALOG_INVENTORY_PLAN.md`.

---

## ✅ 1. Kết Quả Kiểm Tra Biên Dịch & Tổng Quan Chất Lượng Hiện Tại

| Hạng mục kiểm tra | Công cụ / Lệnh kiểm chứng | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Backend Compile** | `mvn -f backend/pom.xml -pl services/catalog-inventory-service compile` | `BUILD SUCCESS` (0 lỗi biên dịch) | ✅ Tốt |
| **Backend Unit / Integration Tests** | `mvn -f backend/pom.xml -pl services/catalog-inventory-service test` | `No tests to run` (**0 bài test**) | ⚠️ Thiếu test tự động |
| **Frontend TypeScript** | `tsc --project frontend/tsconfig.json --noEmit` | **0 lỗi** *(Lỗi prop `ingredientToEdit` tại `inventory/page.tsx:783` đã được sửa)* | ✅ Đạt 100% |
| **Frontend ESLint** | `npm --prefix frontend run lint` | `EXIT CODE 0` (0 errors, 0 warnings) | ✅ Đạt 100% |
| **Frontend Unit Tests** | `npm --prefix frontend test` | `6/6 tests PASSED` *(chỉ mới test `kds-timer`, chưa có test Catalog/BOM)* | 🟡 Cơ bản |

### 🌟 Những Điểm Mạnh Nền Tảng Đã Xây Dựng Rất Tốt
1. **Kiến trúc phân tầng chuẩn mực:** Tách biệt rõ `Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository` $\rightarrow$ `MapStruct Mapper` $\rightarrow$ `DTO` cho toàn bộ 9 nhóm tài nguyên (Danh mục, Món ăn & Size, Topping, Upload file, Nguyên liệu, Công thức BOM 3 tầng, Trừ kho & Thẻ kho, Nhà cung cấp, Phiếu nhập kho).
2. **Tư duy chống Deadlock hai chiều:** Cả luồng trừ kho (`InventoryServiceImpl`) và duyệt phiếu nhập (`PurchaseOrderServiceImpl`) đều sắp xếp tăng dần ID nguyên liệu (`ORDER BY i.id`) khi lấy khóa bi quan `PESSIMISTIC_WRITE`.
3. **Bảo vệ tính toàn vẹn nghiệp vụ:** Chặn sửa trực tiếp `currentStock` khi cập nhật nguyên liệu; chặn đổi `unit` (đơn vị tính) hoặc xóa nguyên liệu/danh mục/món ăn khi đã phát sinh dữ liệu liên quan; tính giá vốn bình quân gia quyền tự động.

---

## 🚨 2. Kiểm Toán Cơ Chế Xử Lý Ngoại Lệ, Thông Báo Lỗi & Validation

```mermaid
flowchart LR
    Req["Client gửi dữ liệu sai"] --> Valid["Jakarta @Valid / Spring Web"]
    Valid --> GEH["GlobalExceptionHandler"]
    GEH -->|ProblemDetail: detail='Dữ liệu không hợp lệ'<br>+ errors={field: msg}| ApiTs["frontend/src/lib/api.ts"]
    ApiTs -->|Chỉ đọc errorJson.detail<br>BỎ QUA errorJson.errors!| Toast["Toast UI: 'Dữ liệu không hợp lệ'<br>(Mất sạch thông báo chi tiết từng trường!)"]
```

### 🔴 [EX-01] Mất sạch thông báo lỗi chi tiết từng trường (`@Valid`) giữa Backend và Frontend *(Nghiêm trọng)*
* **Vị trí:**
  * Backend: [`GlobalExceptionHandler.java#L36-L44`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/exception/GlobalExceptionHandler.java#L36-L44)
  * Frontend: [`api.ts#L36-L46`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/lib/api.ts#L36-L46) và [`api.ts#L194-L202`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/lib/api.ts#L194-L202)
* **Nguyên nhân:** Khi DTO vi phạm `@NotBlank`, `@Size`, `@Email`, `@Digits`, `@Positive`..., `GlobalExceptionHandler` gán cứng `detail = "Dữ liệu không hợp lệ"` và đặt danh sách lỗi chi tiết vào `problem.setProperty("errors", errors)`. Tuy nhiên hàm `handleResponse` trong `api.ts` chỉ lấy:
  ```ts
  errorMsg = errorJson.detail || errorJson.message || errorJson.title || errorMsg;
  ```
  Vì `errorJson.detail` luôn có giá trị `"Dữ liệu không hợp lệ"`, toàn bộ object `errorJson.errors` (ví dụ: `{"email": "Email không đúng định dạng", "quantityNeeded": "Định lượng tối đa 9 chữ số nguyên và 3 chữ số thập phân"}`) bị vứt bỏ hoàn toàn.
* **Hệ quả:** Người dùng nhập sai định dạng email, số âm, hoặc quá số lẻ thập phân chỉ nhận được đúng một thông báo mù mờ `"Dữ liệu không hợp lệ"`, không biết phải sửa ở ô nào.
* **Hướng khắc phục:**
  * Tại `GlobalExceptionHandler.handleValidation`: Ghép thông báo chi tiết vào `detail` (VD: nối các `FieldError.getDefaultMessage()` bằng dấu `"; "`).
  * Tại `api.ts`: Kiểm tra thêm `if (errorJson.errors && typeof errorJson.errors === "object")` để trích xuất chuỗi lỗi chi tiết hiển thị lên Toast/Modal.

### 🔴 [EX-02] `GlobalExceptionHandler` bỏ sót 7 nhóm ngoại lệ phổ biến (Gây lọt lỗi HTTP 500 hoặc tiếng Anh thô) *(Nghiêm trọng)*
* **Vị trí:** [`GlobalExceptionHandler.java#L13-L60`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/exception/GlobalExceptionHandler.java#L13-L60)
* **Hiện trạng:** File chỉ mới bắt đúng 5 ngoại lệ custom + `MethodArgumentNotValidException`. Các ngoại lệ thực tế sau đây **chưa được xử lý**:
  1. **`DataIntegrityViolationException` (Spring DAO):** Khi xảy ra race condition đụng `UNIQUE` constraint (`po_number`, `sku`, `code`), lỗi khóa ngoại `FOREIGN KEY`, hoặc lỗi tràn kiểu số `numeric field overflow` $\rightarrow$ Hệ thống văng **HTTP 500 Internal Server Error** thay vì `409 Conflict` / `400 Bad Request` tiếng Việt.
  2. **`MaxUploadSizeExceededException`:** Khi người dùng tải ảnh món ăn nặng `> 10MB` (giới hạn tại [`application.yml#L10-L12`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/resources/application.yml#L10-L12)) $\rightarrow$ Không trả về thông báo tiếng Việt thân thiện (*"Ảnh tải lên vượt quá dung lượng tối đa 10MB"*).
  3. **`HttpMessageNotReadableException`:** Khi client gửi sai kiểu dữ liệu JSON (VD: nhập số lẻ `1.5` vào ô Số lượng bán kiểu `Integer`, sai định dạng ngày `yyyy-MM-dd`, hoặc sai giá trị Enum `PurchaseOrderStatus`) $\rightarrow$ Trả về thông báo tiếng Anh mặc định `"Failed to read request"`.
  4. **`MethodArgumentTypeMismatchException`:** Khi truyền sai kiểu trên URL/Query (VD: `/api/products/abc`, `/api/inventory/transactions?type=SAI_LOAI`).
  5. **`MissingServletRequestParameterException` & `MissingServletRequestPartException`:** Khi gọi `PATCH .../status` thiếu tham số `?isActive=` hoặc gọi `POST /api/files/upload` thiếu part `file`.
  6. **`NoResourceFoundException`:** Khi truy cập đường dẫn ảnh hoặc endpoint không tồn tại.
  7. **Chốt chặn cuối `@ExceptionHandler(Exception.class)` kèm `@Slf4j`:** Chưa có logger ghi lại stacktrace lỗi bất ngờ và trả về thông điệp tiếng Việt chuẩn hóa.

### 🟠 [EX-03] Lỗ hổng Validation trên các Request DTO dẫn tới lỗi 500 dưới Database *(Quan trọng)*
1. **Thiếu `@Digits` trên các trường giá tiền Catalog:**
   * [`ProductCreateRequest.java#L30-L32`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/dto/request/ProductCreateRequest.java#L30-L32), [`ProductUpdateRequest.java#L30-L32`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/dto/request/ProductUpdateRequest.java#L30-L32), [`ProductVariantRequest.java#L21-L23`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/dto/request/ProductVariantRequest.java#L21-L23), [`ModifierOptionRequest.java#L21-L23`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/dto/request/ModifierOptionRequest.java#L21-L23) chỉ có `@DecimalMin("0.0")` mà **thiếu `@Digits(integer = 10, fraction = 2)`**. Nếu nhập giá `>= 10.000.000.000`, request vượt qua `@Valid` nhưng làm nổ cột `DECIMAL(12,2)` của PostgreSQL (HTTP 500).
2. **`NullPointerException` (HTTP 500) trong `DeductItemRequest`:**
   * [`DeductItemRequest.java#L19`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/dto/request/DeductItemRequest.java#L19) không có `@NotNull` trên `modifierOptionIds`. Nếu JSON truyền `"modifierOptionIds": null`, [`InventoryServiceImpl.java#L113`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/InventoryServiceImpl.java#L113) và `#L152` sẽ ném `NullPointerException` ngay lập tức.
3. **Truyền `null` vào các cờ Boolean khi tạo mới gây lỗi `NOT NULL` DB:**
   * `CategoryCreateRequest.isActive`, `ProductCreateRequest.isActive`, `SupplierCreateRequest.isActive`, `ModifierGroupCreateRequest.isMultiple` / `isRequired` không có `@NotNull` (hoặc xử lý `Boolean.TRUE.equals(...)` khi map). Nếu payload truyền `"isActive": null`, Jackson ghi đè giá trị mặc định `= true` thành `null` và gây lỗi 500 `violates not-null constraint`.
4. **Thiếu `@Size` trên `imageUrl`:**
   * [`Product.java#L39-L40`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/domain/Product.java#L39-L40) khai báo `@Column(name = "image_url")` (mặc định Hibernate tạo `VARCHAR(255)`), nhưng `ProductCreateRequest.imageUrl` không có `@Size(max = 255)` (hoặc cần đổi cột thành `columnDefinition = "TEXT"`).

### 🟡 [EX-04] Bất đồng nhất định dạng Envelope giữa Thành công và Lỗi *(Trung bình)*
* Thành công trả về `ApiResponse<T>` (`{ success, message, data, timestamp }`), trong khi lỗi trả về `ProblemDetail` (`{ type, title, status, detail, instance, timestamp }`), đồng thời khác cấu trúc lỗi của `auth-service` và `sales-service`. Nên thống nhất chuẩn phản hồi trước khi tích hợp qua `api-gateway`.

---

## ⚙️ 3. Kiểm Toán Logic Code & Concurrency Trên Backend

### 🔴 [BE-01] Lỗi nổ `UNIQUE` khi gửi chuỗi rỗng `code` & Không thể xóa trắng các trường tùy chọn khi Cập nhật *(Nghiêm trọng)*
* **Vị trí:**
  * [`ProductServiceImpl.java#L48-L50`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/ProductServiceImpl.java#L48-L50), `#L140-L142`, `#L187-L200`
  * [`ProductMapper.java#L43`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/mapper/ProductMapper.java#L43), [`SupplierMapper.java#L21`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/mapper/SupplierMapper.java#L21), [`IngredientServiceImpl.java#L98-L115`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/IngredientServiceImpl.java#L98-L115)
* **Phân tích 2 lỗi liên hoàn:**
  1. **Lưu chuỗi rỗng `""` vào cột `UNIQUE (code)` của `products`:** Nếu request gửi `code: ""` (hoặc `"   "`), hàm `validateUniqueFieldsOnCreate` bỏ qua kiểm tra vì `!request.getCode().isBlank()` là `false`. Nhưng ngay sau đó dòng 49 và 141 lại chạy `product.setCode(request.getCode().trim().toUpperCase())` $\rightarrow$ lưu `""` thay vì `null`! Khi tạo món thứ 2 cũng để `code: ""`, PostgreSQL ném lỗi **HTTP 500 Duplicate Key**! (Cần chuẩn hóa bằng hàm `normalizeCode` chuyển chuỗi rỗng về `null` giống `normalizeSku`).
  2. **Không thể xóa trắng `code`, `description`, `imageUrl`, `phone`, `email`, `address` khi Edit:** Trên Frontend (`ProductModal.tsx:181-184`, `IngredientModal.tsx:53`, `SupplierModal.tsx:42-44`), khi người dùng xóa trắng ô nhập, Frontend gửi `undefined` (tức `null` trong DTO Java). Vì tất cả các Mapper đều gắn `@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)`, MapStruct **bỏ qua toàn bộ giá trị `null`**, khiến dữ liệu cũ trong DB giữ nguyên không thể xóa!

### 🔴 [BE-02] Race Condition cộng đúp tồn kho 2 lần khi duyệt Phiếu nhập kho (`completePurchaseOrder`) *(Nghiêm trọng)*
* **Vị trí:** [`PurchaseOrderServiceImpl.java#L158-L230`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/PurchaseOrderServiceImpl.java#L158-L230)
* **Nguyên nhân:** Dòng 159 gọi `purchaseOrderRepository.findWithDetailsById(id)` **không có khóa bi quan (`PESSIMISTIC_WRITE`)** trên bản ghi `PurchaseOrder` (và entity `PurchaseOrder` cũng không có `@Version`), rồi kiểm tra `po.getStatus() == COMPLETED` ở dòng 162 *trước khi* khóa các dòng `Ingredient` ở dòng 181.
* **Kịch bản tái hiện:** Nếu thủ kho bấm đúp hoặc 2 tab cùng gửi `PATCH /api/purchase-orders/2/complete` cùng lúc:
  1. Cả Luồng A và Luồng B đều đọc `po` ở dòng 159 và thấy `status = DRAFT`.
  2. Luồng A lấy khóa `Ingredient` ở dòng 181, cộng tồn kho, ghi thẻ kho `IMPORT`, đổi `status = COMPLETED` và commit.
  3. Luồng B (đang chờ ở dòng 181) được nhả khóa `Ingredient`, nhưng biến `po` trong bộ nhớ của Luồng B vẫn mang `status = DRAFT` đã vượt qua dòng 162 $\rightarrow$ **cộng đúp toàn bộ số lượng phiếu nhập vào kho lần thứ 2**!
* **Hướng khắc phục:** Bổ sung query `@Lock(LockModeType.PESSIMISTIC_WRITE)` cho `PurchaseOrderRepository` khi gọi trong `completePurchaseOrder`, `updatePurchaseOrder` và `cancelPurchaseOrder` (hoặc thêm `@Version` vào `PurchaseOrder`).

### 🟠 [BE-03] Thiếu hoàn toàn API nghiệp vụ Kiểm kê kho (`AUDIT_ADJUST`) và Hủy hàng hỏng (`SPOILAGE`) *(Quan trọng)*
* **Vị trí:** [`InventoryController.java`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/controller/InventoryController.java) & [`IngredientServiceImpl.java`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/IngredientServiceImpl.java)
* **Phân tích nghiệp vụ:** Hệ thống đã chặn không cho sửa `currentStock` trong `PUT /api/ingredients/{id}` để bảo vệ sổ kho, đồng thời đã khai báo enum `AUDIT_ADJUST` (Kiểm kê) & `SPOILAGE` (Hỏng hóc). Tuy nhiên **chưa có API nào (ví dụ `POST /api/inventory/adjust`)** để thủ kho thực hiện xuất hủy nguyên liệu hư hỏng/hết hạn hoặc cân bằng kho sau kiểm kê thực tế! Nếu nguyên liệu trong bếp bị đổ vỡ/hết hạn, thủ kho hiện không có bất kỳ chức năng nào để trừ kho hợp lệ.

### 🟠 [BE-04] Lưu cứng `http://localhost:8082/...` vào Database khi Upload ảnh làm hỏng QR Menu trên điện thoại *(Quan trọng)*
* **Vị trí:** [`FileStorageService.java#L62-L65`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/FileStorageService.java#L62-L65)
* **Nguyên nhân:** `ServletUriComponentsBuilder.fromRequestUri(request)...` tạo URL gắn cứng host lúc upload (`http://localhost:8082/uploads/products/uuid.png`) và lưu vào cột `products.image_url`. Khi khách hàng quét mã QR tại bàn bằng điện thoại qua mạng Wi-Fi/LAN (VD: `http://192.168.1.10:3000/menu`), trình duyệt điện thoại sẽ gọi về `localhost:8082` (chính chiếc điện thoại đó) làm **toàn bộ ảnh món ăn mới upload bị lỗi không hiển thị**.
* **Bổ sung thêm tại `FileStorageService`:**
  * Mới chỉ kiểm tra đuôi tên file (`.jpg`, `.png`, `.webp`), chưa kiểm tra Content-Type / Magic Bytes thực sự của file.
  * Khi xóa món ăn hoặc thay ảnh khác cho món ăn, file ảnh cũ trong `uploads/products/` không được xóa đi (gây rác ổ cứng theo thời gian).
* **Hướng khắc phục:** Chỉ lưu đường dẫn tương đối `/uploads/products/<uuid>.png` vào DB, và ghép với `API_ORIGIN` ở Frontend (hoặc cấu hình `rewrites` trong `next.config.mjs`).

### 🟠 [BE-05] Các kẽ hở Validation logic trong Service *(Quan trọng)*
1. **`ProductServiceImpl.createProduct` ([`dòng 57-68`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/ProductServiceImpl.java#L57-L68)):** Chưa kiểm tra trùng `sku` *giữa các dòng size trong cùng 1 request tạo mới* (khác với `updateProduct` đã có `seenSkus`), và cả `createProduct` lẫn `updateProduct` đều chưa chặn đặt trùng `sizeName` (VD: tạo 2 dòng cùng tên `"Size M"` trong 1 món).
2. **`ProductServiceImpl.attachModifierGroups` ([`dòng 174-181`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/ProductServiceImpl.java#L174-L181)):** Dùng `modifierGroupRepository.findAllById(groupIds)` mà không đối chiếu số lượng tìm thấy $\rightarrow$ nếu gửi `modifierGroupIds` không tồn tại sẽ âm thầm bỏ qua thay vì báo `404 ResourceNotFoundException`.
3. **`ModifierGroupServiceImpl.createGroup` ([`dòng 44-51`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/ModifierGroupServiceImpl.java#L44-L51)):** Không chặn trùng tên `ModifierOption` ngay trong mảng `options` lúc tạo nhóm, và cho phép tạo nhóm bắt buộc (`isRequired = true`) nhưng danh sách `options` rỗng `[]`.
4. **Cảnh báo tồn kho sai cho nguyên liệu có `minThreshold = 0`:**
   * [`IngredientRepository.java#L39`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/repository/IngredientRepository.java#L39) và [`IngredientMapper.java#L16`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/mapper/IngredientMapper.java#L16) dùng điều kiện `currentStock <= minThreshold`. Khi tạo nguyên liệu mới với `currentStock = 0, minThreshold = 0` (không đặt ngưỡng cảnh báo), `0 <= 0` trả về `true`, đẩy nguyên liệu vào Tab Cảnh báo với `deficit = 0, suggestedReorderQuantity = 0`! Nên đổi thành `minThreshold > 0 AND currentStock <= minThreshold` (hoặc `currentStock <= 0` nếu muốn cảnh báo hết sạch kho).
5. **Ghi đè chéo BOM Topping dùng chung (`RecipeServiceImpl`):**
   * [`RecipeServiceImpl.java#L51-L62`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/RecipeServiceImpl.java#L51-L62) lưu định lượng Topping theo `modifier_option_id` toàn cục (`product_id = NULL`). Với các nhóm tùy chọn dùng chung cho nhiều món như *"Lượng Đường"* (*100% đường*, *50% đường*), sửa định lượng đường khi đang chọn món *Trà Đào* sẽ ghi đè luôn định lượng đường của *Cà Phê Sữa* và *Matcha Latte*.
6. **Không nhất quán loại giao dịch khởi tạo kho ban đầu:**
   * [`IngredientServiceImpl.java#L56-L60`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/service/impl/IngredientServiceImpl.java#L56-L60) tạo thẻ kho đầu kỳ với loại `AUDIT_ADJUST` (`orderCode = null`), trong khi [`DataInitializer.java#L387-L392`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/config/DataInitializer.java#L387-L392) lại tạo với loại `IMPORT` (`orderCode = "INIT-STOCK-2026"`).
7. **`InventoryServiceImpl.deductInventory`:** Chưa chặn trừ kho đối với món ăn đang ngừng kinh doanh (`product.getIsActive() == false`).

---

## 🗄️ 4. Kiểm Toán Cơ Sở Dữ Liệu, Dữ Liệu Mồi (Seed) & Hiệu Năng JPA

### 🔴 [DB-01] Lệch Schema nghiêm trọng giữa `init-scripts/01-init-all-databases.sql` (Docker) và JPA Entities *(Nghiêm trọng)*
Khi chạy `docker compose up -d postgres`, PostgreSQL chạy [`init-scripts/01-init-all-databases.sql`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/init-scripts/01-init-all-databases.sql) để tạo bảng trước. Vì Hibernate `ddl-auto: update` **không tự sửa độ chính xác/kiểu dữ liệu của cột đã tồn tại**, môi trường Docker gặp các xung đột trực tiếp sau:

| Bảng & Cột | Trong `01-init-all-databases.sql` | Trong JPA Entity (`domain/*.java`) | Hậu quả thực tế khi chạy với Docker Postgres |
| :--- | :--- | :--- | :--- |
| `ingredients.current_stock` | `decimal(12, 2)` *(2 số lẻ)* | `precision = 12, scale = 3` *(3 số lẻ)* | **Sai lệch tồn kho vĩnh viễn:** Trừ BOM `0.025 kg` bị làm tròn thành `0.03 kg` trong `current_stock`, lệch hẳn với sổ thẻ kho! |
| `ingredients.min_threshold` | `decimal(12, 2)` | `precision = 12, scale = 3` | Mất chữ số thập phân thứ 3 của ngưỡng tối thiểu. |
| `ingredients.name` | `varchar(100)` | `length = 150` (`@Size(max=150)`) | Nhập tên nguyên liệu 101–150 ký tự qua `@Valid` nhưng **nổ lỗi 500 SQL**! |
| `purchase_orders.total_amount` | `decimal(14, 2)` | `precision = 12, scale = 2` | Trên DB do Hibernate tạo mới, đơn nhập `>= 10 tỷ` bị tràn số 500 (`PurchaseOrderItem.totalPrice` cũng chỉ `12,2` dù `qty(9,3) * price(10,2)` vượt `12,2`). |
| `inventory_transactions.order_code` | **Không có cột này** | `@Column(name = "order_code", length = 50)` | Nếu chuyển `ddl-auto: validate` khi lên Production, ứng dụng sập ngay lúc khởi động. |
| `02-seed-data.sql` vs `DataInitializer` | Chỉ seed 3 nhóm Modifier *(thiếu "Lượng Đá")* | `if (categoryRepository.count() > 0) return;` | Khi chạy Docker, `02-seed-data.sql` nạp trước làm `DataInitializer` bỏ qua `initCatalogData()` $\rightarrow$ **thiếu mất nhóm "Lượng Đá"**! |

### 🟠 [DB-02] Lỗi logic trong `DataInitializer.java` và `seed-demo-data.sql` *(Quan trọng)*
1. **Phiếu nhập nháp `PO-20261030-1002` không bao giờ được tạo bởi `DataInitializer`:**
   * Tại [`DataInitializer.java#L440`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/config/DataInitializer.java#L440), code gọi `ingredientRepository.findByCode("NL-RAU")`. Tuy nhiên trong 21 nguyên liệu khởi tạo ở `initIngredientsData()` (`dòng 227-254`), **hoàn toàn không có mã `"NL-RAU"`**!
   * Do đó câu lệnh `if (ingNamOpt.isPresent() && ingRauOpt.isPresent())` ở dòng 477 luôn `false`, phiếu `PO-20261030-1002` bị bỏ qua hoàn toàn dù dòng 512 vẫn ghi log *"Khởi tạo 3 Nhà cung cấp và 2 Đơn nhập kho mẫu thành công!"*.
2. **Dữ liệu mồi không khớp nghiệp vụ trong `seed-demo-data.sql`:**
   * Tại [`seed-demo-data.sql#L165-L174`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/resources/seed-demo-data.sql#L165-L174): Phiếu `PO-20261030-1002` có ghi chú *"Dự trù nấm và rau củ tươi"* nhưng chi tiết lại nhập `ingredient_id = 4` (*Mì sợi*) và `5` (*Trứng gà*); phiếu `PO-20261028-1001` mang trạng thái `COMPLETED` nhưng không có bản ghi `IMPORT` nào trong bảng `inventory_transactions`.

### 🟠 [DB-03] Hai điểm nghẽn N+1 Query còn sót trong tầng Repository *(Quan trọng)*
1. **[`ProductRepository.java#L43-L50`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/repository/ProductRepository.java#L43-L50) (`searchProducts`):**
   * Chưa gắn `@EntityGraph(attributePaths = {"category", "variants"})`. Khi `ProductMapper.toSummaryResponseList` truy cập `product.getCategory().getName()` và `product.getVariants().size()`, Hibernate phải bắn thêm **1 + C + N câu truy vấn SQL phụ** cho mỗi lần tải trang Danh sách món hoặc trang BOM!
2. **[`PurchaseOrderRepository.java#L27-L38`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/repository/PurchaseOrderRepository.java#L27-L38) (`searchPurchaseOrders`):**
   * Mới chỉ gắn `@EntityGraph(attributePaths = {"supplier"})`, thiếu `"items"` và `"items.ingredient"`. Khi `PurchaseOrderMapper.toResponseList` ánh xạ chi tiết mặt hàng cho từng phiếu nhập, Hibernate phát sinh **N+1 câu truy vấn** cho `purchase_order_items` và `ingredients`.

### 🟡 [DB-04] Thiếu Ràng buộc DB (Constraints), Index, Phân trang & Dọn dẹp Code thừa *(Trung bình)*
* **Rủi ro Cascade xóa nhầm:** [`Category.java#L32`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/domain/Category.java#L32) đặt `cascade = CascadeType.ALL` trên `List<Product> products` — rất nguy hiểm, nên bỏ `CascadeType.ALL` để DB bảo vệ khóa ngoại `RESTRICT`.
* **Thiếu `UNIQUE` dưới DB:** Các cột `categories.name`, `modifier_groups.name`, `products.name`, `ingredients.name`, `suppliers.name`, `suppliers.phone` mới chỉ kiểm tra trùng ở tầng Java, chưa có Unique Constraint/Index dưới PostgreSQL nên 2 request song song vẫn tạo được bản ghi trùng tên.
* **Bảng `recipes`:** Nên bổ sung `CHECK` constraint đảm bảo mỗi dòng chỉ trỏ đúng 1 đích (`(CASE WHEN product_id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN variant_id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN modifier_option_id IS NOT NULL THEN 1 ELSE 0 END) = 1`) và Index trên `(product_id)`, `(variant_id)`, `(modifier_option_id)`.
* **Thiếu Phân trang (`Pagination`):** `GET /api/inventory/transactions` và `GET /api/purchase-orders` đang trả toàn bộ lịch sử không giới hạn (`List<...>`), sẽ gây nghẽn bộ nhớ khi dữ liệu thẻ kho lên tới hàng chục nghìn bản ghi.
* **Class thừa chưa dùng:** [`BaseEntity.java`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/domain/BaseEntity.java) và [`JpaAuditingConfig.java`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/config/JpaAuditingConfig.java) hiện không được bất kỳ Entity nào kế thừa; file [`.env`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/catalog-inventory-service/src/main/java/com/smartpos/cataloginventory/.env) nằm nhầm trong thư mục source code `src/main/java/com/smartpos/cataloginventory/.env`.

---

## 💻 5. Kiểm Toán Toàn Diện Frontend & Trải Nghiệm Người Dùng (UX)

### 🔴 [FE-01] Lỗi hệ thống trong `ToastProvider.tsx` gây Bão Request vô tận khi mất mạng & Xóa sạch dữ liệu đang sửa trên `/admin/menu-bom` *(Nghiêm trọng nhất trên Frontend)*
* **Vị trí:**
  * [`ToastProvider.tsx#L49-L55`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/ui/ToastProvider.tsx#L49-L55)
  * Kết hợp với dependency `[toast]` trong `useEffect` tại: [`menu-bom/page.tsx#L318-L338`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/app/admin/menu-bom/page.tsx#L318-L338) & `#L383-L419`, [`products/page.tsx#L103`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/app/admin/products/page.tsx#L103), [`inventory/page.tsx#L122`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/app/admin/inventory/page.tsx#L122), [`purchasing/page.tsx#L118`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/app/admin/purchasing/page.tsx#L118).
* **Nguyên nhân gốc rễ:** Trong `ToastProvider.tsx`, biến `contextValue` tạo mới một object literal ở **mọi lần render** (không dùng `useMemo`, các hàm `success`, `error`, `warning`, `info` viết inline arrow function). Mỗi khi một toast xuất hiện (`t = 0s`) và khi nó tự đóng (`t = 3.5s`), state `toasts` thay đổi làm `toast` đổi tham chiếu 2 lần!
* **Hai hậu quả nghiêm trọng:**
  1. **Treo trình duyệt do vòng lặp vô tận khi Backend tắt/lỗi:** Khi `fetchProducts()` hoặc `fetchIngredients()` thất bại $\rightarrow$ `.catch` gọi `toast.error(...)` $\rightarrow$ `ToastProvider` re-render tạo `toast` mới $\rightarrow$ kích hoạt lại ngay lập tức `useEffect(..., [toast])` $\rightarrow$ gọi lại API lỗi $\rightarrow$ bắn hàng trăm request và hàng trăm toast đỏ mỗi giây!
  2. **Mất sạch công thức đang nhập và nhảy ngược về Món số 1 trên `/admin/menu-bom`:** Khi người dùng chọn món thứ 4 (*Trà Đào Cam Sả*), bất kỳ lúc nào có một toast bật lên (lưu thành công, cảnh báo hết nguyên liệu để thêm, hoặc báo lỗi nhập số), `useEffect([toast])` ở dòng 326 chạy lại `setSelectedProductId(prods[0].id)` và dòng 406 tăng `revision`, **ép màn hình nhảy ngược về Món số 1 (*Mì Cay Bò Mỹ*) và xóa sạch mọi thay đổi chưa lưu**, rồi lặp lại thêm một lần nữa sau 3,5 giây khi toast biến mất!
* **Hướng khắc phục:** Bọc `success`, `error`, `warning`, `info` bằng `useCallback` và bọc `contextValue` bằng `useMemo` trong `ToastProvider.tsx`; đồng thời ở `menu-bom/page.tsx:326` dùng `setSelectedProductId((prev) => prev ?? prods[0].id)` để không bao giờ ghi đè món đang chọn.

### 🔴 [FE-02] Màn hình Thu ngân `/pos` làm sai Giá bán theo Size, gắn nhầm Đồ uống thành `"Cấp 3"` (Độ cay) và mất toàn bộ Topping *(Nghiêm trọng)*
* **Vị trí:** [`pos/page.tsx#L111-L121`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/app/pos/page.tsx#L111-L121), `#L147-L172` & [`InvoicePanel.tsx#L42`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/pos/InvoicePanel.tsx#L42), `#L115-L124`
* **Nguyên nhân:**
  * `pos/page.tsx` chuyển đổi `ProductDetailResponse` từ API sang cấu trúc cũ `{ id, name, price: p.basePrice, spicyLevels: p.variants.map(v => v.sizeName) }`, **bỏ rơi hoàn toàn `v.id`, `v.finalPrice` (`priceAdjustment`) và `p.modifierGroups`**.
  * Trong `InvoicePanel.tsx`, bất kỳ món nào có `spicyLevels` (tức có `variants`) đều bị render cứng thành dropdown `Cấp 0` $\rightarrow$ `Cấp 7` (mặc định `"Cấp 3"`).
* **Hệ quả thực tế:** Khi thu ngân chọn *"Trà Đào Cam Sả"* (Size M / Size L `+8.000đ`) hay *"Gà Sốt Cay"* (Phần 4 miếng / Phần 8 miếng `+60.000đ`), hóa đơn in ra **"Trà Đào Cam Sả • Cấp 3"**, không thể chọn Size L hay Phần 8 miếng, **tính thiếu tiền khách (`+8k` / `+60k`)** và không thể chọn thêm bất kỳ Topping nào!
* **Hướng khắc phục:** Tái sử dụng `ModifierModal` (hoặc modal chọn Size & Topping tương đương) ngay trên `/pos` khi món ăn có `variants.length > 0` hoặc `modifierGroups.length > 0`, lưu đúng `variantId`, `modifierOptionIds` và `finalPrice`.

### 🔴 [FE-03] Màn hình QR Khách hàng (`ModifierModal.tsx` & `FloatingCart.tsx`) bỏ qua nhóm bắt buộc `isRequired` *(Nghiêm trọng)*
* **Vị trí:** [`ModifierModal.tsx#L51-L59`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/customer/ModifierModal.tsx#L51-L59), `#L83-L85`, `#L138-L147` & [`FloatingCart.tsx#L75-L92`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/customer/FloatingCart.tsx#L75-L92)
* **Chi tiết các lỗi:**
  1. **Không chặn `isRequired`:** Dù nhóm tùy chọn có `isRequired = true` (hiển thị badge đỏ *"Bắt buộc"*), hàm `handleAdd()` không kiểm tra xem khách đã chọn ít nhất 1 option trong nhóm đó chưa $\rightarrow$ khách vẫn thêm món vào giỏ bình thường mà không cần chọn nhóm bắt buộc.
  2. **Kẹt nút Radio ở nhóm không bắt buộc:** Với nhóm chọn 1 nhưng `isRequired = false` (như *Lượng Đường*, *Lượng Đá*), khi khách chạm vào 1 lựa chọn radio thì không thể chạm lần nữa để bỏ chọn.
  3. **Lỗi tham chiếu biến toàn cục `open`:** Tại `ModifierModal.tsx:138`, câu lệnh `if (!open || !item) return null;` dùng biến `open` nhưng `ModifierModalDialog` không destructure `open` từ props (đang vô tình trỏ tới hàm `window.open` của trình duyệt!).
  4. **Hiển thị thiếu Size và thừa nhãn trống trong `FloatingCart.tsx`:** Ngăn kéo giỏ hàng quên hiển thị `item.sizeName` (khách không biết mình chọn Size M hay Size L) và luôn in dòng chữ trống `"Độ ngọt: "` dưới mọi món ăn (kể cả Mì cay, Gà sốt cay).

### 🟠 [FE-04] Hỏng trạng thái Danh mục khi sửa (`CategoryModal`) & Khóa cứng không cho sửa Nhóm Topping (`ModifierGroupModal`) *(Quan trọng)*
1. **[`CategoryModal.tsx#L91`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/admin/CategoryModal.tsx#L91):** Hàm `handleSaveEdit` truyền cứng `isActive: true` khi lưu. Nếu một danh mục đang ẩn (`isActive: false`), chỉ cần sửa tên là nó tự động bật hiển thị trở lại! Ngoài ra `CategoryModal` cũng chưa có nút gạt ẩn/hiện danh mục dù Backend đã viết sẵn `PATCH /api/categories/{id}/status`.
2. **[`ModifierGroupModal.tsx`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/admin/ModifierGroupModal.tsx) & [`api.ts#L241-L265`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/lib/api.ts#L241-L265):**
   * Backend đã xây dựng đầy đủ 3 API: sửa nhóm (`PUT /api/modifier-groups/{id}`), thêm option lẻ (`POST /api/modifier-groups/{id}/options`), xóa option lẻ (`DELETE /api/modifier-groups/{id}/options/{optionId}`).
   * Tuy nhiên `api.ts` và `ModifierGroupModal.tsx` **chưa kết nối cả 3 API này**! Sau khi tạo nhóm Topping, Admin hoàn toàn không thể đổi tên nhóm, không thể thêm topping mới vào nhóm, cũng không thể xóa 1 topping lẻ (mà nếu xóa cả nhóm thì bị chặn do đang gắn với món ăn/công thức).
   * Ngoài ra `ModifierGroupModal` chưa chặn tạo nhóm rỗng (`validOptions.length === 0`) hoặc trùng tên option.

### 🟠 [FE-05] Thiếu cột Hạn sử dụng (`expiryDate`) & Tự chèn dòng trùng trong `PurchaseOrderModal.tsx` *(Quan trọng)*
* **Vị trí:** [`PurchaseOrderModal.tsx#L76-L88`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/admin/PurchaseOrderModal.tsx#L76-L88) & `#L333-L439`
* **Chi tiết:**
  1. **Quên render cột Hạn sử dụng (`expiryDate`):** Interface `LocalItemRow`, hàm `handleSubmit` và Backend DB đều có trường `expiryDate`, nhưng bảng danh sách mặt hàng trong Modal **không có cột input chọn ngày hết hạn** (cũng không hiển thị hạn sử dụng khi xem chi tiết phiếu).
  2. **Tự động chèn nguyên liệu trùng:** Trong `handleAddRow` (`dòng 79`), khi tất cả nguyên liệu đã có trong bảng, biểu thức `|| ingredients[0]` tự động chèn trùng nguyên liệu đầu tiên rồi chặn lỗi khi bấm Lưu (nên chặn ngay lúc bấm *"+ Thêm dòng"* và disable các nguyên liệu đã chọn trong `<select>` giống trang BOM).
  3. **Gán cứng `staffId: 1` (`dòng 180`):** Chưa lấy ID nhân viên đăng nhập thực tế, và gửi thừa `staffId` trong payload `PUT`.

### 🟡 [FE-06] Tổng Hợp Các Khiếm Khuyết UX & Tích Hợp Khác Trên Frontend *(Trung bình)*
* **Trang `/admin/inventory`:**
  * **Tab 3 (Sổ thẻ kho):** Thanh lọc loại giao dịch (`dòng 614-659`) chỉ có `ALL`, `IMPORT`, `SALE_DEDUCT`, `AUDIT_ADJUST` — **bỏ quên nút lọc `SPOILAGE` (*Hỏng hóc*)** dù bảng bên dưới vẫn render badge cho `SPOILAGE`. Đồng thời chưa có 2 ô chọn ngày `fromDate` – `toDate` dù Backend API và `api.ts` đã hỗ trợ sẵn.
  * **Modal Mô phỏng trừ kho (`dòng 789-872`):** Bắt gõ tay số `productId` thay vì chọn từ dropdown món ăn, và truyền cứng `modifierOptionIds: []`, không có `variantId` $\rightarrow$ không test được trừ kho theo Size (Tầng 2) và Topping (Tầng 3) ngay trên UI.
* **Trang `/admin/products` & `ProductModal.tsx`:**
  * Nút **`BOM`** ở từng dòng món ăn ([`products/page.tsx#L390`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/app/admin/products/page.tsx#L390)) chỉ link tới `/admin/menu-bom` mà không gắn `?productId=${p.id}`, làm người dùng bấm từ món số 6 vẫn bị mở ra món số 1.
  * `ProductModal.tsx`: Chưa có nút **Xóa ảnh** sau khi đã chọn ảnh; khi bấm *"Đổi ảnh khác"* không hiện vòng xoay loading; nút *"Lưu"* không bị `disabled` khi `uploading === true`; tự sinh SKU `${code}-S${variants.length + 1}` dễ trùng nếu xóa size ở giữa rồi thêm mới.
* **Trang `/menu` (Khách hàng QR):** Khi mất kết nối Backend (`menu/page.tsx:286-295`), màn hình của thực khách hiển thị nguyên câu lệnh kỹ thuật nội bộ `docker compose up -d postgres` và địa chỉ `http://localhost:8082`!
* **Sử dụng `window.confirm()` mặc định của trình duyệt:** Xuất hiện tại 7 thao tác quan trọng (xóa món, xóa danh mục, xóa nhóm topping, xóa nguyên liệu, xóa NCC, duyệt nhập kho, hủy phiếu nhập) — nên thay bằng Modal xác nhận đồng bộ giao diện.
* **Component cũ dư thừa (Dead Code):** [`IngredientList.tsx`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/admin/IngredientList.tsx) và [`RecipeEditor.tsx`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/components/admin/RecipeEditor.tsx) không được bất kỳ file nào import và vẫn dùng dữ liệu giả/hàm `alert()` cũ.

---

## 🔗 6. Kiểm Toán Kiến Trúc Tích Hợp Liên Dịch Vụ & Bảo Mật

1. **Chưa khép kín luồng Đặt đơn (`sales-service`) $\rightarrow$ Trừ kho tự động (`catalog-inventory-service`):**
   * Trên Frontend, cả `/cart` (Khách đặt QR) và `/pos` (Thu ngân thanh toán) đều đang xử lý thanh toán giả lập trên state cục bộ, chưa gọi sang `sales-service` hay `POST /api/inventory/deduct`.
   * Trong `sales-service` ([`OrderServiceImpl.java`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/backend/services/sales-service/src/main/java/com/smartpos/sales_service/service/impl/OrderServiceImpl.java)), khi tạo/hoàn tất đơn hàng cũng chưa có REST Client / Outbox Event gọi sang `POST /api/inventory/deduct` của `catalog-inventory-service` (và `OrderItem` bên `sales-service` hiện lưu tên topping dạng chuỗi `String toppings` thay vì giữ `variantId` và `modifierOptionIds` như thiết kế bảng SQL gốc!).
2. **Các màn hình vệ tinh chưa nối dữ liệu thật:**
   * Trang `/admin` (Tổng quan hệ thống - [`admin/page.tsx#L98`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/app/admin/page.tsx#L98)) vẫn hiển thị cứng *"Cảnh báo tồn kho: 3 nguyên liệu"* và danh sách món bán chạy giả (*Phở bò, Cơm tấm*) thay vì gọi `fetchLowStockAlerts()` / `fetchProducts()`.
   * Trang `/order-taking` ([`order-taking/page.tsx`](file:///d:/CNTT-SGU/HK7/J2EE/Smart-POS/frontend/src/app/order-taking/page.tsx)) hiện chỉ là trang placeholder 16 dòng.
   * Hai bảng `areas` và `dining_tables` nằm trong database `pos_catalog_inventory_db` (`01-init-all-databases.sql:66-80`) hiện chưa được triển khai Entity/API trong `catalog-inventory-service`.
3. **Bảo mật & Phân quyền API (Authentication / Authorization):**
   * Hiện tại `catalog-inventory-service` chưa cấu hình Spring Security / JWT Filter (và `backend/gateway` mới chỉ có khung `pom.xml` rỗng), đồng thời `frontend/src/lib/api.ts` chưa đính kèm header `Authorization: Bearer <token>`. Mọi endpoint quản trị nhạy cảm (`DELETE /api/products/{id}`, `PATCH /api/purchase-orders/{id}/complete`, `POST /api/inventory/deduct`) hiện có thể gọi tự do không cần xác thực.

---

## 🛠️ 7. Bảng Tổng Hợp Ưu Tiên Khắc Phục Đề Xuất

| Ưu tiên | Mã lỗi | Hạng mục cần khắc phục | Tệp tin trọng tâm |
| :---: | :---: | :--- | :--- |
| **P0 (Khẩn cấp)** | **FE-01** | Bọc `useMemo`/`useCallback` trong `ToastProvider.tsx` và bỏ reset `selectedProductId` theo `[toast]` trong `menu-bom/page.tsx`. | `ToastProvider.tsx`, `menu-bom/page.tsx` |
| **P0 (Khẩn cấp)** | **DB-01 / DB-02** | Đồng bộ `decimal(12,3)`, `varchar(150)`, `order_code` trong `01-init-all-databases.sql`; sửa mã `"NL-RAU"` không tồn tại trong `DataInitializer.java`. | `01-init-all-databases.sql`, `DataInitializer.java`, `seed-demo-data.sql` |
| **P0 (Khẩn cấp)** | **BE-02** | Thêm khóa bi quan `@Lock(PESSIMISTIC_WRITE)` trên `PurchaseOrder` khi gọi `completePurchaseOrder` chống cộng đúp tồn kho. | `PurchaseOrderRepository.java`, `PurchaseOrderServiceImpl.java` |
| **P0 (Khẩn cấp)** | **EX-01 / EX-02** | Bổ sung đầy đủ các `@ExceptionHandler` còn thiếu trong `GlobalExceptionHandler.java` và đọc `errorJson.errors` trong `frontend/src/lib/api.ts`. | `GlobalExceptionHandler.java`, `api.ts` |
| **P1 (Cao)** | **BE-01** | Chuẩn hóa `code` rỗng thành `null` cho `Product` (tránh nổ `UNIQUE`); cho phép xóa trắng các trường tùy chọn khi cập nhật Món, Nguyên liệu, NCC. | `ProductServiceImpl.java`, `*Mapper.java`, `*Modal.tsx` |
| **P1 (Cao)** | **FE-02 / FE-03** | Nối chọn Size (`finalPrice`) & Topping trên `/pos` (bỏ gán nhầm `"Cấp 3"`); bắt buộc chọn nhóm `isRequired` trong `ModifierModal.tsx`. | `pos/page.tsx`, `InvoicePanel.tsx`, `ModifierModal.tsx`, `FloatingCart.tsx` |
| **P1 (Cao)** | **BE-03** | Xây dựng API & Modal **Điều chỉnh kiểm kê (`AUDIT_ADJUST`) / Xuất hủy hỏng hóc (`SPOILAGE`)** để hoàn thiện nghiệp vụ kho thực tế. | `InventoryController.java`, `InventoryServiceImpl.java`, `inventory/page.tsx` |
| **P1 (Cao)** | **BE-04** | Trả đường dẫn ảnh tương đối `/uploads/products/...` kết hợp cấu hình URL gốc động để ảnh hiển thị được trên điện thoại quét QR qua LAN. | `FileStorageService.java`, `next.config.mjs` |
| **P2 (Trung bình)** | **DB-03 / EX-03** | Thêm `@EntityGraph` cho `ProductRepository.searchProducts` & `PurchaseOrderRepository.searchPurchaseOrders`; thêm `@Digits` & `@NotNull` còn thiếu vào các Request DTO. | `ProductRepository.java`, `PurchaseOrderRepository.java`, `dto/request/*.java` |
| **P2 (Trung bình)** | **FE-04 / FE-05 / FE-06** | Giữ đúng `isActive` và thêm nút ẩn/hiện trong `CategoryModal`; nối API sửa/thêm/xóa option cho `ModifierGroupModal`; thêm cột `expiryDate` vào `PurchaseOrderModal`; thêm lọc ngày & lọc `SPOILAGE` cho Sổ thẻ kho; xóa 2 file dead code (`IngredientList.tsx`, `RecipeEditor.tsx`) và file `.env` thừa trong `src/main/java`. | `CategoryModal.tsx`, `ModifierGroupModal.tsx`, `PurchaseOrderModal.tsx`, `inventory/page.tsx` |
