"use client";

import {
  AlarmClockCheck,
  ChevronRight,
  Clock3,
  Flame,
  LogOut,
  Package,
  Salad,
  Settings,
  ShieldAlert,
  Soup,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const STATION_META = {
  hot: {
    title: "Bếp nóng",
    icon: Flame,
    accent: "bg-rose-100 text-rose-600",
    border: "border-rose-200",
    soft: "bg-rose-50",
  },
  cold: {
    title: "Bếp lạnh",
    icon: Salad,
    accent: "bg-cyan-100 text-cyan-600",
    border: "border-cyan-200",
    soft: "bg-cyan-50",
  },
  bar: {
    title: "Pha chế",
    icon: Soup,
    accent: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
    soft: "bg-amber-50",
  },
} as const;

const NAV_ITEMS = [
  { id: "kitchen", label: "Điều phối bếp", icon: Flame, active: true },
  { id: "history", label: "Lịch sử món", icon: Clock3 },
  { id: "stock", label: "Tồn kho nguyên liệu", icon: Package },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

export default function KitchenPage() {
  const [tasks, setTasks] = useState<KitchenTask[]>(INITIAL_TASKS);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const taskCountByStation = useMemo(
    () => ({
      hot: tasks.filter((task) => task.stationId === "hot").length,
      cold: tasks.filter((task) => task.stationId === "cold").length,
      bar: tasks.filter((task) => task.stationId === "bar").length,
    }),
    [tasks]
  );

  const overviewStats = [
    {
      label: "Tổng hóa đơn đang chờ",
      value: "18",
      delta: "+3 so với giờ trước",
      icon: AlarmClockCheck,
      tone: "text-orange-600 bg-orange-50",
    },
    {
      label: "Tổng số món ăn",
      value: "126",
      delta: "+12 món mới",
      icon: Package,
      tone: "text-violet-600 bg-violet-50",
    },
    {
      label: "Số món báo động đỏ",
      value: "05",
      delta: "Cần ưu tiên xử lý",
      icon: ShieldAlert,
      tone: "text-rose-600 bg-rose-50",
    },
    {
      label: "Thời gian chờ trung bình",
      value: "08:42",
      delta: "Dưới ngưỡng 10 phút",
      icon: Clock3,
      tone: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <main className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white/90 px-5 py-6 shadow-sm backdrop-blur-sm">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-lg font-bold text-white shadow-sm">
              <UserRound size={24} />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Bếp trưởng
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Nguyễn Hoàng Lập
              </h2>
            </div>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon, active }) => (
            <button
              key={id}
              type="button"
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition",
                active
                  ? "border-orange-200 bg-orange-50 text-orange-700 shadow-sm"
                  : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="flex items-center gap-3">
                <span
                  className={
                    active
                      ? "rounded-lg bg-orange-100 p-2 text-orange-600"
                      : "rounded-lg bg-slate-100 p-2 text-slate-500"
                  }
                >
                  <Icon size={18} />
                </span>
                <span className="text-sm font-semibold">{label}</span>
              </span>
              <ChevronRight size={16} className={active ? "text-orange-500" : "text-slate-400"} />
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <section className="flex-1 overflow-hidden p-5 lg:p-6">
        <div className="flex h-full flex-col">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overviewStats.map(({ label, value, delta, icon: Icon, tone }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
                  </div>
                  <span className={['flex h-11 w-11 items-center justify-center rounded-xl', tone].join(' ')}>
                    <Icon size={20} />
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">{delta}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-3">
            {(Object.entries(STATION_META) as [keyof typeof STATION_META, (typeof STATION_META)[keyof typeof STATION_META]][]).map(
              ([stationId, meta]) => {
                const stationTasks = tasks.filter((task) => task.stationId === stationId);
                const Icon = meta.icon;

                return (
                  <section
                    key={stationId}
                    className={['flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm', meta.border].join(' ')}
                  >
                    <header className={['flex items-center justify-between border-b border-slate-200 px-4 py-3', meta.soft].join(' ')}>
                      <div className="flex items-center gap-3">
                        <span className={['flex h-9 w-9 items-center justify-center rounded-xl', meta.accent].join(' ')}>
                          <Icon size={18} />
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{meta.title}</h3>
                          <p className="text-[11px] text-slate-500">{stationTasks.length} đơn đang chờ</p>
                        </div>
                      </div>
                      <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-bold text-white">
                        {stationTasks.length}
                      </span>
                    </header>

                    <div className="flex-1 overflow-y-auto p-3">
                      {stationTasks.length === 0 ? (
                        <div className="flex h-full min-h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                          <div>
                            <div className="text-2xl">✓</div>
                            <p className="mt-2 text-sm font-semibold text-slate-500">Không có món chờ</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {stationTasks.map((task) => (
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
                );
              }
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
