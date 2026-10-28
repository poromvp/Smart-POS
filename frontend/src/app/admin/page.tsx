"use client";

import React, { useState } from "react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge, { type StatusVariant } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Flame,
} from "lucide-react";

const HOURLY_REVENUE = [
  { hour: "0h", percent: 22, amount: "1.200.000đ" },
  { hour: "4h", percent: 38, amount: "2.100.000đ" },
  { hour: "8h", percent: 58, amount: "3.400.000đ" },
  { hour: "12h", percent: 100, amount: "5.800.000đ" },
  { hour: "16h", percent: 70, amount: "4.100.000đ" },
  { hour: "20h", percent: 55, amount: "3.200.000đ" },
];

const BEST_SELLERS = [
  { rank: 1, name: "Phở bò đặc biệt", sold: "48 phần" },
  { rank: 2, name: "Cơm tấm sườn bì", sold: "39 phần" },
  { rank: 3, name: "Trà đào cam sả", sold: "35 ly" },
  { rank: 4, name: "Bún bò Huế", sold: "28 phần" },
];

const RECENT_ORDERS: {
  id: string;
  branchTable: string;
  total: string;
  status: string;
  variant: StatusVariant;
}[] = [
  {
    id: "HĐ-001",
    branchTable: "CN01 / T1-02",
    total: "140.000đ",
    status: "Đã thanh toán",
    variant: "success",
  },
  {
    id: "HĐ-002",
    branchTable: "CN01 / VIP-01",
    total: "450.000đ",
    status: "Đang phục vụ",
    variant: "serving",
  },
];

export default function AdminOverviewPage() {
  const [branch, setBranch] = useState("all");
  const [period, setPeriod] = useState("today");
  const toast = useToast();

  const handleExport = () => {
    toast.success(
      "Xuất báo cáo thành công",
      "Báo cáo doanh thu đa chi nhánh đã được tải xuống dưới dạng Excel."
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-4 py-2.5 w-full sm:w-64 outline-none shadow-2xs"
        >
          <option value="all">Tất cả chi nhánh</option>
          <option value="cn01">Chi nhánh 01</option>
          <option value="cn02">Chi nhánh 02</option>
        </select>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-4 py-2.5 w-full sm:w-48 outline-none shadow-2xs"
        >
          <option value="today">Hôm nay</option>
          <option value="yesterday">Hôm qua</option>
          <option value="week">7 ngày qua</option>
          <option value="month">Tháng này</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Doanh thu ngày" value="12.450.000đ" icon={DollarSign} />
        <StatCard label="Tổng đơn hoàn tất" value="154 đơn" icon={CheckCircle2} />
        <StatCard label="Thời gian bếp TB" value="08:45 phút" icon={Clock} />
        <StatCard
          label="Cảnh báo tồn kho"
          value="3 nguyên liệu"
          icon={AlertTriangle}
          isWarning={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-800">
              Doanh thu theo khung giờ
            </h2>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Giờ cao điểm: 12h
            </span>
          </div>

          <div className="h-52 flex items-end justify-between gap-4 pt-6 px-3 border-b border-gray-200">
            {HOURLY_REVENUE.map((item) => (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                <span className="text-[11px] font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.amount}
                </span>
                <div
                  style={{ height: `${item.percent}%` }}
                  className={`w-full max-w-15 rounded-t-lg transition-all ${
                    item.percent === 100
                      ? "bg-orange-600 shadow-sm shadow-orange-500/30"
                      : "bg-orange-200 group-hover:bg-orange-400"
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-4 pt-3 px-3">
            {HOURLY_REVENUE.map((item) => (
              <div
                key={item.hour}
                className="flex-1 text-center text-xs font-semibold text-gray-500"
              >
                {item.hour}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-gray-800">Món bán chạy</h2>
          </div>

          <ul className="space-y-3">
            {BEST_SELLERS.map((dish) => (
              <li
                key={dish.rank}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-orange-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      dish.rank === 1
                        ? "bg-orange-600 text-white"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {dish.rank}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {dish.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {dish.sold}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Đơn hàng gần đây</h2>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-300 hover:border-orange-300 text-sm font-semibold px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                <th className="py-3.5 px-6">Mã hóa đơn</th>
                <th className="py-3.5 px-6">Chi nhánh / bàn</th>
                <th className="py-3.5 px-6">Tổng tiền</th>
                <th className="py-3.5 px-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {RECENT_ORDERS.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-orange-50/30 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-gray-900">
                    {order.id}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-medium">
                    {order.branchTable}
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-800">
                    {order.total}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge label={order.status} variant={order.variant} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}