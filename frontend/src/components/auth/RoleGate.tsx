"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LayoutGrid, ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { evaluateGateAccess } from "@/lib/role-gate-logic";

interface RoleGateProps {
  allowedRoles?: readonly string[];
  requiredPermissions?: readonly string[];
  requireAllPermissions?: boolean;
  children: ReactNode;
}

export default function RoleGate({
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  children,
}: RoleGateProps) {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth();

  const status = evaluateGateAccess({
    isAuthenticated,
    roleName: currentUser?.roleName,
    permissions: currentUser?.permissions,
    allowedRoles,
    requiredPermissions,
    requireAllPermissions,
  });

  useEffect(() => {
    if (!isLoading && status === "redirect_login") {
      router.replace("/login");
    }
  }, [isLoading, status, router]);

  if (isLoading || status === "redirect_login") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-sm font-medium text-gray-500"
        aria-busy="true"
        role="status"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <span>Đang kiểm tra quyền truy cập...</span>
        </div>
      </main>
    );
  }

  if (status === "forbidden") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <p className="text-xs font-extrabold uppercase tracking-widest text-red-500">
            HTTP 403 • Forbidden
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Không có quyền truy cập
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Tài khoản{" "}
            <strong className="text-gray-900">
              {currentUser?.fullName || currentUser?.username}
            </strong>{" "}
            (vai trò{" "}
            <span className="font-semibold text-orange-700">
              {currentUser?.roleName}
            </span>
            ) chưa được cấp quyền vào khu vực này.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors cursor-pointer"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Về Cổng phân hệ</span>
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </button>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất tài khoản khác</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
