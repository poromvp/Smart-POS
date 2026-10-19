"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, Building2, UserCheck, LogOut, LayoutGrid } from "lucide-react";

interface TopHeaderProps {
  title: string;
  branchName?: string;
  userName?: string;
  actionLabel?: string;
  showPortalLink?: boolean;
  rightContent?: React.ReactNode;
  onActionClick?: () => void;
}

export default function TopHeader({
  title,
  branchName,
  userName = "Người dùng",
  actionLabel = "Đăng xuất",
  showPortalLink = false,
  rightContent,
  onActionClick,
}: TopHeaderProps) {
  const router = useRouter();

  const handleAction = () => {
    if (onActionClick) {
      onActionClick();
      return;
    }
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-5 lg:px-7 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs hover:bg-orange-700 transition-colors"
        >
          <Store className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-orange-600 tracking-tight text-lg hidden sm:inline">
            SmartPOS
          </span>
          <span className="text-gray-300 hidden sm:inline">/</span>
          <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 text-sm">
        {rightContent && (
          <div className="flex items-center gap-3 pr-2 border-r border-gray-200">
            {rightContent}
          </div>
        )}

        {showPortalLink && (
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 font-medium transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden xl:inline">Cổng phân hệ</span>
          </Link>
        )}

        {branchName ? (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 font-semibold text-xs">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>{branchName}</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 text-gray-700 font-medium">
            <UserCheck className="w-4 h-4 text-orange-600" />
            <span>{userName}</span>
          </div>
        )}

        <button
          onClick={handleAction}
          className="flex items-center gap-1.5 text-gray-600 hover:text-orange-600 font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{actionLabel}</span>
        </button>
      </div>
    </header>
  );
}