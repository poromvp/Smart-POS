import React from "react";
import TopHeader from "@/components/layout/TopHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopHeader
        title="Báo cáo doanh thu & vận hành đa chi nhánh"
        rightText="Chi nhánh 01"
        actionText="Tài khoản"
      />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}