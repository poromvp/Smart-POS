Đóng vai trò là Senior Frontend Developer. Hãy viết code Next.js (App Router) kết hợp Tailwind CSS cho "Giao diện Quản lý Công thức Định lượng (BOM)" dành cho Admin. Tối ưu hiển thị Desktop.

Yêu cầu cấu trúc thư mục:
/app/(admin)/bom-setup/page.tsx (Trang quản lý danh sách món & công thức)
/components/admin/RecipeEditor.tsx (Form thêm/sửa định lượng nguyên liệu)
/components/admin/IngredientList.tsx (Danh sách nguyên liệu thô trong kho)

Yêu cầu chức năng & Mock Data:
1. Mock data danh sách Ingredient (Nguyên liệu thô): Mì (g), Thịt bò (g), Nước dùng (ml).
2. Mock data Product (Món ăn): Tô Ramen.
3. Viết giao diện tương tác Form:
   - Cột trái: Chọn 1 món ăn từ danh sách (ví dụ: Tô Ramen).
   - Cột phải (RecipeEditor): Hiển thị công thức hiện tại. Cho phép Admin chọn một nguyên liệu từ dropdown (ví dụ: Thịt bò), nhập số lượng (ví dụ: 100g), và bấm "Thêm vào công thức".
   - State cập nhật ngay lập tức giao diện bảng công thức bên dưới.
   - Cung cấp nút "Lưu hệ thống" để hoàn tất việc setup BOM. Thiết kế giao diện theo dạng bảng (table) rõ ràng, chuẩn phong cách quản trị viên.