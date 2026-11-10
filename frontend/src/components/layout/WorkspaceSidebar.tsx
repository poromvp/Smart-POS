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
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getAccessibleWorkspaces } from "@/lib/auth-routing";

export interface WorkspaceNavItem {
  id?: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  exact?: boolean;
  badge?: string | number;
  workspaceKey?: "admin" | "pos" | "kds" | "orderTaking";
}

const defaultNavItems: WorkspaceNavItem[] = [
  { label: "Cổng phân hệ", href: "/", icon: LayoutGrid, exact: true },
  {
    label: "Thu ngân (POS)",
    href: "/pos",
    icon: MonitorSmartphone,
    workspaceKey: "pos",
  },
  {
    label: "Điều phối bếp",
    href: "/kds",
    icon: ChefHat,
    workspaceKey: "kds",
  },
  {
    label: "Phục vụ bàn",
    href: "/order-taking",
    icon: ClipboardList,
    workspaceKey: "orderTaking",
  },
  { label: "Thực đơn", href: "/menu", icon: UtensilsCrossed },
  {
    label: "Quản trị",
    href: "/admin",
    icon: BarChart3,
    workspaceKey: "admin",
  },
];

export default function WorkspaceSidebar({
  defaultCollapsed = true,
  items,
  title = "Chức năng",
}: {
  defaultCollapsed?: boolean;
  items?: WorkspaceNavItem[];
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const accessible = getAccessibleWorkspaces({
    roleName: currentUser?.roleName,
    permissions: currentUser?.permissions,
  });

  const navItems =
    items && items.length > 0
      ? items
      : defaultNavItems.filter(
          (item) => !item.workspaceKey || accessible[item.workspaceKey]
        );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

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
              {title}
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors mx-auto cursor-pointer"
            title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              item.active !== undefined
                ? item.active
                : item.href
                ? item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                : false;

            const content = (
              <>
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-orange-600"
                    }`}
                  />
                  {collapsed && item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-black text-white ring-2 ring-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                {!collapsed && (
                  <div className="ml-3 flex flex-1 items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isActive
                            ? "bg-white text-orange-700"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </>
            );

            const className = `group flex items-center ${
              collapsed ? "justify-center px-2" : "px-3.5"
            } py-2.5 rounded-xl text-sm transition-all w-full cursor-pointer ${
              isActive
                ? "bg-orange-600 text-white font-semibold shadow-xs shadow-orange-500/25"
                : "text-gray-600 font-medium hover:bg-orange-50 hover:text-orange-600"
            }`;

            if (item.onClick) {
              return (
                <button
                  key={item.id || item.label || index}
                  type="button"
                  onClick={item.onClick}
                  title={collapsed ? item.label : undefined}
                  className={className}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.href || item.id || index}
                href={item.href || "#"}
                title={collapsed ? item.label : undefined}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
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
