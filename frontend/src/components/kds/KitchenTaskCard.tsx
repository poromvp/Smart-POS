"use client";

import {
  formatElapsedTime,
  getKdsTaskTiming,
} from "@/lib/utils/timeFormat";

export interface KitchenTask {
  id: string;
  orderId: string;
  productName: string;
  quantity?: number;
  modifiers: string;
  startTime: string;
  targetTime: number;
  stationId: "hot" | "cold" | "bar";
}

interface KitchenTaskCardProps {
  task: KitchenTask;
  currentTime: number;
  onComplete: (taskId: string) => void;
}

const STATUS_STYLES: Record<
  "safe" | "warning" | "danger",
  {
    container: string;
    badge: string;
    timer: string;
  }
> = {
  safe: {
    container: "border-[var(--border)] bg-[var(--surface)]",
    badge: "bg-stone-100 text-stone-600",
    timer: "text-stone-700",
  },
  warning: {
    container: "border-amber-400 bg-[var(--warning-soft)]",
    badge: "bg-amber-100 text-amber-800",
    timer: "text-amber-700",
  },
  danger: {
    container: "border-red-400 bg-[var(--danger-soft)]",
    badge: "bg-red-100 text-red-700",
    timer: "text-red-700",
  },
};

/**
 * Determine the Vietnamese status label based on timing.
 * - safe tasks that started recently (<2 min) → "Mới nhận"
 * - safe tasks actively cooking → "Đang chế biến"
 * - warning → "Chờ lâu"
 * - danger → "Quá thời gian"
 */
function getStatusLabel(
  status: "safe" | "warning" | "danger",
  totalSeconds: number
): string {
  if (status === "danger") return "Quá thời gian";
  if (status === "warning") return "Chờ lâu";
  if (totalSeconds < 120) return "Mới nhận";
  return "Đang chế biến";
}

export default function KitchenTaskCard({
  task,
  currentTime,
  onComplete,
}: KitchenTaskCardProps) {
  const timing = getKdsTaskTiming(
    task.startTime,
    task.targetTime,
    currentTime
  );
  const elapsedTime = formatElapsedTime(timing.totalSeconds);
  const taskStatus = timing.status;
  const statusStyle = STATUS_STYLES[taskStatus];
  const quantity = task.quantity ?? 1;
  const statusLabel = getStatusLabel(taskStatus, timing.totalSeconds);
  const isDanger = taskStatus === "danger";

  return (
    <article
      className={[
        "flex w-[280px] shrink-0 flex-col rounded-xl border-2 p-4 shadow-sm transition",
        statusStyle.container,
      ].join(" ")}
      suppressHydrationWarning
    >
      {/* Top row: Table name + Timer */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold text-stone-900">
          Bàn {task.orderId}
        </span>
        <span
          className={[
            "font-mono text-sm font-bold tabular-nums",
            statusStyle.timer,
          ].join(" ")}
          suppressHydrationWarning
        >
          {elapsedTime}
        </span>
      </div>

      {/* Status badge */}
      <div className="mt-2">
        <span
          className={[
            "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold",
            statusStyle.badge,
          ].join(" ")}
          suppressHydrationWarning
        >
          {statusLabel}
        </span>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-stone-200/60" />

      {/* Checklist items */}
      <div className="flex-1 space-y-2">
        <label className="flex items-start gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-stone-300 accent-(--brand)"
            readOnly
          />
          <span>
            <span className="font-semibold">{quantity}×</span>{" "}
            {task.productName}
          </span>
        </label>
      </div>

      {/* Notes */}
      {task.modifiers && (
        <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs leading-relaxed text-stone-500">
          <span className="font-semibold text-stone-600">Ghi chú:</span>{" "}
          {task.modifiers}
        </p>
      )}

      {/* Action button */}
      <button
        type="button"
        onClick={() => onComplete(task.id)}
        suppressHydrationWarning
        className={[
          "mt-4 min-h-10 w-full rounded-lg px-3 text-sm font-bold transition active:scale-[0.98]",
          isDanger
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-(--brand) text-white hover:bg-[#8f1d15]",
        ].join(" ")}
      >
        {isDanger ? "Ưu tiên trả món khẩn cấp" : "Hoàn thành toàn bộ"}
      </button>
    </article>
  );
}
