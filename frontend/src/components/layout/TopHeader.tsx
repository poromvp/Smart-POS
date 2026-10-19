"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserCheck, Store } from "lucide-react";

interface TopHeaderProps {
  title: string;
  userLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function TopHeader({
  title,
  userLabel = "Người dùng",
  actionLabel = "Đăng xuất",
  onAction,
}: TopHeaderProps) {
  const router = useRouter();

  const handleActionClick = () => {
    if (onAction) {
      onAction();
      return;
    }
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-orange-600 tracking-tight text-lg">
            SmartPOS
          </span>
          <span className="text-gray-300 text-lg font-light">/</span>
          <h1 className="text-base font-bold text-gray-800">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 font-medium">
          <UserCheck className="w-4 h-4 text-orange-600" />
          <span>{userLabel}</span>
        </div>

        <span className="text-gray-300">|</span>

        <button
          onClick={handleActionClick}
          className="flex items-center gap-1.5 text-gray-600 hover:text-orange-600 font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      </div>
    </header>
  );
}