"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { resolveLandingRoute } from "@/lib/auth-routing";
import {
  Store,
  Eye,
  EyeOff,
  Utensils,
  ShieldCheck,
  KeyRound,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import AlertBanner from "@/components/ui/AlertBanner";

export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(username.trim(), password);
      const targetUrl = resolveLandingRoute({
        roleName: user.roleName,
        permissions: user.permissions,
      });

      toast.success(
        "Đăng nhập thành công",
        `Chào mừng ${user.fullName || user.username} đến với hệ thống SmartPOS.`
      );

      router.push(targetUrl);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Tên đăng nhập hoặc mật khẩu không chính xác.";
      setErrorMsg(msg);
      toast.error("Đăng nhập thất bại", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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

            <p className="text-sm text-orange-100/85 leading-relaxed max-w-sm">
              Nền tảng hỗ trợ bán hàng POS, điều phối bếp KDS và quản trị vận hành đa phân hệ theo thời gian thực.
            </p>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
              <ShieldCheck className="w-5 h-5 text-orange-300 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-orange-100/85">
                <p className="font-semibold text-white mb-1">
                  Phân quyền động theo vai trò
                </p>
                <p>
                  Đăng nhập bằng tài khoản nhân viên do Quản lý hoặc Quản trị viên cấp. Hệ thống sẽ tự động mở đúng khu vực làm việc theo quyền được giao.
                </p>
              </div>
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
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold uppercase text-slate-600 mb-1.5"
                >
                  Tên đăng nhập
                </label>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  aria-label="Tên đăng nhập"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              <div className="relative">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase text-slate-600 mb-1.5"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    aria-label="Mật khẩu"
                    className="w-full pl-5 pr-12 py-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
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
                  onClick={() => setIsForgotModalOpen(true)}
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

      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Cấp lại mật khẩu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              Vì lý do bảo mật nội bộ nhà hàng, vui lòng liên hệ{" "}
              <strong className="text-slate-900">Quản lý / Quản trị viên</strong>{" "}
              để được cấp lại mật khẩu qua trang{" "}
              <strong className="text-slate-900">Quản lý nhân sự</strong>.
            </p>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
