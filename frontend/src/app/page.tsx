"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  KeyRound,
  LogOut,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
  Store,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getAccessibleWorkspaces } from "@/lib/auth-routing";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";

interface WorkspaceCardItem {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  badge: string;
  visible: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-sm font-medium text-gray-500"
        aria-busy="true"
        role="status"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <span>Đang kiểm tra phiên đăng nhập...</span>
        </div>
      </main>
    );
  }

  const accessible = getAccessibleWorkspaces({
    roleName: currentUser.roleName,
    permissions: currentUser.permissions,
  });

  const cards: WorkspaceCardItem[] = [
    {
      key: "admin",
      title: "Quản trị hệ thống",
      description:
        "Quản lý doanh thu, thực đơn, kho hàng, nhân sự và ma trận vai trò phân quyền.",
      href: "/admin",
      icon: BarChart3,
      accentBg: "bg-indigo-50 border-indigo-100",
      accentText: "text-indigo-600",
      badge: "ADMIN / MANAGER",
      visible: accessible.admin,
    },
    {
      key: "pos",
      title: "Quầy Thu ngân (POS)",
      description:
        "Theo dõi sơ đồ bàn, lập hóa đơn, áp dụng khuyến mãi và thanh toán tiền mặt / VietQR.",
      href: "/pos",
      icon: MonitorSmartphone,
      accentBg: "bg-orange-50 border-orange-100",
      accentText: "text-orange-600",
      badge: "POS ACCESS",
      visible: accessible.pos,
    },
    {
      key: "kds",
      title: "Điều phối Bếp (KDS)",
      description:
        "Nhận danh sách món theo trạm bếp thời gian thực, cập nhật chế biến và kho nguyên liệu.",
      href: "/kds",
      icon: ChefHat,
      accentBg: "bg-emerald-50 border-emerald-100",
      accentText: "text-emerald-600",
      badge: "KDS VIEW",
      visible: accessible.kds,
    },
    {
      key: "order-taking",
      title: "Phục vụ Gọi món",
      description:
        "Ghi nhận món tại bàn nhanh chóng cho nhân viên phục vụ và gửi trực tiếp về bếp.",
      href: "/order-taking",
      icon: ClipboardList,
      accentBg: "bg-amber-50 border-amber-100",
      accentText: "text-amber-600",
      badge: "WAITER",
      visible: accessible.orderTaking,
    },
    {
      key: "menu",
      title: "Thực đơn Khách hàng",
      description:
        "Giao diện thực đơn điện tử quét mã QR dành cho thực khách tại bàn.",
      href: "/menu",
      icon: UtensilsCrossed,
      accentBg: "bg-slate-50 border-slate-200",
      accentText: "text-slate-700",
      badge: "PUBLIC MENU",
      visible: true,
    },
  ];

  const visibleCards = cards.filter((c) => c.visible);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-white to-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 px-5 lg:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-orange-600 tracking-tight text-lg">
              SmartPOS
            </span>
            <span className="ml-2 text-xs font-semibold text-gray-400 hidden sm:inline">
              Cổng phân hệ làm việc
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsChangePasswordOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 lg:px-8 lg:py-12 space-y-8">
        <section className="rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>Vai trò: {currentUser.roleName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Xin chào, {currentUser.fullName || currentUser.username}
            </h1>
            <p className="text-sm text-gray-600">
              Tài khoản{" "}
              <span className="font-mono font-semibold text-gray-800">
                @{currentUser.username}
              </span>{" "}
              đang sở hữu{" "}
              <strong className="text-orange-600">
                {currentUser.permissions?.length || 0} quyền
              </strong>{" "}
              nghiệp vụ trong hệ thống. Chọn phân hệ bên dưới để bắt đầu làm việc.
            </p>
          </div>

          {currentUser.permissions && currentUser.permissions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-w-md">
              {currentUser.permissions.slice(0, 6).map((perm) => (
                <span
                  key={perm}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-700"
                >
                  {perm}
                </span>
              ))}
              {currentUser.permissions.length > 6 && (
                <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                  +{currentUser.permissions.length - 6} quyền khác
                </span>
              )}
            </div>
          )}
        </section>

        {accessible.count === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3 text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Chưa có quyền truy cập phân hệ vận hành nào</p>
              <p className="text-amber-800 mt-0.5">
                Vai trò <strong>{currentUser.roleName}</strong> hiện chưa được gán quyền truy cập các phân hệ nội bộ (POS, KDS, Quản trị hoặc Phục vụ). Vui lòng liên hệ Quản trị viên để cấp quyền tại mục Quản lý nhân sự.
              </p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.key}
                href={card.href}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${card.accentBg} ${card.accentText}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-gray-600">
                      {card.badge}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-orange-600">
                  <span>Mở phân hệ</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </section>
      </main>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
