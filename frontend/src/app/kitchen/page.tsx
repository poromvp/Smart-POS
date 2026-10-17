"use client";

import {
  Flame,
  Salad,
  Soup,
} from "lucide-react";
import { useEffect, useState } from "react";

import KitchenTaskCard, { type KitchenTask } from "@/components/kds/KitchenTaskCard";

const INITIAL_TASKS: KitchenTask[] = [
  {
    id: "task-001",
    orderId: "ORD-001",
    productName: "Mì xào bò",
    quantity: 2,
    modifiers: "Ít hành, thêm bò, không cay",
    startTime: new Date(Date.now() - 2 * 60 * 1000 - 32 * 1000).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },
  {
    id: "task-002",
    orderId: "ORD-002",
    productName: "Gà sốt cay Hàn Quốc",
    quantity: 1,
    modifiers: "Làm cay vừa, thêm kim chi",
    startTime: new Date(Date.now() - 6 * 60 * 1000 - 15 * 1000).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },
  {
    id: "task-003",
    orderId: "ORD-003",
    productName: "Salad cá ngừ",
    quantity: 1,
    modifiers: "Không hành tây, sốt để riêng",
    startTime: new Date(Date.now() - 7 * 60 * 1000 - 12 * 1000).toISOString(),
    targetTime: 10,
    stationId: "cold",
  },
  {
    id: "task-004",
    orderId: "ORD-004",
    productName: "Trà đào cam sả",
    quantity: 3,
    modifiers: "50% đường, ít đá",
    startTime: new Date(Date.now() - 11 * 60 * 1000 - 5 * 1000).toISOString(),
    targetTime: 10,
    stationId: "cold",
  },
  {
    id: "task-005",
    orderId: "ORD-005",
    productName: "Cà phê sữa đá",
    quantity: 2,
    modifiers: "30% đường, nhiều đá",
    startTime: new Date(Date.now() - 3 * 60 * 1000 - 45 * 1000).toISOString(),
    targetTime: 10,
    stationId: "bar",
  },
  {
    id: "task-006",
    orderId: "ORD-006",
    productName: "Matcha Latte",
    quantity: 1,
    modifiers: "50% đường, thêm trân châu",
    startTime: new Date(Date.now() - 5 * 60 * 1000 - 40 * 1000).toISOString(),
    targetTime: 10,
    stationId: "bar",
  },
  {
    id: "task-007",
    orderId: "ORD-007",
    productName: "Bún chả giò",
    quantity: 1,
    modifiers: "Không ngọt, thêm chả giò",
    startTime: new Date(Date.now() - 9 * 60 * 1000 - 10 * 1000).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },
  {
    id: "task-008",
    orderId: "ORD-008",
    productName: "Sinh tố xoài",
    quantity: 2,
    modifiers: "Ít đường, đá đầy",
    startTime: new Date(Date.now() - 4 * 60 * 1000 - 20 * 1000).toISOString(),
    targetTime: 10,
    stationId: "bar",
  },
];

type StationId = "hot" | "cold" | "bar";

const STATION_TABS: { id: StationId; label: string; icon: typeof Flame }[] = [
  { id: "hot", label: "Bếp nóng", icon: Flame },
  { id: "cold", label: "Đồ lạnh", icon: Salad },
  { id: "bar", label: "Quầy bar", icon: Soup },
];

export default function KitchenPage() {
  const [tasks, setTasks] = useState<KitchenTask[]>(INITIAL_TASKS);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [activeStation, setActiveStation] = useState<StationId>("hot");

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const filteredTasks = tasks.filter((t) => t.stationId === activeStation);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] text-stone-900">
      {/* ── Header ── */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-sm lg:px-7">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
              <Flame size={20} />
            </span>
            <h1 className="text-xl font-extrabold text-stone-900">
              Điều phối bếp
            </h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span>
              Tổng đơn đang chờ:{" "}
              <span className="font-bold text-stone-800">{tasks.length} món</span>
            </span>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Đã kết nối
            </span>
          </div>
        </div>
      </header>

      {/* ── Station tabs ── */}
      <nav className="border-b border-[var(--border)] bg-[var(--surface)] px-5 lg:px-7">
        <div className="mx-auto flex max-w-[1800px] gap-1">
          {STATION_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeStation === id;
            const count = tasks.filter((t) => t.stationId === id).length;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveStation(id)}
                className={[
                  "relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition",
                  isActive
                    ? "text-[var(--brand)]"
                    : "text-stone-500 hover:text-stone-700",
                ].join(" ")}
              >
                <Icon size={16} />
                {label}
                {count > 0 && (
                  <span
                    className={[
                      "ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                      isActive
                        ? "bg-[var(--brand)] text-white"
                        : "bg-stone-200 text-stone-600",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                )}
                {/* Active tab indicator */}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--brand)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Cards area ── */}
      <section className="flex-1 overflow-hidden px-5 py-5 lg:px-7">
        <div className="mx-auto max-w-[1800px]">
          {filteredTasks.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 text-center">
              <div>
                <div className="text-3xl">✓</div>
                <p className="mt-2 text-sm font-semibold text-stone-500">
                  Không có món chờ tại trạm này
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {filteredTasks.map((task) => (
                <KitchenTaskCard
                  key={task.id}
                  task={task}
                  currentTime={currentTime}
                  onComplete={handleCompleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer legend ── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3 lg:px-7">
        <div className="mx-auto flex max-w-[1800px] items-center gap-2 text-xs text-stone-500">
          <span className="font-semibold text-stone-600">Trạng thái:</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            Mới nhận
          </span>
          <span className="text-stone-300">·</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            Đang chế biến
          </span>
          <span className="text-stone-300">·</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Chờ lâu
          </span>
          <span className="text-stone-300">·</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Quá thời gian
          </span>
        </div>
      </footer>
    </main>
  );
}
