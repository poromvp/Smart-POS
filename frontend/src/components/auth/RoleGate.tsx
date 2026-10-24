"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DEMO_ROLE_STORAGE_KEY, type UserRole } from "@/lib/auth";

interface RoleGateProps {
  allowedRoles: readonly UserRole[];
  children: ReactNode;
}

function isUserRole(value: string | null): value is UserRole {
  return value === "chef" || value === "cashier" || value === "manager" || value === "waiter";
}

export default function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const role =
      window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY) ??
      window.sessionStorage.getItem(DEMO_ROLE_STORAGE_KEY);

    const checkTimer = window.setTimeout(() => {
      if (!isUserRole(role)) {
        router.replace("/login");
        return;
      }

      if (!allowedRoles.includes(role)) {
        router.replace("/");
        return;
      }

      setIsAllowed(true);
    }, 0);

    return () => window.clearTimeout(checkTimer);
  }, [allowedRoles, router]);

  if (!isAllowed) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-sm font-medium text-gray-500"
        aria-busy="true"
        role="status"
      >
        Đang kiểm tra quyền truy cập...
      </main>
    );
  }

  return children;
}
