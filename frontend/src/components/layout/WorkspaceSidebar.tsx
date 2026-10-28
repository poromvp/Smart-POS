"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  MonitorSmartphone,
  ChefHat,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const workspaceNavItems = [
  { label: "Cổng phân hệ", href: "/", icon: LayoutGrid, exact: true },
  { label: "Thu ngân (POS)", href: "/pos", icon: MonitorSmartphone },
  { label: "Điều phối bếp", href: "/kds", icon: ChefHat },
  { label: "Thực đơn", href: "/menu", icon: UtensilsCrossed },
  { label: "Quản trị", href: "/admin", icon: BarChart3 },
];

export default function WorkspaceSidebar({
  defaultCollapsed = true,
}: {
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <aside
      className={`${
        collapsed ? "w-18" : "w-60"
      } bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 transition-all duration-200 p-3 select-none`}
    >
      <div>
        <div className="flex items-center justify-between px-2 py-1.5 mb-3">
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Phân hệ
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors mx-auto cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="space-y-1.5">
          {workspaceNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center ${
                  collapsed ? "justify-center px-2" : "px-3.5"
                } py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-orange-600 text-white font-semibold shadow-xs shadow-orange-500/25"
                    : "text-gray-600 font-medium hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-orange-600"
                  }`}
                />
                {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <button
          onClick={() => router.push("/login")}
          title={collapsed ? "Đăng xuất" : undefined}
          className={`w-full flex items-center ${
            collapsed ? "justify-center px-2" : "px-3.5"
          } py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="ml-3">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}