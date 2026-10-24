"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Eye,
  EyeOff,
  ChefHat,
  MonitorSmartphone,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import AlertBanner from "@/components/ui/AlertBanner";

interface DemoAccount {
  role: string;
  email: string;
  password: string;
  redirectUrl: string;
  icon: React.ElementType;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "Đầu bếp",
    email: "chef@smartpos.vn",
    password: "123456",
    redirectUrl: "/kds",
    icon: ChefHat,
  },
  {
    role: "Thu ngân",
    email: "cashier@smartpos.vn",
    password: "123456",
    redirectUrl: "/pos",
    icon: MonitorSmartphone,
  },
  {
    role: "Quản lý",
    email: "manager@smartpos.vn",
    password: "123456",
    redirectUrl: "/",
    icon: ShieldCheck,
  },
  {
    role: "Phục vụ",
    email: "waiter@smartpos.vn",
    password: "123456",
    redirectUrl: "/order-taking",
    icon: Utensils,
  },
];

export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("chef@smartpos.vn");
  const [password, setPassword] = useState("123456");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMsg(null);
    toast.info(
      `Đã chọn tài khoản ${account.role}`,
      `Email: ${account.email}`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const matchedAccount = DEMO_ACCOUNTS.find(
        (acc) =>
          acc.email.toLowerCase() === email.trim().toLowerCase() &&
          acc.password === password
      );

      if (!matchedAccount && password !== "123456") {
        setIsLoading(false);
        setErrorMsg("Email hoặc mật khẩu không chính xác.");
        toast.error("Đăng nhập thất bại", "Vui lòng kiểm tra lại thông tin.");
        return;
      }

      const targetUrl = matchedAccount ? matchedAccount.redirectUrl : "/";
      const roleTitle = matchedAccount ? matchedAccount.role : "Người dùng";

      toast.success(
        "Đăng nhập thành công",
        `Chào mừng ${roleTitle} đến với hệ thống SmartPOS.`
      );

      router.push(targetUrl);
    }, 500);
  };

  return (
    <div className="relative z-10 w-full max-w-[960px] rounded-[28px] overflow-hidden shadow-2xl border border-white/15 grid grid-cols-1 lg:grid-cols-12 bg-white">
      <div className="lg:col-span-6 bg-gradient-to-br from-[#432312] via-[#5c2d16] to-[#361b0d] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-lg mb-8">
            <Store className="w-8 h-8 text-orange-300" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/90 mb-3">
            SMARTPOS SYSTEM
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-white mb-4">
            Hệ thống
            <br />
            Quản lý Nhà hàng
          </h1>

          <p className="text-sm text-orange-100/80 leading-relaxed max-w-sm">
            Nền tảng hỗ trợ bán hàng POS, điều phối bếp KDS và quản trị vận hành đa chi nhánh thời gian thực.
          </p>
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-200/70 mb-2.5">
            Chọn nhanh tài khoản Demo:
          </p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              const isSelected = email.toLowerCase() === acc.email.toLowerCase();
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer border ${
                    isSelected
                      ? "bg-orange-500 text-white border-orange-400 shadow-md"
                      : "bg-white/5 hover:bg-white/15 text-orange-100 border-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-orange-200" />
                  <div className="truncate">
                    <div className="font-bold leading-none">{acc.role}</div>
                    <div className="text-[10px] opacity-75 truncate mt-0.5">
                      {acc.email}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-orange-200/60 font-medium">
            © 2026 SmartPOS
          </p>
        </div>
      </div>

      <div className="lg:col-span-6 bg-white p-8 sm:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-8 tracking-tight">
            Đăng nhập tài khoản
          </h2>

          {errorMsg && (
            <div className="mb-5">
              <AlertBanner
                variant="error"
                title="Đăng nhập không thành công"
                description={errorMsg}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartpos.vn"
                aria-label="Email hoặc tên đăng nhập"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                aria-label="Mật khẩu"
                className="w-full pl-5 pr-12 py-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
              <label className="flex items-center gap-2.5 text-slate-700 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "Khôi phục mật khẩu",
                    "Vui lòng liên hệ Quản lý chi nhánh để cấp lại mật khẩu."
                  )
                }
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 active:scale-[0.99] disabled:opacity-60 text-slate-950 font-extrabold text-sm tracking-widest uppercase shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
              >
                {isLoading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <Link
              href="/menu"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-800 transition-colors hover:border-orange-300 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <Utensils className="h-4 w-4" aria-hidden="true" />
              Xem thực đơn dành cho khách
            </Link>
            <p className="mt-2 text-center text-xs leading-5 text-slate-500">
              Khách tại nhà hàng vui lòng quét mã QR trên bàn để mở đúng thực đơn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
