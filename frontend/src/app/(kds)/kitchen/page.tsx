"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import KitchenTaskCard, {
  type KitchenTask,
} from "@/components/kds/KitchenTaskCard";

const INITIAL_TASKS: KitchenTask[] = [
  {
    id: "task-001",
    orderId: "ORD-001",
    productName: "Mì xào bò",
    modifiers:
      "Ít hành, thêm bò, không cay",
    startTime: new Date(
      Date.now() - 2 * 60 * 1000 - 32 * 1000
    ).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },

  {
    id: "task-002",
    orderId: "ORD-002",
    productName: "Gà sốt cay Hàn Quốc",
    modifiers:
      "Làm cay vừa, thêm kim chi",
    startTime: new Date(
      Date.now() - 6 * 60 * 1000 - 15 * 1000
    ).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },

  {
    id: "task-003",
    orderId: "ORD-003",
    productName: "Salad cá ngừ",
    modifiers:
      "Không hành tây, sốt để riêng",
    startTime: new Date(
      Date.now() - 7 * 60 * 1000 - 12 * 1000
    ).toISOString(),
    targetTime: 10,
    stationId: "cold",
  },

  {
    id: "task-004",
    orderId: "ORD-004",
    productName: "Trà đào cam sả",
    modifiers:
      "50% đường, ít đá",
    startTime: new Date(
      Date.now() - 11 * 60 * 1000 - 5 * 1000
    ).toISOString(),
    targetTime: 10,
    stationId: "cold",
  },

  {
    id: "task-005",
    orderId: "ORD-005",
    productName: "Cà phê sữa đá",
    modifiers:
      "30% đường, nhiều đá",
    startTime: new Date(
      Date.now() - 3 * 60 * 1000 - 45 * 1000
    ).toISOString(),
    targetTime: 10,
    stationId: "bar",
  },

  {
    id: "task-006",
    orderId: "ORD-006",
    productName: "Matcha Latte",
    modifiers:
      "50% đường, thêm trân châu",
    startTime: new Date(
      Date.now() - 5 * 60 * 1000 - 40 * 1000
    ).toISOString(),
    targetTime: 10,
    stationId: "bar",
  },
];

const STATIONS = [
  {
    id: "hot" as const,
    title: "Bếp nóng",
    icon: "🔥",
    description: "Món chiên, xào, nướng",
  },

  {
    id: "cold" as const,
    title: "Bếp lạnh",
    icon: "❄️",
    description: "Salad, món nguội",
  },

  {
    id: "bar" as const,
    title: "Pha chế",
    icon: "☕",
    description: "Cà phê, trà, nước",
  },
];

export default function KitchenPage() {
  const [tasks, setTasks] =
    useState<KitchenTask[]>(
      INITIAL_TASKS
    );

  const [currentTime, setCurrentTime] =
    useState<number>(Date.now());

  /**
   * Cập nhật đồng hồ mỗi giây.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * Xóa task khi hoàn thành.
   */
  const handleCompleteTask = (
    taskId: string
  ) => {
    setTasks((prev) =>
      prev.filter(
        (task) => task.id !== taskId
      )
    );
  };

  const taskCountByStation = useMemo(() => {
    return {
      hot: tasks.filter(
        (task) =>
          task.stationId === "hot"
      ).length,

      cold: tasks.filter(
        (task) =>
          task.stationId === "cold"
      ).length,

      bar: tasks.filter(
        (task) =>
          task.stationId === "bar"
      ).length,
    };
  }, [tasks]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xl">
              🍳
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                SmartPOS
              </p>

