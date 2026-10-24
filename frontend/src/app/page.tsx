"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/layout/TopHeader";
import ModuleCard from "@/components/portal/ModuleCard";
import {
  BarChart3,
  ChefHat,
  LogOut,
  MonitorSmartphone,
  Package,
  Settings,
  Sparkles,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DEMO_ROLE_STORAGE_KEY, type UserRole } from "@/lib/auth";

type PortalModule = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
  isDanger?: boolean;
};

const ROLE_LABELS: Record<UserRole, string> = {
  chef: "Đầu bếp",
  cashier: "Thu ngân",
  manager: "Quản lý",
  waiter: "Phục vụ",
};

const MODULES_BY_ROLE: Record<UserRole, PortalModule[]> = {
  manager: [
    {
      title: "Bán hàng (POS)",
      description: "Màn hình dành cho nhân viên thu ngân",
      href: "/pos",
      icon: MonitorSmartphone,
      badge: "Nhân viên",
      disabled: true,
    },
    {
      title: "Điều phối bếp (KDS)",
      description: "Màn hình dành cho nhân viên bếp",
      href: "/kds",
      icon: ChefHat,
      badge: "Nhân viên",
      disabled: true,
    },
    {
      title: "Thực đơn & BOM",
      description: "Danh mục món ăn & định lượng",
      href: "/admin/menu-bom",
      icon: UtensilsCrossed,
    },
    {
      title: "Quản lý kho hàng",
      description: "Nhập xuất tồn & cảnh báo nguyên liệu",
      href: "/admin/inventory",
      icon: Package,
    },
    {
      title: "Báo cáo doanh thu",
      description: "Thống kê doanh số & vận hành",
      href: "/admin",
      icon: BarChart3,
    },
    {
      title: "Nhân sự & phân quyền",
      description: "Quản lý nhân viên & ca làm việc",
      href: "/admin/staff",
      icon: Users,
    },
    {
      title: "Cấu hình chi nhánh",
      description: "Thiết lập khu vực bàn & mã QR",
      href: "/admin/staff",
      icon: Settings,
    },
    {
      title: "Đăng xuất",
      description: "Kết thúc phiên làm việc hiện tại",
      href: "/login",
      icon: LogOut,
      isDanger: true,
    },
  ],
  chef: [
    {
      title: "Điều phối bếp (KDS)",
      description: "Theo dõi và cập nhật món tại trạm bếp",
      href: "/kds",
      icon: ChefHat,
    },
  ],
  cashier: [
    {
      title: "Bán hàng (POS)",
      description: "Chọn bàn, tạo hóa đơn và thanh toán",
      href: "/pos",
      icon: MonitorSmartphone,
    },
  ],
  waiter: [
    {
      title: "Phục vụ & ghi nhận đơn",
      description: "Theo dõi bàn và xử lý yêu cầu gọi món",
      href: "/order-taking",
      icon: Settings,
    },
  ],
};

function isUserRole(value: string | null): value is UserRole {
  return value === "chef" || value === "cashier" || value === "manager" || value === "waiter";
}

export default function DashboardPortalPage() {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const storedRole =
      window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY) ??
      window.sessionStorage.getItem(DEMO_ROLE_STORAGE_KEY);

    const initialTimer = window.setTimeout(() => {
      if (!isUserRole(storedRole)) {
        router.replace("/login");
        return;
      }

      setRole(storedRole);
      setNow(new Date());
    }, 0);
    const interval = window.setInterval(() => setNow(new Date()), 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [router]);

  const timeString = now
    ? now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

  const dateString = now
    ? (() => {
        const str = now.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
        });
        return str.charAt(0).toUpperCase() + str.slice(1);
      })()
    : "";

  const greeting = (() => {
    if (!now) return "Xin chào!";
    const hour = now.getHours();
    if (hour < 12) return "Chào buổi sáng!";
    if (hour < 18) return "Chào buổi chiều!";
    return "Chào buổi tối!";
  })();

  const handleLogout = () => {
    window.localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
    window.sessionStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
    router.replace("/login");
  };

  if (!role) {
    return <main className="min-h-screen bg-gray-50" aria-busy="true" />;
  }

  const modules = MODULES_BY_ROLE[role];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-gray-50 to-gray-100/70 flex flex-col">
      <TopHeader
        title={role === "manager" ? "Quản lý nhà hàng" : "Khu vực làm việc"}
        userName={ROLE_LABELS[role]}
        actionLabel="Đăng xuất"
        onActionClick={handleLogout}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100/80 text-orange-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{dateString}</span>
          </div>

          <div className="text-6xl sm:text-7xl font-extrabold text-gray-900 tracking-tight tabular-nums mb-3">
            {timeString}
          </div>

          <p className="text-base sm:text-lg text-gray-600 font-medium">
            <span className="text-orange-600 font-semibold">{greeting}</span>{" "}
            {role === "manager"
              ? "Chọn khu vực quản trị để bắt đầu."
              : "Chọn khu vực được cấp cho vai trò của bạn."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
          {modules.map((item) => (
            <ModuleCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
              badge={item.badge}
              isDanger={item.isDanger}
              disabled={item.disabled}
              onClick={() => {
                if (item.isDanger) {
                  handleLogout();
                  return;
                }

                router.push(item.href);
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
