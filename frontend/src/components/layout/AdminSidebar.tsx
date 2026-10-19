"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Users,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Thực đơn & BOM", href: "/admin/menu-bom", icon: UtensilsCrossed },
  { label: "Quản lý kho", href: "/admin/inventory", icon: Package },
  { label: "Nhân sự & chi nhánh", href: "/admin/staff-branches", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div>
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Quản trị
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-orange-50 text-orange-600 border-l-4 border-orange-600 font-semibold"
                    : "text-gray-600 hover:bg-orange-50/50 hover:text-orange-600"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-orange-600" : "text-gray-400"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}