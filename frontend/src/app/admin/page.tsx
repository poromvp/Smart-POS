"use client";

import React, { useState } from "react";
import StatCard from "@/components/ui/StatCard";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Flame,
} from "lucide-react";

const hourlyRevenue = [
  { hour: "0h", value: 25, amount: "1.200.000đ" },
  { hour: "4h", value: 45, amount: "2.100.000đ" },
  { hour: "8h", value: 65, amount: "3.400.000đ" },
  { hour: "12h", value: 100, amount: "5.800.000đ" },
  { hour: "16h", value: 75, amount: "4.100.000đ" },
  { hour: "20h", value: 60, amount: "3.200.000đ" },
];

const bestSellers = [
  { rank: 1, name: "Phở bò đặc biệt", sold: "48 phần" },
  { rank: 2, name: "Cơm tấm sườn bì", sold: "39 phần" },
  { rank: 3, name: "Trà đào cam sả", sold: "35 ly" },
  { rank: 4, name: "Bún bò Huế", sold: "28 phần" },
];

const recentOrders = [
  {
    id: "HĐ-001",
    branchTable: "CN01 / T1-02",
    total: "140.000đ",
    status: "Đã thanh toán",
  },
  {
    id: "HĐ-002",
    branchTable: "CN01 / VIP-01",
    total: "450.000đ",
    status: "Đang phục vụ",
  },
];

export default function AdminDashboardPage() {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedDate, setSelectedDate] = useState("today");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-4 py-2.5 w-full sm:w-64 outline-none"
        >
          <option value="all">Tất cả chi nhánh</option>
          <option value="cn01">Chi nhánh 01 - Quận 1</option>
          <option value="cn02">Chi nhánh 02 - Quận 3</option>
        </select>

        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-4 py-2.5 w-full sm:w-48 outline-none"
        >
          <option value="today">Hôm nay</option>
          <option value="yesterday">Hôm qua</option>
          <option value="week">7 ngày qua</option>
          <option value="month">Tháng này</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Doanh thu ngày"
          value="12.450.000đ"
          icon={DollarSign}
        />
        <StatCard
          label="Tổng đơn hoàn tất"
          value="154 đơn"
          icon={CheckCircle2}
        />
        <StatCard
          label="Thời gian bếp TB"
          value="08:45 phút"
          icon={Clock}
        />
        <StatCard
          label="Cảnh báo tồn kho"
          value="3 nguyên liệu"
          icon={AlertTriangle}
          isWarning={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-800">
              Doanh thu theo khung giờ
            </h2>
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              Cao điểm: 12h
            </span>
          </div>

          <div className="h-52 flex items-end justify-between gap-4 pt-6 px-2 border-b border-gray-200">
            {hourlyRevenue.map((item) => (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                <span className="text-[11px] font-medium text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.amount}
                </span>
                <div
                  style={{ height: `${item.value}%` }}
                  className={`w-full max-w-[56px] rounded-t-md transition-all ${
                    item.value === 100
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-orange-200 hover:bg-orange-400"
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-4 pt-3 px-2">
            {hourlyRevenue.map((item) => (
              <div
                key={item.hour}
                className="flex-1 text-center text-xs font-medium text-gray-500"
              >
                {item.hour}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-gray-800">Món bán chạy</h2>
          </div>

          <ul className="space-y-3.5">
            {bestSellers.map((item) => (
              <li
                key={item.rank}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-orange-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      item.rank === 1
                        ? "bg-orange-600 text-white"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.rank}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {item.sold}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">
            Đơn hàng gần đây
          </h2>
          <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                <th className="py-3.5 px-5">Mã hóa đơn</th>
                <th className="py-3.5 px-5">Chi nhánh / bàn</th>
                <th className="py-3.5 px-5">Tổng tiền</th>
                <th className="py-3.5 px-5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {recentOrders.map((order) => {
                const isPaid = order.status === "Đã thanh toán";
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-orange-50/30 transition-colors"
                  >
                    <td className="py-4 px-5 font-semibold text-gray-900">
                      {order.id}
                    </td>
                    <td className="py-4 px-5 text-gray-600">
                      {order.branchTable}
                    </td>
                    <td className="py-4 px-5 font-semibold text-gray-800">
                      {order.total}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          isPaid
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-orange-50 text-orange-700 border border-orange-200"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}