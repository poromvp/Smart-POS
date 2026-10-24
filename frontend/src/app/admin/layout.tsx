"use client";

import React from "react";
import { usePathname } from "next/navigation";
import TopHeader from "@/components/layout/TopHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import RoleGate from "@/components/auth/RoleGate";

const ADMIN_ALLOWED_ROLES = ["manager"] as const;

const HEADER_TITLES: Record<string, string> = {
  "/admin": "Báo cáo doanh thu & vận hành đa chi nhánh",
  "/admin/menu-bom": "Thiết lập thực đơn & định lượng nguyên vật liệu",
  "/admin/inventory": "Quản lý kho hàng",
  "/admin/staff": "Nhân sự, chi nhánh & mã QR",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTitle =
    HEADER_TITLES[pathname] ?? "Báo cáo doanh thu & vận hành đa chi nhánh";

  return (
    <RoleGate allowedRoles={ADMIN_ALLOWED_ROLES}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopHeader
          title={currentTitle}
          branchName="Chi nhánh 01"
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
