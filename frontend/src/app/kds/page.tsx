"use client";

import {
  Flame,
  Salad,
  Soup,
  Printer,
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
import { fetchOrders, updateOrderStatus, type OrderResponse } from "@/lib/api";

type StationId = "hot" | "cold" | "bar";

const STATION_TABS: { id: StationId; label: string; icon: typeof Flame }[] = [
  { id: "hot", label: "Bếp nóng", icon: Flame },
  { id: "cold", label: "Đồ lạnh", icon: Salad },
  { id: "bar", label: "Quầy bar", icon: Soup },
];

function getStationId(productName: string): StationId {
  const normalizedName = productName.toLowerCase();
  if (/(trà|cà phê|cafe|nước|sinh tố|latte|matcha)/.test(normalizedName)) {
    return "bar";
  }
  if (/(salad|gỏi|kim chi|cuốn)/.test(normalizedName)) {
    return "cold";
  }
  return "hot";
}

function mapOrderToTasks(order: OrderResponse): KitchenTask[] {
  if (!["PENDING", "CONFIRMED", "PREPARING"].includes(order.status)) {
    return [];
  }

  return order.items.map((item, index) => ({
    id: `${order.id}-${index}`,
    orderId: order.orderCode,
    tableName: order.tableNumber ? `Bàn ${order.tableNumber}` : "Mang đi",
    orderType: order.orderType === "TAKEAWAY" ? "Mang đi" : "Tại bàn",
    productName: item.name,
    quantity: item.quantity,
    modifiers: [item.toppings, item.sweetness, item.note]
      .filter(Boolean)
      .join(", "),
    startTime: order.createdAt,
    targetTime: 10,
    stationId: getStationId(item.name),
  }));
}

export default function KdsPage() {
  const [tasks, setTasks] = useState<KitchenTask[]>([]);
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

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        const orders = await fetchOrders();
        if (!ignore) {
          setTasks(orders.flatMap(mapOrderToTasks));
        }
      } catch (error) {
        if (!ignore) {
          toast.error(
            "Không thể tải đơn bếp",
            error instanceof Error ? error.message : "Vui lòng kiểm tra kết nối backend."
          );
        }
      }
    };

    void loadOrders();
    const refreshTimer = window.setInterval(() => void loadOrders(), 5000);
    return () => {
      ignore = true;
      window.clearInterval(refreshTimer);
    };
  }, [toast]);

  const handleCompleteTask = async (taskId: string) => {
    const completedItem = tasks.find((t) => t.id === taskId);
    if (!completedItem) return;
    const orderId = Number(taskId.split("-")[0]);

    try {
      await updateOrderStatus(orderId, "READY");
      setTasks((prev) => prev.filter((task) => !task.id.startsWith(`${orderId}-`)));
      toast.success(
        `Đã hoàn tất: ${completedItem.productName}`,
        `${completedItem.tableName ?? completedItem.orderId} (${completedItem.quantity} phần) đã sẵn sàng phục vụ.`
      );
    } catch (error) {
      toast.error(
        "Không thể cập nhật đơn",
        error instanceof Error ? error.message : "Vui lòng thử lại."
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