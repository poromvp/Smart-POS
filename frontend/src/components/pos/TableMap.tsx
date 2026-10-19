"use client";

import React from "react";
import { Armchair, Users } from "lucide-react";

export interface RestaurantTable {
  id: string;
  name: string;
  status: "empty" | "occupied";
}

interface TableMapProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  onSelectTable: (table: RestaurantTable) => void;
}

export default function TableMap({
  tables,
  selectedTableId,
  onSelectTable,
}: TableMapProps) {
  const emptyCount = tables.filter((t) => t.status === "empty").length;
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const hasSelection = Boolean(selectedTableId);

  return (
    <div className="flex flex-1 min-h-0 flex-col p-5 lg:p-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Sơ đồ bàn</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasSelection
              ? "Nhấn vào bàn khác để chuyển hóa đơn, hoặc nhấn lại vào bàn đang chọn để đóng."
              : "Chọn một bàn bất kỳ trên sơ đồ để mở chi tiết hóa đơn tương ứng."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
            {emptyCount} bàn trống
          </span>
          <span className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200/60">
            {occupiedCount} đang dùng
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div
          className={`grid gap-3.5 transition-all duration-300 ${
            hasSelection
              ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          }`}
        >
          {tables.map((table) => {
            const isSelected = table.id === selectedTableId;
            const isOccupied = table.status === "occupied";

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => onSelectTable(table)}
                className={`group relative flex flex-col items-center justify-center rounded-2xl p-5 min-h-[132px] border text-center transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? "bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/25"
                    : isOccupied
                    ? "bg-orange-50/70 text-orange-950 border-orange-200 hover:border-orange-400 hover:bg-orange-100/50"
                    : "bg-slate-50/70 text-slate-700 border-slate-200/80 hover:border-orange-300 hover:bg-white hover:shadow-xs"
                }`}
              >
                <Armchair
                  size={24}
                  className={`mb-2 transition-transform group-hover:scale-110 ${
                    isSelected
                      ? "text-white"
                      : isOccupied
                      ? "text-orange-700"
                      : "text-slate-600"
                  }`}
                />

                <span className="text-sm font-extrabold tracking-tight">
                  {table.name}
                </span>

                <span
                  className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${
                    isSelected
                      ? "text-orange-50"
                      : isOccupied
                      ? "text-orange-700"
                      : "text-slate-400"
                  }`}
                >
                  {isOccupied && <Users size={12} />}
                  {isOccupied ? "Đang dùng" : "Trống"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}