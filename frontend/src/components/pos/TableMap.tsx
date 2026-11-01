"use client";

import { useState } from "react";
import { Armchair, Search } from "lucide-react";

export interface RestaurantTable {
  id: string;
  name: string;
  status: "empty" | "occupied";
}

interface TableMapProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  totals?: Record<string, number>;
  onSelectTable: (table: RestaurantTable) => void;
}

export default function TableMap({ tables, selectedTableId, totals = {}, onSelectTable }: TableMapProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const occupied = tables.filter((table) => table.status === "occupied").length;
  const visible = tables.filter((table) => (filter === "all" || table.status === filter) && table.name.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-500 focus-within:ring-2 focus-within:ring-orange-300">
        <Search size={18} aria-hidden="true" />
        <input aria-label="Tìm bàn" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên hoặc số bàn…" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>
      <div className="my-3 flex flex-wrap gap-2">
        {[["all", `Tất cả (${tables.length})`], ["occupied", `Đang dùng (${occupied})`], ["empty", `Trống (${tables.length - occupied})`]].map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-lg px-3 text-xs font-semibold ${filter === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>
        ))}
      </div>
      <p className="mb-3 text-xs text-slate-500">Chọn bàn để xem và kiểm tra hóa đơn.</p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((table) => {
            const selected = selectedTableId === table.id;
            return (
              <button key={table.id} type="button" aria-pressed={selected} onClick={() => onSelectTable(table)} className={`flex min-h-24 flex-col items-start justify-center rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${selected ? "border-orange-600 bg-orange-500 text-white shadow-sm" : table.status === "occupied" ? "border-orange-200 bg-orange-50 text-orange-950 hover:bg-orange-100" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                <span className="flex w-full items-center justify-between gap-2 font-bold"><span>{table.name}</span><Armchair size={18} aria-hidden="true" /></span>
                <span className={`mt-1 text-xs ${selected ? "text-orange-50" : "text-slate-500"}`}>{table.status === "occupied" ? "Đang dùng" : "Trống"}</span>
                {table.status === "occupied" && <span className="mt-1 text-sm font-semibold tabular-nums">{(totals[table.id] ?? 0).toLocaleString("vi-VN")}đ</span>}
              </button>
            );
          })}
        </div>
        {visible.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Không tìm thấy bàn phù hợp.</p>}
      </div>
    </div>
  );
}
