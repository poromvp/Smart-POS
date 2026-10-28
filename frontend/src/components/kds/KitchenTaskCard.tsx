"use client";

import React, { useState } from "react";
import { Check, Printer, Utensils, ShoppingBag } from "lucide-react";

export interface KitchenTask {
  id: string;
  orderId: string;
  tableName?: string;
  orderType?: "Tại bàn" | "Mang đi";
  productName: string;
  quantity: number;
  modifiers?: string;
  startTime: string;
  targetTime: number;
  stationId: "hot" | "cold" | "bar";
}

interface KitchenTaskCardProps {
  task: KitchenTask;
  currentTime: number;
  layout?: "grid" | "list";
  onComplete: (taskId: string) => void;
  onQuickPrintLabel?: (productName: string) => void;
}

export default function KitchenTaskCard({
  task,
  currentTime,
  layout = "grid",
  onComplete,
  onQuickPrintLabel,
}: KitchenTaskCardProps) {
  const [checked, setChecked] = useState(false);

  const elapsedMs = Math.max(0, currentTime - new Date(task.startTime).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const getStatusConfig = () => {
    if (minutes >= task.targetTime) {
      return {
        label: "Quá thời gian",
        cardBorder: "border-red-500 bg-red-50/70 shadow-red-500/10",
        badgeBg: "bg-red-100 text-red-700 border border-red-200",
        timerText: "text-red-600",
        btnBg: "bg-red-600 hover:bg-red-700",
      };
    }
    if (minutes >= 6) {
      return {
        label: "Chờ lâu",
        cardBorder: "border-amber-400 bg-amber-50/70 shadow-amber-500/10",
        badgeBg: "bg-amber-100 text-amber-800 border border-amber-200",
        timerText: "text-amber-700",
        btnBg: "bg-red-800 hover:bg-red-900",
      };
    }
    if (minutes >= 1) {
      return {
        label: "Đang chế biến",
        cardBorder: "border-orange-200 bg-white shadow-orange-500/5",
        badgeBg: "bg-stone-100 text-stone-700",
        timerText: "text-stone-700",
        btnBg: "bg-red-800 hover:bg-red-900",
      };
    }
    return {
      label: "Mới nhận",
      cardBorder: "border-stone-200 bg-white",
      badgeBg: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      timerText: "text-emerald-600",
      btnBg: "bg-orange-600 hover:bg-orange-700",
    };
  };

  const status = getStatusConfig();

  if (layout === "list") {
    return (
      <div
        className={`w-full rounded-2xl border-2 px-5 py-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${status.cardBorder}`}
      >
        <div className="flex flex-wrap items-center gap-4 min-w-[240px]">
          <div className="min-w-[110px]">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-stone-900">
                {task.tableName ?? `Bàn ${task.orderId}`}
              </h3>
              {task.orderType && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.orderType === "Mang đi"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {task.orderType === "Mang đi" ? (
                    <ShoppingBag className="w-3 h-3" />
                  ) : (
                    <Utensils className="w-3 h-3" />
                  )}
                  {task.orderType}
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-stone-400">
              Mã đơn: #{task.orderId}
            </span>
          </div>

          <span
            className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${status.badgeBg}`}
          >
            {status.label}
          </span>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <label className="flex items-center gap-3 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
            />
            <span
              className={`text-base font-extrabold ${
                checked ? "line-through text-stone-400" : "text-stone-900"
              }`}
            >
              {task.quantity}× {task.productName}
            </span>
          </label>

          {task.modifiers && (
            <div className="rounded-xl bg-stone-100/90 px-3 py-1.5 text-xs text-stone-600 truncate">
              <span className="font-bold text-stone-700">Ghi chú: </span>
              {task.modifiers}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-200/60">
          <span
            className={`font-mono text-base font-extrabold px-2 ${status.timerText}`}
          >
            {formattedTime}
          </span>

          {onQuickPrintLabel && (
            <button
              type="button"
              onClick={() => onQuickPrintLabel(task.productName)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-300 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In nhãn</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onComplete(task.id)}
            className={`py-2.5 px-5 rounded-full text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${status.btnBg}`}
          >
            <Check className="w-4 h-4" />
            <span>Hoàn thành</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full rounded-3xl border-2 p-5 shadow-sm flex flex-col justify-between transition-all ${status.cardBorder}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-stone-900">
                {task.tableName ?? `Bàn ${task.orderId}`}
              </h3>
              {task.orderType && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.orderType === "Mang đi"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {task.orderType === "Mang đi" ? (
                    <ShoppingBag className="w-3 h-3" />
                  ) : (
                    <Utensils className="w-3 h-3" />
                  )}
                  {task.orderType}
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-stone-400">
              Mã đơn: #{task.orderId}
            </span>
          </div>

          <span className={`font-mono text-sm font-extrabold ${status.timerText}`}>
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-200/70">
          <span
            className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${status.badgeBg}`}
          >
            {status.label}
          </span>

          {onQuickPrintLabel && (
            <button
              type="button"
              onClick={() => onQuickPrintLabel(task.productName)}
              title="In tem hạn sử dụng / nhãn món này"
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-orange-600 bg-white/80 hover:bg-orange-50 border border-stone-200/80 hover:border-orange-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In nhãn</span>
            </button>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none mb-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
          />
          <span
            className={`text-base font-bold leading-snug ${
              checked ? "line-through text-stone-400" : "text-stone-900"
            }`}
          >
            {task.quantity}× {task.productName}
          </span>
        </label>

        {task.modifiers && (
          <div className="rounded-2xl bg-stone-100/90 px-3.5 py-2.5 text-xs text-stone-600 mb-5">
            <span className="font-bold text-stone-700">Ghi chú: </span>
            {task.modifiers}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onComplete(task.id)}
        className={`w-full py-3 px-4 rounded-full text-white font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${status.btnBg}`}
      >
        <Check className="w-4 h-4" />
        <span>Hoàn thành toàn bộ</span>
      </button>
    </div>
  );
}