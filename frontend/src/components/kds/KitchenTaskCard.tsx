"use client";

import {
  formatElapsedTime,
} from "@/lib/utils/timeFormat";

export interface KitchenTask {
  id: string;
  orderId: string;
  productName: string;
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

function getTaskStatus(
  elapsedSeconds: number
): TaskStatus {
  const elapsedMinutes = elapsedSeconds / 60;

  if (elapsedMinutes < 5) {
    return "safe";
  }

  if (elapsedMinutes <= 10) {
    return "warning";
  }

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
    container:
      "border-emerald-200 bg-emerald-50",
    badge:
      "bg-emerald-100 text-emerald-700",
    timer:
      "text-emerald-700",
    label:
      "Trong thời gian",
  },

  warning: {
    container:
      "border-amber-300 bg-amber-50",
    badge:
      "bg-amber-100 text-amber-700",
    timer:
      "text-amber-700",
    label:
      "Sắp trễ",
  },

  danger: {
    container:
      "border-red-400 bg-red-50 animate-pulse",
    badge:
      "bg-red-100 text-red-700",
    timer:
      "text-red-700",
    label:
      "QUÁ THỜI GIAN",
  },
};

export default function KitchenTaskCard({
  task,
  currentTime,
  onComplete,
}: KitchenTaskCardProps) {
  const startTimestamp =
    new Date(task.startTime).getTime();

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (currentTime - startTimestamp) / 1000
    )
  );

  const elapsedTime = formatElapsedTime(
    elapsedSeconds
  );

  const taskStatus = getTaskStatus(
    elapsedSeconds
  );

  const statusStyle =
    STATUS_STYLES[taskStatus];

  const targetSeconds = task.targetTime * 60;
  const remainingSeconds =
    targetSeconds - elapsedSeconds;

  const isOverTarget =
    remainingSeconds < 0;

  return (
    <article
      className={[
        "flex flex-col rounded-2xl border-2 p-4 shadow-sm transition",
        statusStyle.container,
      ].join(" ")}
    >
      {/* Top */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-white/80 px-2.5 py-1 text-sm font-bold text-slate-800 shadow-sm">
          #{task.orderId}
        </span>

 