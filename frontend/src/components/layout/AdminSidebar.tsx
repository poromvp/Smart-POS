"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  Package,
  Users,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}

const adminNavItems: AdminNavItem[] = [
  {
    label: "Tổng quan",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Món ăn & Thực đơn",
    href: "/admin/products",
    icon: UtensilsCrossed,
  },
  {
    label: "Định lượng BOM",
    href: "/admin/menu-bom",
    icon: Layers,
  },
  {
    label: "Quản lý kho",
    href: "/admin/inventory",
    icon: Package,
  },
  {
    label: "Nhân sự & chi nhánh",
    href: "/admin/staff",
    icon: Users,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4 select-none">
      <div>
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Quản trị
        </div>

        <nav className="space-y-1.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-orange-600 text-white font-semibold shadow-xs shadow-orange-500/25"
                    : "text-gray-600 font-medium hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-orange-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? "bg-white text-orange-600"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-4 h-4 text-white/80" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={() => router.push("/login")}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
