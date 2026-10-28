"use client";

import React, { useState } from "react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Package,
  AlertTriangle,
  Wallet,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  FilePlus2,
} from "lucide-react";

type InventoryTab = "stock" | "transactions" | "audit";

interface StockItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
}

const INITIAL_STOCK: StockItem[] = [
  { id: "ing-1", name: "Bánh phở tươi", unit: "kg", stock: 15, minStock: 5 },
  { id: "ing-2", name: "Thịt bò phi lê", unit: "kg", stock: 2, minStock: 5 },
  { id: "ing-3", name: "Nước dùng", unit: "lít", stock: 30, minStock: 10 },
  { id: "ing-4", name: "Tôm sú tươi", unit: "kg", stock: 1.5, minStock: 3 },
  { id: "ing-5", name: "Trà đào túi lọc", unit: "hộp", stock: 12, minStock: 4 },
];

const RECENT_TRANSACTIONS = [
  { id: "tx-1", text: "Nhập thịt bò · 10 kg · Hôm nay", type: "in" },
  { id: "tx-2", text: "Xuất bánh phở · 3 kg · Hôm nay", type: "out" },
  { id: "tx-3", text: "Nhập nước cốt đào · 5 chai · Hôm qua", type: "in" },
];

export default function InventoryPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<InventoryTab>("stock");
  const [searchQuery, setSearchQuery] = useState("");
  const [branch, setBranch] = useState("cn01");

  const filteredStock = INITIAL_STOCK.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        {[
          { id: "stock", label: "Tồn kho" },
          { id: "transactions", label: "Nhập / xuất kho" },
          { id: "audit", label: "Kiểm kê" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InventoryTab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                isActive
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs shadow-orange-500/20"
                  : "bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-600"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nguyên liệu..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="cn01">Chi nhánh 01</option>
            <option value="cn02">Chi nhánh 02</option>
          </select>

          <button
            onClick={() =>
              toast.success("Tạo phiếu nhập kho", "Đang mở biểu mẫu nhập nguyên liệu.")
            }
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nhập kho
          </button>

          <button
            onClick={() =>
              toast.info("Tạo phiếu xuất kho", "Đang mở biểu mẫu xuất nguyên liệu.")
            }
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            Xuất kho
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Nguyên liệu" value="24 loại" icon={Package} />
        <StatCard
          label="Sắp hết hàng"
          value="3 loại"
          icon={AlertTriangle}
          isWarning={true}
        />
        <StatCard label="Giá trị tồn kho" value="8.500.000đ" icon={Wallet} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
              <th className="py-3.5 px-6">Nguyên liệu</th>
              <th className="py-3.5 px-6">Đơn vị</th>
              <th className="py-3.5 px-6">Tồn kho</th>
              <th className="py-3.5 px-6">Tối thiểu</th>
              <th className="py-3.5 px-6">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredStock.map((item) => {
              const isLow = item.stock <= item.minStock;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-orange-50/25 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-gray-900">
                    {item.name}
                  </td>
                  <td className="py-4 px-6 text-gray-500 font-medium">
                    {item.unit}
                  </td>
                  <td
                    className={`py-4 px-6 font-bold ${
                      isLow ? "text-orange-600" : "text-gray-800"
                    }`}
                  >
                    {item.stock}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-medium">
                    {item.minStock}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge
                      label={isLow ? "Sắp hết" : "Đủ hàng"}
                      variant={isLow ? "warning" : "success"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-orange-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-gray-900">
              Cảnh báo tồn kho
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              3 nguyên liệu dưới mức tối thiểu.
              <br />
              Kiểm tra và tạo phiếu nhập.
            </p>
          </div>

          <button
            onClick={() =>
              toast.warning(
                "Đã tạo phiếu nhập đề xuất",
                "Hệ thống đã điền sẵn 3 nguyên liệu dưới định mức tối thiểu."
              )
            }
            className="w-full py-2.5 px-4 rounded-xl border border-orange-500 bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            Tạo phiếu nhập
          </button>
        </div>

        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">
              Giao dịch gần đây
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-700 font-medium">
              {RECENT_TRANSACTIONS.map((tx) => (
                <li key={tx.id} className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      tx.type === "in" ? "bg-emerald-500" : "bg-orange-500"
                    }`}
                  />
                  {tx.text}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setActiveTab("transactions")}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 self-start cursor-pointer"
          >
            <span>Xem tất cả giao dịch</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}