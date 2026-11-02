"use client";

import {
  Flame,
  Salad,
  Soup,
  Printer,
  PlusCircle,
  LayoutGrid,
  List,
} from "lucide-react";
import { useEffect, useState } from "react";

import KitchenTaskCard, { type KitchenTask } from "@/components/kds/KitchenTaskCard";
import ExpiryPrintModal from "@/components/kds/ExpiryPrintModal";
import TopHeader from "@/components/layout/TopHeader";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";

const INITIAL_TASKS: KitchenTask[] = [
  {
    id: "task-009",
    orderId: "ORD-009",
    tableName: "Bàn VIP-01",
    orderType: "Tại bàn",
    productName: "Mì cay hải sản Cấp 3",
    quantity: 3,
    modifiers: "1 tô không hành, thêm phô mai viên",
    startTime: new Date(Date.now() - 11 * 60 * 1000 - 15 * 1000).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },
  {
    id: "task-007",
    orderId: "ORD-007",
    tableName: "Bàn 06",
    orderType: "Mang đi",
    productName: "Bún chả giò",
    quantity: 1,
    modifiers: "Không ngọt, thêm chả giò, nước mắm để riêng",
    startTime: new Date(Date.now() - 9 * 60 * 1000 - 32 * 1000).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },
  {
    id: "task-002",
    orderId: "ORD-002",
    tableName: "Bàn 03",
    orderType: "Tại bàn",
    productName: "Gà sốt cay Hàn Quốc",
    quantity: 1,
    modifiers: "Làm cay vừa, thêm kim chi",
    startTime: new Date(Date.now() - 6 * 60 * 1000 - 37 * 1000).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },
  {
    id: "task-001",
    orderId: "ORD-001",
    tableName: "Bàn 01",
    orderType: "Tại bàn",
    productName: "Mì xào bò",
    quantity: 2,
    modifiers: "Ít hành, thêm bò, không cay",
    startTime: new Date(Date.now() - 2 * 60 * 1000 - 54 * 1000).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },
  {
    id: "task-010",
    orderId: "ORD-010",
    tableName: "Bàn 14",
    orderType: "Tại bàn",
    productName: "Phở bò đặc biệt",
    quantity: 2,
    modifiers: "Nước béo, hành trần",
    startTime: new Date(Date.now() - 35 * 1000).toISOString(),
    targetTime: 10,
    stationId: "hot",
  },
  {
    id: "task-004",
    orderId: "ORD-004",
    tableName: "Bàn 09",
    orderType: "Mang đi",
    productName: "Gỏi cuốn tôm thịt",
    quantity: 4,
    modifiers: "Tương đen thêm đậu phộng, kèm ớt xay",
    startTime: new Date(Date.now() - 10 * 60 * 1000 - 40 * 1000).toISOString(),
    targetTime: 10,
    stationId: "cold",
  },
  {
    id: "task-003",
    orderId: "ORD-003",
    tableName: "Bàn 02",
    orderType: "Tại bàn",
    productName: "Salad cá ngừ",
    quantity: 1,
    modifiers: "Không hành tây, sốt mè rang để riêng",
    startTime: new Date(Date.now() - 7 * 60 * 1000 - 12 * 1000).toISOString(),
    targetTime: 10,
    stationId: "cold",
  },
  {
    id: "task-011",
    orderId: "ORD-011",
    tableName: "Bàn 05",
    orderType: "Tại bàn",
    productName: "Kim chi cải thảo đĩa lớn",
    quantity: 2,
    modifiers: "Cắt nhỏ vừa ăn",
    startTime: new Date(Date.now() - 1 * 60 * 1000 - 20 * 1000).toISOString(),
    targetTime: 10,
    stationId: "cold",
  },
  {
    id: "task-006",
    orderId: "ORD-006",
    tableName: "Bàn 08",
    orderType: "Mang đi",
    productName: "Matcha Latte Kem Cheese",
    quantity: 2,
    modifiers: "70% đường, thêm trân châu đường đen",
    startTime: new Date(Date.now() - 6 * 60 * 1000 - 40 * 1000).toISOString(),
    targetTime: 10,
    stationId: "bar",
  },
  {
    id: "task-008",
    orderId: "ORD-008",
    tableName: "Bàn 12",
    orderType: "Tại bàn",
    productName: "Sinh tố xoài nhiệt đới",
    quantity: 2,
    modifiers: "Ít đường, đá xay nhuyễn",
    startTime: new Date(Date.now() - 4 * 60 * 1000 - 20 * 1000).toISOString(),
    targetTime: 10,
    stationId: "bar",
  },
  {
    id: "task-005",
    orderId: "ORD-005",
    tableName: "Bàn 01",
    orderType: "Tại bàn",
    productName: "Trà đào cam sả",
    quantity: 3,
    modifiers: "50% đường, ít đá",
    startTime: new Date(Date.now() - 3 * 60 * 1000 - 45 * 1000).toISOString(),
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [presetPrintItem, setPresetPrintItem] = useState<string | undefined>(
    undefined
  );

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
        `${completedItem.tableName ?? completedItem.orderId} (${completedItem.quantity} phần) đã sẵn sàng phục vụ.`
      );
    }
  };

  const handleSimulateNewOrder = () => {
    const sampleDishes: Record<
      StationId,
      { name: string; modifiers: string; table: string }
    > = {
      hot: {
        name: "Mì cay bò Mỹ Cấp 2",
        modifiers: "Thêm bò viên, không hành lá",
        table: `Bàn ${Math.floor(1 + Math.random() * 20)}`,
      },
      cold: {
        name: "Salad ức gà áp chảo",
        modifiers: "Sốt chanh dây để riêng",
        table: `Bàn ${Math.floor(1 + Math.random() * 20)}`,
      },
      bar: {
        name: "Trà vải hoa hồng",
        modifiers: "Ít đá, 50% đường",
        table: `Bàn ${Math.floor(1 + Math.random() * 20)}`,
      },
    };

    const dish = sampleDishes[activeStation];
    const orderNum = Math.floor(100 + Math.random() * 900);

    const newTask: KitchenTask = {
      id: `task-${Date.now()}`,
      orderId: `ORD-${orderNum}`,
      tableName: dish.table,
      orderType: Math.random() > 0.3 ? "Tại bàn" : "Mang đi",
      productName: dish.name,
      quantity: Math.floor(1 + Math.random() * 3),
      modifiers: dish.modifiers,
      startTime: new Date().toISOString(),
      targetTime: 10,
      stationId: activeStation,
    };

    setTasks((prev) => [...prev, newTask]);
    toast.info(
      `Đơn mới tại ${dish.table}`,
      `${newTask.quantity}× ${newTask.productName} vừa chuyển xuống trạm.`
    );
  };

  const handleOpenExpiryModal = (itemName?: string) => {
    setPresetPrintItem(itemName);
    setIsExpiryModalOpen(true);
  };

  const handlePrintExpirySuccess = (
    itemName: string,
    copies: number,
    expiryStr: string
  ) => {
    toast.success(
      `Đã gửi lệnh in ${copies} tem HSD`,
      `${itemName} • Hạn hủy: ${expiryStr}`
    );
  };

  const filteredTasks = tasks.filter((t) => t.stationId === activeStation);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-50 text-stone-900">
      <TopHeader
        title="Điều phối bếp (KDS)"
        userName="Bếp trưởng"
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WorkspaceSidebar defaultCollapsed={true} />

        <main className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
          <nav className="border-b border-gray-200 bg-white px-5 lg:px-7 shrink-0">
            <div className="mx-auto flex flex-wrap max-w-[1800px] items-center justify-between gap-3">
              <div className="flex gap-1">
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

              <div className="flex items-center gap-2.5 py-2">
                <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="Hiển thị lưới dọc"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-white text-orange-600 shadow-2xs"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lưới dọc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="Hiển thị danh sách dọc"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "list"
                        ? "bg-white text-orange-600 shadow-2xs"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hàng dọc</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateNewOrder}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-orange-50 hover:border-orange-300 px-3.5 py-2 text-xs font-bold text-stone-700 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-orange-500" />
                  <span>Giả lập đơn mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenExpiryModal(undefined)}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs shadow-orange-500/20 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4" />
                  <span>In hạn sử dụng</span>
                </button>
              </div>
            </div>
          </nav>

          <section className="flex-1 overflow-y-auto px-5 py-5 lg:px-7">
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
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                  {filteredTasks.map((task) => (
                    <KitchenTaskCard
                      key={task.id}
                      task={task}
                      currentTime={currentTime}
                      layout="grid"
                      onComplete={handleCompleteTask}
                      onQuickPrintLabel={(productName) =>
                        handleOpenExpiryModal(productName)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-6">
                  {filteredTasks.map((task) => (
                    <KitchenTaskCard
                      key={task.id}
                      task={task}
                      currentTime={currentTime}
                      layout="list"
                      onComplete={handleCompleteTask}
                      onQuickPrintLabel={(productName) =>
                        handleOpenExpiryModal(productName)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <footer className="border-t border-gray-200 bg-white px-5 py-3 lg:px-7 shrink-0">
            <div className="mx-auto flex flex-wrap max-w-[1800px] items-center justify-between gap-3 text-xs text-stone-500">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-stone-700">Trạng thái:</span>
                <StatusBadge label="Mới nhận (< 1p)" variant="success" />
                <StatusBadge label="Đang chế biến (1-6p)" variant="serving" />
                <StatusBadge label="Chờ lâu (6-10p)" variant="pending" />
                <StatusBadge label="Quá thời gian (> 10p)" variant="danger" />
              </div>

              <span className="text-[11px] font-medium text-stone-400">
                Máy in nhãn nhiệt: Sẵn sàng (Khổ 60×40mm)
              </span>
            </div>
          </footer>
        </main>
      </div>

      <ExpiryPrintModal
        isOpen={isExpiryModalOpen}
        initialItemName={presetPrintItem}
        onClose={() => setIsExpiryModalOpen(false)}
        onPrintSuccess={handlePrintExpirySuccess}
      />
    </div>
  );
}