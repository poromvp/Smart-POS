"use client";

import { formatElapsedTime } from "@/lib/utils/timeFormat";

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

type TaskStatus = "safe" | "warning" | "danger";

function getTaskStatus(elapsedSeconds: number): TaskStatus {
  const elapsedMinutes = elapsedSeconds / 60;

  if (elapsedMinutes < 5) return "safe";
  if (elapsedMinutes <= 10) return "warning";
  return "danger";
}

const STATUS_STYLES: Record<
  TaskStatus,
  {
    container: string;
    badge: string;
    timer: string;
    label: string;
  }
> = {
  safe: {
    container: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    timer: "text-emerald-700",
    label: "Bình thường",
  },
  warning: {
    container: "border-amber-300 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    timer: "text-amber-700",
    label: "Sắp trễ",
  },
  danger: {
    container: "border-red-300 bg-red-50 animate-pulse",
    badge: "bg-red-100 text-red-700",
    timer: "text-red-700",
    label: "Quá giờ",
  },
};

export default function KitchenTaskCard({
  task,
  currentTime,
  onComplete,
}: KitchenTaskCardProps) {
  const startTimestamp = new Date(task.startTime).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - startTimestamp) / 1000));
  const elapsedTime = formatElapsedTime(elapsedSeconds);
  const taskStatus = getTaskStatus(elapsedSeconds);
  const statusStyle = STATUS_STYLES[taskStatus];
  const targetSeconds = task.targetTime * 60;
  const remainingSeconds = targetSeconds - elapsedSeconds;
  const isOverTarget = remainingSeconds < 0;
  const quantity = task.quantity ?? 1;

  return (
    <article className={['flex flex-col rounded-2xl border-2 p-3 shadow-sm transition', statusStyle.container].join(' ')}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-slate-800 shadow-sm">
          #{task.orderId}
        </span>
        <span className={['rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide', statusStyle.badge].join(' ')}>
          {statusStyle.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold leading-tight text-slate-900">{task.productName}</h3>
        <span className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-white">
          x{quantity}
        </span>
      </div>

      <p className="mt-2 text-sm leading-5 text-slate-600">{task.modifiers || "Không có ghi chú"}</p>

      <div className="mt-3 rounded-xl bg-white/80 p-2.5">
        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-slate-400">
          <span>Thời gian</span>
          <span className={['font-mono text-sm font-black tabular-nums', statusStyle.timer].join(' ')}>{elapsedTime}</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Mục tiêu: {task.targetTime} phút</span>
          <span className={isOverTarget ? 'font-bold text-red-600' : 'font-medium'}>
            {isOverTarget ? `Trễ ${formatElapsedTime(Math.abs(remainingSeconds))}` : `Còn ${formatElapsedTime(remainingSeconds)}`}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onComplete(task.id)}
        className="mt-3 min-h-10 w-full rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]"
      >
        Hoàn thành
      </button>
    </article>
  );
}