"use client";

import TopHeader from "@/components/layout/TopHeader";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import Link from "next/link";
import { UtensilsCrossed, ClipboardList } from "lucide-react";

export default function OrderTakingPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-100 text-slate-900">
      <TopHeader
        title="Phục vụ & Ghi nhận đơn"
        branchName="Chi nhánh chính"
        showPortalLink={true}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WorkspaceSidebar defaultCollapsed={true} title="Phục vụ" />

        <main className="flex flex-1 items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-amber-200 bg-white p-8 shadow-xl shadow-orange-100/70">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
              <ClipboardList className="h-4 w-4" />
              <span>Waiter Panel</span>
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900">
              Phục vụ &amp; Ghi nhận đơn
            </h2>
            <p className="mt-4 max-w-xl text-slate-600 leading-relaxed">
              Đây là giao diện dành cho nhân viên phục vụ theo dõi bàn, ghi nhận món tại bàn và gửi order về quầy bếp.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span>Mở thực đơn gọi món</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>Về Cổng phân hệ</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
