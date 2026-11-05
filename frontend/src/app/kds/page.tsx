"use client";

import {
  Flame,
  Salad,
  Soup,
  Printer,
  PlusCircle,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import KitchenTaskCard, { type KitchenTask } from "@/components/kds/KitchenTaskCard";
import ExpiryPrintModal from "@/components/kds/ExpiryPrintModal";
import TopHeader from "@/components/layout/TopHeader";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchOrders, createOrder, updateOrderStatus } from "@/lib/api";
import type { OrderResponse } from "@/lib/types/sales";

type StationId = "hot" | "cold" | "bar";

const STATION_TABS: { id: StationId; label: string; icon: typeof Flame }[] = [
  { id: "hot", label: "Bếp nóng", icon: Flame },
  { id: "cold", label: "Đồ lạnh", icon: Salad },
  { id: "bar", label: "Quầy bar", icon: Soup },
];

function determineStation(productName: string): StationId {
  const name = productName.toLowerCase();
  if (
    name.includes("trà") ||
    name.includes("cà phê") ||
    name.includes("matcha") ||
    name.includes("pepsi") ||
    name.includes("sinh tố") ||
    name.includes("nước")
  ) {
    return "bar";
  }
  if (
    name.includes("gỏi") ||
    name.includes("salad") ||
    name.includes("kim chi") ||
    name.includes("kem")
  ) {
    return "cold";
  }
  return "hot";
}

export default function KdsPage() {
  const [tasks, setTasks] = useState<KitchenTask[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [activeStation, setActiveStation] = useState<StationId>("hot");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [presetPrintItem, setPresetPrintItem] = useState<string | undefined>(
    undefined
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Tải danh sách đơn hàng thực tế từ Sales Service
  const loadKitchenTasks = useCallback(async () => {
    try {
      const orders = await fetchOrders();
      if (!orders) return;

      // Lấy các đơn đang chờ hoặc đang chế biến
      const activeOrders = orders.filter(
        (o) =>
          o.status === "PENDING" ||
          o.status === "CONFIRMED" ||
          o.status === "PREPARING"
      );

      const kitchenTasks: KitchenTask[] = [];

      for (const order of activeOrders) {
        for (const item of order.items || []) {
          const taskId = `task-${order.id}-${item.id}`;
          // Bỏ qua nếu đã đánh dấu hoàn thành trong phiên này
          if (completedTaskIds.has(taskId)) continue;

          const modifiers = [item.toppings, item.sweetness, item.note]
            .filter(Boolean)
            .join(" • ");

          kitchenTasks.push({
            id: taskId,
            orderId: order.orderCode,
            tableName: order.tableNumber ? `Bàn ${order.tableNumber}` : "Mang đi",
            orderType: order.orderType === "TAKE_AWAY" ? "Mang đi" : "Tại bàn",
            productName: item.name,
            quantity: item.quantity,
            modifiers: modifiers || undefined,
            startTime: order.createdAt || new Date().toISOString(),
            targetTime: 10,
            stationId: determineStation(item.name),
          });
        }
      }

      setTasks(kitchenTasks);
    } catch (err) {
      console.warn("Chưa thể đồng bộ đơn hàng với KDS:", err);
    }
  }, [completedTaskIds]);

  useEffect(() => {
    loadKitchenTasks();
    const interval = setInterval(loadKitchenTasks, 5000);
    return () => clearInterval(interval);
  }, [loadKitchenTasks]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadKitchenTasks();
    setIsRefreshing(false);
    toast.info("Đã đồng bộ KDS", "Danh sách món cần nấu đã được cập nhật mới nhất");
  };

  const handleCompleteTask = async (taskId: string) => {
    const completedItem = tasks.find((t) => t.id === taskId);
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    if (completedItem) {
      toast.success(
        `Đã hoàn tất: ${completedItem.productName}`,
        `${completedItem.tableName ?? completedItem.orderId} (${completedItem.quantity} phần) đã sẵn sàng phục vụ.`
      );
    }

    try {
      const parts = taskId.split("-");
      const orderIdNum = parts.length >= 2 ? parseInt(parts[1], 10) : NaN;
      if (!isNaN(orderIdNum)) {
        await updateOrderStatus(orderIdNum, "READY");
      }
    } catch (err) {
      console.warn("Không thể cập nhật trạng thái đơn hàng lên server:", err);
    }
  };

  // Tạo đơn hàng thử nghiệm thực tế vào DB sales-service
  const handleSimulateNewOrder = async () => {
    const sampleDishes: Record<
      StationId,
      { productId: number; name: string; price: number; note: string }
    > = {
      hot: {
        productId: 1,
        name: "Mì Cay Bò Mỹ",
        price: 75000,
        note: "Cay cấp 3, không hành lá",
      },
      cold: {
        productId: 3,
        name: "Gà Sốt Cay Hàn Quốc",
        price: 89000,
        note: "Thêm kim chi",
      },
      bar: {
        productId: 4,
        name: "Trà Đào Cam Sả",
        price: 45000,
        note: "50% đường, ít đá",
      },
    };

    const dish = sampleDishes[activeStation];
    const tableNumber = String(Math.floor(1 + Math.random() * 20));

    try {
      const response = await createOrder({
        tableNumber,
        orderType: "DINE_IN",
        items: [
          {
            productId: dish.productId,
            name: dish.name,
            quantity: 1,
            basePrice: dish.price,
            note: dish.note,
          },
        ],
      });

      toast.info(
        `Đã tạo đơn mới #${response.orderCode}`,
        `Bàn ${tableNumber} • 1× ${dish.name} vừa được lưu vào cơ sở dữ liệu.`
      );

      await loadKitchenTasks();
    } catch (err) {
      toast.error(
        "Lỗi tạo đơn",
        err instanceof Error ? err.message : "Không thể gửi đơn xuống Sales Service"
      );
    }
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
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
              title="Đồng bộ lại danh sách món"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin text-orange-500" : ""}
              />
              <span>Đồng bộ</span>
            </button>
            <span className="text-stone-500">
              Đang chờ:{" "}
              <strong className="text-orange-600 font-bold">
                {tasks.length} món
              </strong>
            </span>
            <StatusBadge label="Hệ thống trực tuyến" variant="success" />
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
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "grid"
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
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "list"
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
                  <span>Tạo đơn thử nghiệm (DB)</span>
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
