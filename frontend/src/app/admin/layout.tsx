"use client";

import React from "react";
import { usePathname } from "next/navigation";
import TopHeader from "@/components/layout/TopHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import RoleGate from "@/components/auth/RoleGate";

const ADMIN_ALLOWED_ROLES = ["manager"] as const;

const HEADER_TITLES: Record<string, string> = {
  "/admin": "Báo cáo doanh thu & tổng quan vận hành",
  "/admin/orders": "Lịch sử & tra cứu hóa đơn bán hàng",
  "/admin/products": "Quản lý món ăn & danh mục thực đơn",
  "/admin/menu-bom": "Thiết lập thực đơn & định lượng nguyên vật liệu",
  "/admin/inventory": "Quản lý kho hàng",
  "/admin/purchasing": "Quản lý nhập kho & nhà cung cấp",
  "/admin/promotions": "Quản lý chương trình khuyến mãi & mã giảm giá",
  "/admin/customers": "Quản lý khách hàng thân thiết & tích điểm",
  "/admin/staff": "Quản lý nhân sự, bàn ăn & mã QR",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTitle =
    HEADER_TITLES[pathname] ?? "Quản trị hệ thống Smart POS";

  return (
    <RoleGate allowedRoles={ADMIN_ALLOWED_ROLES}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopHeader
          title={currentTitle}
          branchName="Chi nhánh chính"
          actionLabel="Tài khoản"
          showPortalLink={true}
        />
        <div className="flex flex-1 min-h-0">
          <AdminSidebar />
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RoleGate>
  );
}
