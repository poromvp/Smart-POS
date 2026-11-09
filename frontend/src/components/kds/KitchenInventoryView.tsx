"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Printer,
  Boxes,
  Layers,
} from "lucide-react";
import { fetchIngredients, fetchLowStockAlerts } from "@/lib/api";
import type { IngredientResponse, LowStockAlertResponse } from "@/lib/types/inventory";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";

interface KitchenInventoryViewProps {
  onPrintExpiry?: (ingredientName: string) => void;
  onBackToTasks?: () => void;
}

export default function KitchenInventoryView({
  onPrintExpiry,
  onBackToTasks,
}: KitchenInventoryViewProps) {
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertResponse[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "low" | "out" | "safe">("all");
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();

  const loadStockData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [items, alerts] = await Promise.all([
        fetchIngredients(),
        fetchLowStockAlerts().catch(() => []),
      ]);
      setIngredients(items || []);
      setLowStockAlerts(alerts || []);
    } catch (err) {
      console.warn("Lỗi tải tồn kho nguyên liệu bếp:", err);
      toast.error("Lỗi tải kho", "Không thể lấy danh sách nguyên liệu từ kho.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStockData();
    const timer = setInterval(loadStockData, 10000);
    return () => clearInterval(timer);
  }, [loadStockData]);

  // Bộ lọc
  const filteredItems = useMemo(() => {
    return ingredients.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        (item.code && item.code.toLowerCase().includes(search.toLowerCase().trim()));

      if (!matchesSearch) return false;

      if (filterType === "out") {
        return item.currentStock <= 0;
      }
      if (filterType === "low") {
        return item.currentStock > 0 && item.currentStock <= item.minThreshold;
      }
      if (filterType === "safe") {
        return item.currentStock > item.minThreshold;
      }
      return true;
    });
  }, [ingredients, search, filterType]);

  const outOfStockCount = useMemo(
    () => ingredients.filter((i) => i.currentStock <= 0).length,
    [ingredients]
  );

  const lowStockCount = useMemo(
    () => ingredients.filter((i) => i.currentStock > 0 && i.currentStock <= i.minThreshold).length,
    [ingredients]
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-stone-50">
      {/* Top Banner & KPI Tồn Kho Bếp */}
      <div className="border-b border-stone-200 bg-white px-5 py-3 lg:px-7">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Kho nguyên liệu Bếp
              </h2>
              <p className="text-xs text-stone-500">
                Theo dõi mức tồn nguyên liệu thực tế để chuẩn bị chế biến
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs">
              <span className="text-stone-500">Tổng danh mục:</span>
              <strong className="text-stone-800">{ingredients.length}</strong>
            </div>

            {lowStockCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>Sắp hết: {lowStockCount}</span>
              </div>
            )}

            {outOfStockCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800">
                <XCircle size={14} className="text-red-600" />
                <span>Hết hàng: {outOfStockCount}</span>
              </div>
            )}

            <button
              type="button"
              onClick={loadStockData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin text-orange-600" : ""} />
              <span>Làm mới</span>
            </button>

            {onBackToTasks && (
              <button
                type="button"
                onClick={onBackToTasks}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-orange-700 shadow-xs cursor-pointer transition"
              >
                <span>Về màn hình điều phối</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thanh công cụ Tìm kiếm & Lọc */}
      <div className="border-b border-stone-200 bg-stone-100/60 px-5 py-2.5 lg:px-7">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên nguyên liệu, mã code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === "all"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Tất cả ({ingredients.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("low")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === "low"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Sắp hết ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("out")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === "out"
                  ? "bg-white text-red-700 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Hết hàng ({outOfStockCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("safe")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === "safe"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Đủ dùng
            </button>
          </div>
        </div>
      </div>

      {/* Bảng Danh sách nguyên liệu */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 lg:px-7">
        <div className="mx-auto max-w-[1800px] rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-stone-100/90 backdrop-blur-xs border-b border-stone-200 text-stone-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Tên nguyên liệu</th>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Đơn vị</th>
                <th className="py-3 px-4 text-right">Tồn kho hiện tại</th>
                <th className="py-3 px-4 text-right">Ngưỡng tối thiểu</th>
                <th className="py-3 px-4 text-center">Tình trạng</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredItems.map((item) => {
                const isOut = item.currentStock <= 0;
                const isLow = !isOut && item.currentStock <= item.minThreshold;

                return (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-orange-50/40 ${
                      isOut ? "bg-red-50/20" : isLow ? "bg-amber-50/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                      {item.code || "—"}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-600">
                      {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm font-extrabold tabular-nums ${
                          isOut
                            ? "text-red-600"
                            : isLow
                            ? "text-amber-600"
                            : "text-stone-900"
                        }`}
                      >
                        {item.currentStock.toLocaleString("vi-VN")}
                      </span>{" "}
                      <span className="text-[11px] text-stone-400 font-normal">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-stone-500">
                      {item.minThreshold.toLocaleString("vi-VN")} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                          <XCircle size={12} />
                          Hết hàng
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200 animate-pulse">
                          <AlertTriangle size={12} />
                          Sắp hết
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          Đủ dùng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onPrintExpiry && onPrintExpiry(item.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-orange-300 hover:text-orange-600 transition cursor-pointer shadow-2xs"
                        title="In tem hạn sử dụng cho nguyên liệu này"
                      >
                        <Printer size={12} />
                        <span>In tem HSD</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Không tìm thấy nguyên liệu nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
