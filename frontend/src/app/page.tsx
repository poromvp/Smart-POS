"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/layout/TopHeader";
import ModuleCard from "@/components/portal/ModuleCard";
import {
  MonitorSmartphone,
  ChefHat,
  UtensilsCrossed,
  Package,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function DashboardPortalPage() {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setNow(new Date());
    }, 0);

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const timeString = now
    ? now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "09:41";

  const dateString = now
    ? (() => {
        const str = now.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
        });
        return str.charAt(0).toUpperCase() + str.slice(1);
      })()
    : "Thứ Tư, ngày 14 tháng 10";

  const greeting = (() => {
    if (!now) return "Chào buổi sáng!";
    const hour = now.getHours();
    if (hour < 12) return "Chào buổi sáng!";
    if (hour < 18) return "Chào buổi chiều!";
    return "Chào buổi tối!";
  })();

  const modules = [
    {
      title: "Bán hàng (POS)",
      description: "Gọi món, chọn bàn & thanh toán",
      href: "/pos",
      icon: MonitorSmartphone,
      badge: "Ca đang mở",
    },
    {
      title: "Điều phối bếp (KDS)",
      description: "Theo dõi & trả món thời gian thực",
      href: "/kds",
      icon: ChefHat,
    },
    {
      title: "Thực đơn & BOM",
      description: "Danh mục món ăn & định lượng",
      href: "/menu",
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
      description: "Thiết lập sơ đồ bàn & máy in",
      href: "/admin/branches",
      icon: Settings,
    },
    {
      title: "Đăng xuất",
      description: "Kết thúc phiên làm việc hiện tại",
      href: "/login",
      icon: LogOut,
      isDanger: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-gray-50 to-gray-100/70 flex flex-col">
      <TopHeader
        title="Quản lý nhà hàng"
        userName="Người dùng"
        actionLabel="Đăng xuất"
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
            Chọn phân hệ để bắt đầu.
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
              onClick={() => router.push(item.href)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}