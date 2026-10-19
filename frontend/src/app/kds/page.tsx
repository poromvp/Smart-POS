"use client";

import { Flame, Salad, Soup } from "lucide-react";
import { useEffect, useState } from "react";

import KitchenTaskCard, { type KitchenTask } from "@/components/kds/KitchenTaskCard";
import TopHeader from "@/components/layout/TopHeader";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";

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

export default function KdsPage() {
  const [tasks, setTasks] = useState<KitchenTask[]>(INITIAL_TASKS);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [activeStation, setActiveStation] = useState<StationId>("hot");
  const toast = useToast();

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCompleteTask = (taskId: string) => {
    const completedItem = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    if (completedItem) {
      toast.success(
        `Đã hoàn tất: ${completedItem.productName}`,
        `Đơn ${completedItem.orderId} (${completedItem.quantity} phần) đã sẵn sàng phục vụ.`
      );
    }
  };

  const filteredTasks = tasks.filter((t) => t.stationId === activeStation);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-stone-900">
      <TopHeader
        title="Điều phối bếp (KDS)"
        userLabel="Bếp trưởng"
        rightContent={
          <div className="flex items-center gap-3 text-sm">
            <span className="text-stone-500">
              Đang chờ:{" "}
              <strong className="text-orange-600 font-bold">
                {tasks.length} món
              </strong>
            </span>
            <StatusBadge label="Đã kết nối" variant="success" />
          </div>
        }
      />

      <div className="flex flex-1 min-h-0">
        <WorkspaceSidebar defaultCollapsed={true} />

        <main className="flex flex-1 flex-col min-w-0">
          <nav className="border-b border-gray-200 bg-white px-5 lg:px-7">
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
                      "relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition cursor-pointer",
                      isActive
                        ? "text-orange-600"
                        : "text-stone-500 hover:text-stone-800",
                    ].join(" ")}
                  >
                    <Icon size={16} />
                    {label}
                    {count > 0 && (
                      <span
                        className={[
                          "ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                          isActive
                            ? "bg-orange-600 text-white"
                            : "bg-stone-200 text-stone-600",
                        ].join(" ")}
                      >
                        {count}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-orange-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          <section className="flex-1 overflow-hidden px-5 py-5 lg:px-7">
            <div className="mx-auto max-w-[1800px]">
              {filteredTasks.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 text-center">
                  <div>
                    <div className="text-3xl text-orange-500 font-bold">✓</div>
                    <p className="mt-2 text-sm font-semibold text-stone-600">
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

          <footer className="border-t border-gray-200 bg-white px-5 py-3 lg:px-7">
            <div className="mx-auto flex flex-wrap max-w-[1800px] items-center gap-3 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">Trạng thái:</span>
              <StatusBadge label="Mới nhận" variant="neutral" />
              <StatusBadge label="Đang chế biến" variant="serving" />
              <StatusBadge label="Chờ lâu" variant="pending" />
              <StatusBadge label="Quá thời gian" variant="danger" />
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}