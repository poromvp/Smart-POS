"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutGrid,
  ReceiptText,
  RefreshCw,
  X,
  History,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import InvoicePanel, {
  type MenuItem,
  type OrderItem,
} from "@/components/pos/InvoicePanel";
import PosItemModal, { type PosItemSelection } from "@/components/pos/PosItemModal";
import type { ProductDetailResponse } from "@/lib/types/menu";
import PaymentQRModal from "@/components/pos/PaymentQRModal";
import TableMap, { type RestaurantTable } from "@/components/pos/TableMap";
import TopHeader from "@/components/layout/TopHeader";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import OrderDetailModal, { formatCurrency } from "@/components/pos/OrderDetailModal";
import {
  fetchMenu,
  fetchOrders,
  createOrder,
  completeOrder,
  updateOrderPayment,
  cancelOrder,
} from "@/lib/api";
import type {
  OrderResponse,
  OrderItemResponse,
  PaymentMethod,
  CustomerResponse,
  ApplyPromotionResponse,
} from "@/lib/types/sales";

const TOTAL_TABLES_COUNT = 20;

const DEFAULT_TABLES: RestaurantTable[] = Array.from(
  { length: TOTAL_TABLES_COUNT },
  (_, index) => {
    const tableNumber = index + 1;
    return {
      id: `table-${tableNumber}`,
      name: `Bàn ${tableNumber}`,
      status: "empty",
    };
  }
);

function normalizeTableId(tableStr: string | null | undefined): string | null {
  if (!tableStr) return null;
  const match = tableStr.match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0) {
      return `table-${num}`;
    }
  }
  const digits = tableStr.replace(/[^0-9]/g, "");
  if (digits) {
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num > 0) {
      return `table-${num}`;
    }
  }
  return tableStr.trim().toLowerCase();
}

function getTableNumberOnly(tableId: string): string {
  return tableId.replace(/[^0-9]/g, "") || tableId;
}

function mapBackendItemToPosItem(backendItem: OrderItemResponse): OrderItem {
  return {
    id: `item-${backendItem.id}`,
    menuItemId: String(backendItem.productId || backendItem.itemId || ""),
    name: backendItem.name,
    price: backendItem.unitPrice + (backendItem.modifierTotal || 0),
    quantity: backendItem.quantity,
    toppings: backendItem.toppings
      ? backendItem.toppings.split(", ").filter(Boolean)
      : undefined,
    sweetness: backendItem.sweetness || undefined,
    note: backendItem.note || undefined,
  };
}

export default function PosPage() {
  const [activeView, setActiveView] = useState<"tables" | "history">("tables");
  const [tables, setTables] = useState<RestaurantTable[]>(DEFAULT_TABLES);
  const [ordersByTable, setOrdersByTable] = useState<Record<string, OrderItem[]>>({});
  const [backendOrdersByTable, setBackendOrdersByTable] = useState<
    Record<string, OrderResponse>
  >({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isPosItemModalOpen, setIsPosItemModalOpen] = useState(false);
  const [selectedModalProduct, setSelectedModalProduct] =
    useState<ProductDetailResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lịch sử hóa đơn
  const [completedOrders, setCompletedOrders] = useState<OrderResponse[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<OrderResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Dữ liệu thanh toán kèm Khuyến mãi & Loyalty từ InvoicePanel
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    customer?: CustomerResponse | null;
    promotion?: ApplyPromotionResponse | null;
    pointsToRedeem: number;
    subtotal: number;
    discountAmount: number;
    pointsDiscountAmount: number;
    finalTotal: number;
  } | null>(null);

  const toast = useToast();

  // 1. Tải thực đơn từ Catalog Service
  useEffect(() => {
    let active = true;
    fetchMenu()
      .then((categories) => {
        if (categories && categories.length > 0) {
          const items: MenuItem[] = categories.flatMap((cat) =>
            cat.products
              .filter((p) => p.isActive)
              .map((p) => ({
                id: String(p.id),
                name: p.name,
                price: p.basePrice,
                rawProduct: p,
                spicyLevels:
                  p.variants && p.variants.length > 0
                    ? p.variants.map((v) => v.sizeName)
                    : undefined,
              }))
          );
          if (active && items.length > 0) {
            setMenuItems(items);
          }
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải thực đơn:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // 2. Tải danh sách đơn hàng thực tế từ Sales Service
  const loadActiveOrders = useCallback(async () => {
    try {
      const allOrders = await fetchOrders();
      if (!allOrders) return;

      const active = allOrders.filter(
        (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
      );

      const newOrdersByTable: Record<string, OrderItem[]> = {};
      const newBackendOrdersByTable: Record<string, OrderResponse> = {};
      const occupiedTableIds = new Set<string>();

      for (const order of active) {
        const tableId = normalizeTableId(order.tableNumber);
        if (tableId) {
          occupiedTableIds.add(tableId);
          newBackendOrdersByTable[tableId] = order;
          newOrdersByTable[tableId] = (order.items || []).map(mapBackendItemToPosItem);
        }
      }

      setBackendOrdersByTable(newBackendOrdersByTable);

      setTables((currentTables) =>
        currentTables.map((t) => ({
          ...t,
          status:
            occupiedTableIds.has(t.id) ||
            (newOrdersByTable[t.id] && newOrdersByTable[t.id].length > 0)
              ? "occupied"
              : "empty",
        }))
      );

      setOrdersByTable((prev) => {
        const updated = { ...prev };
        for (const [tableId, items] of Object.entries(newOrdersByTable)) {
          updated[tableId] = items;
        }
        return updated;
      });
    } catch (err) {
      console.warn("Chưa thể kết nối tới Sales Service hoặc danh sách đơn trống:", err);
    }
  }, []);

  // 3. Tải lịch sử hóa đơn đã hoàn tất
  const loadCompletedOrders = useCallback(async () => {
    try {
      const all = await fetchOrders({ status: "COMPLETED" });
      setCompletedOrders(all || []);
    } catch (err) {
      console.warn("Lỗi tải lịch sử hóa đơn:", err);
    }
  }, []);

  useEffect(() => {
    loadActiveOrders();
    loadCompletedOrders();
    const interval = setInterval(() => {
      loadActiveOrders();
      if (activeView === "history") {
        loadCompletedOrders();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [loadActiveOrders, loadCompletedOrders, activeView]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadActiveOrders(), loadCompletedOrders()]);
    setIsRefreshing(false);
    toast.info("Đã đồng bộ", "Dữ liệu đơn hàng và lịch sử hóa đơn đã được cập nhật mới nhất");
  };

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tables]
  );

  const selectedOrder = selectedTableId ? ordersByTable[selectedTableId] ?? [] : [];
  const selectedTotal = selectedOrder.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTableId(table.id);
  };

  const handleSelectItem = (menuItem: MenuItem) => {
    if (!selectedTableId) {
      toast.warning("Chưa chọn bàn", "Vui lòng bấm chọn một bàn trước khi thêm món");
      return;
    }
    const raw = menuItem.rawProduct;
    const hasVariants = raw?.variants && raw.variants.length > 0;
    const hasModifiers = raw?.modifierGroups && raw.modifierGroups.length > 0;

    if (raw && (hasVariants || hasModifiers)) {
      setSelectedModalProduct(raw);
      setIsPosItemModalOpen(true);
    } else {
      handleAddItem(menuItem);
    }
  };

  const handleConfirmModalSelection = (selection: PosItemSelection) => {
    if (!selectedTableId) return;

    const toppingIds = selection.modifiers.map((m) => m.optionId).sort().join("-");
    const variantPart = selection.variant ? `-${selection.variant.id}` : "";
    const modifierPart = toppingIds ? `-mod-${toppingIds}` : "";
    const orderItemId = `${selection.product.id}${variantPart}${modifierPart}`;

    const toppingsList = selection.modifiers.map((m) => m.optionName);

    setOrdersByTable((currentOrders) => {
      const currentTableOrder = currentOrders[selectedTableId] ?? [];
      const existingIndex = currentTableOrder.findIndex((item) => item.id === orderItemId);
      let nextTableOrder: OrderItem[];

      if (existingIndex >= 0) {
        nextTableOrder = currentTableOrder.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + selection.quantity }
            : item
        );
      } else {
        nextTableOrder = [
          ...currentTableOrder,
          {
            id: orderItemId,
            menuItemId: String(selection.product.id),
            name: selection.product.name,
            price: selection.unitPrice,
            quantity: selection.quantity,
            sizeName: selection.variant?.sizeName,
            toppings: toppingsList.length > 0 ? toppingsList : undefined,
            note: selection.note || undefined,
          },
        ];
      }

      return { ...currentOrders, [selectedTableId]: nextTableOrder };
    });

    setTables((currentTables) =>
      currentTables.map((table) =>
        table.id === selectedTableId ? { ...table, status: "occupied" } : table
      )
    );

    toast.info(
      `Đã thêm: ${selection.product.name}`,
      `${selectedTable?.name ?? "Bàn"}${selection.variant ? ` • ${selection.variant.sizeName}` : ""}`
    );
  };

  const handleAddItem = (menuItem: MenuItem, spicyLevel?: string) => {
    if (!selectedTableId) return;

    const orderItemId = `${menuItem.id}${
      spicyLevel ? `-${spicyLevel.toLowerCase().replace(" ", "-")}` : ""
    }`;

    setOrdersByTable((currentOrders) => {
      const currentTableOrder = currentOrders[selectedTableId] ?? [];
      const existingItem = currentTableOrder.find((item) => item.id === orderItemId);
      const nextTableOrder = existingItem
        ? currentTableOrder.map((item) =>
            item.id === orderItemId ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [
            ...currentTableOrder,
            {
              id: orderItemId,
              menuItemId: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
              quantity: 1,
              spicyLevel,
            },
          ];

      return { ...currentOrders, [selectedTableId]: nextTableOrder };
    });

    setTables((currentTables) =>
      currentTables.map((table) =>
        table.id === selectedTableId ? { ...table, status: "occupied" } : table
      )
    );

    toast.info(
      `Đã thêm: ${menuItem.name}`,
      `${selectedTable?.name ?? "Bàn"}${spicyLevel ? ` • ${spicyLevel}` : ""}`
    );
  };

  const handleChangeQuantity = (orderItemId: string, quantity: number) => {
    if (!selectedTableId || !Number.isSafeInteger(quantity) || quantity < 0) return;

    const remainingItems = selectedOrder
      .map((item) => (item.id === orderItemId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    setTables((currentTables) =>
      currentTables.map((table) =>
        table.id === selectedTableId
          ? { ...table, status: remainingItems.length ? "occupied" : "empty" }
          : table
      )
    );

    setOrdersByTable((currentOrders) => {
      const nextTableOrder = (currentOrders[selectedTableId] ?? [])
        .map((item) => (item.id === orderItemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);

      return { ...currentOrders, [selectedTableId]: nextTableOrder };
    });
  };

  // Hủy đơn hàng và giải phóng bàn
  const handleCancelOrder = async () => {
    if (!selectedTableId) return;

    const cancelledTableId = selectedTableId;
    const tableName = selectedTable?.name || "Bàn";

    try {
      const existingBackendOrder = backendOrdersByTable[cancelledTableId];
      if (existingBackendOrder) {
        await cancelOrder(existingBackendOrder.id);
      }

      setOrdersByTable((prev) => ({ ...prev, [cancelledTableId]: [] }));
      setBackendOrdersByTable((prev) => {
        const next = { ...prev };
        delete next[cancelledTableId];
        return next;
      });

      setTables((prev) =>
        prev.map((t) => (t.id === cancelledTableId ? { ...t, status: "empty" } : t))
      );

      setSelectedTableId(null);
      setPendingPaymentData(null);

      toast.success(
        `Đã hủy đơn ${tableName}`,
        "Đơn hàng đã được chuyển sang trạng thái HỦY và bàn ăn đã về trạng thái trống."
      );

      await loadActiveOrders();
    } catch (err) {
      toast.error(
        "Lỗi hủy đơn",
        err instanceof Error ? err.message : "Không thể hủy đơn hàng."
      );
    }
  };

  // Bắt đầu quá trình thanh toán từ InvoicePanel
  const handleStartPayment = (data: {
    customer?: CustomerResponse | null;
    promotion?: ApplyPromotionResponse | null;
    pointsToRedeem: number;
    subtotal: number;
    discountAmount: number;
    pointsDiscountAmount: number;
    finalTotal: number;
  }) => {
    setPendingPaymentData(data);
    setIsPaymentModalOpen(true);
  };

  // Thanh toán thực tế: Gọi API Sales Service, Áp dụng Loyalty/Voucher & Trừ kho tự động
  const handlePaymentSuccess = async (method: "CASH" | "VIETQR") => {
    if (!selectedTableId) return;

    const paidTableId = selectedTableId;
    const paidTableName = selectedTable?.name ?? "Bàn";
    const paymentMethod: PaymentMethod = method === "VIETQR" ? "VIETQR" : "CASH";

    try {
      const existingBackendOrder = backendOrdersByTable[paidTableId];
      const finalPayAmount = pendingPaymentData?.finalTotal ?? selectedTotal;

      let orderCode = "";
      if (existingBackendOrder) {
        await updateOrderPayment(existingBackendOrder.id, {
          paymentStatus: "PAID",
          paymentMethod,
        });

        await completeOrder(existingBackendOrder.id);
        orderCode = existingBackendOrder.orderCode;
      } else {
        const tableNumber = getTableNumberOnly(paidTableId);
        const currentItems = ordersByTable[paidTableId] || [];

        if (currentItems.length > 0) {
          const createItems = currentItems.map((item) => {
            const numericId = parseInt(item.menuItemId, 10);
            return {
              productId: !isNaN(numericId) ? numericId : 1,
              name: item.name,
              quantity: item.quantity,
              basePrice: item.price,
              toppings: item.toppings,
              note: item.note,
            };
          });

          const created = await createOrder({
            tableNumber,
            orderType: "DINE_IN",
            customerId: pendingPaymentData?.customer?.id,
            customerPhone: pendingPaymentData?.customer?.phone,
            promotionCode: pendingPaymentData?.promotion?.code,
            pointsToRedeem: pendingPaymentData?.pointsToRedeem,
            items: createItems,
          });

          await updateOrderPayment(created.id, {
            paymentStatus: "PAID",
            paymentMethod,
          });

          await completeOrder(created.id);
          orderCode = created.orderCode;
        }
      }

      setOrdersByTable((currentOrders) => ({ ...currentOrders, [paidTableId]: [] }));
      setBackendOrdersByTable((prev) => {
        const next = { ...prev };
        delete next[paidTableId];
        return next;
      });

      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === paidTableId ? { ...table, status: "empty" } : table
        )
      );

      setIsPaymentModalOpen(false);
      setSelectedTableId(null);
      setPendingPaymentData(null);

      toast.success(
        `Thanh toán thành công ${paidTableName}!`,
        `Đơn hàng ${orderCode ? `#${orderCode} ` : ""}đã hoàn tất (${finalPayAmount.toLocaleString("vi-VN")}đ) và tự động trừ kho nguyên liệu.`
      );

      await Promise.all([loadActiveOrders(), loadCompletedOrders()]);
    } catch (err) {
      console.error("Lỗi khi xử lý thanh toán:", err);
      toast.error(
        "Lỗi thanh toán",
        err instanceof Error ? err.message : "Không thể hoàn tất thanh toán và trừ kho"
      );
    }
  };

  // Lọc lịch sử hóa đơn
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return completedOrders;
    const q = historySearch.toLowerCase().trim();
    return completedOrders.filter(
      (o) =>
        o.orderCode.toLowerCase().includes(q) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q))
    );
  }, [completedOrders, historySearch]);

  const totalHistoryRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [completedOrders]
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900">
      <TopHeader
        title="Màn hình thu ngân (POS)"
        branchName="Chi nhánh chính"
        rightContent={
          <div className="flex items-center gap-3">
            {/* Chuyển chế độ Sơ đồ bàn vs Lịch sử hóa đơn */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveView("tables")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeView === "tables"
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid size={14} />
                <span>Sơ đồ bàn</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView("history");
                  loadCompletedOrders();
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeView === "history"
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <History size={14} />
                <span>Lịch sử hóa đơn</span>
                {completedOrders.length > 0 && (
                  <span className="rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.2 text-[10px] font-extrabold">
                    {completedOrders.length}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Đồng bộ dữ liệu"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin text-orange-500" : ""}
              />
              <span>Đồng bộ</span>
            </button>
            <StatusBadge label="Hệ thống trực tuyến" variant="success" />
          </div>
        }
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WorkspaceSidebar defaultCollapsed={true} />

        <main className="mx-auto flex w-full max-w-[1800px] flex-1 min-h-0 flex-col p-3.5 lg:p-5">
          {activeView === "tables" ? (
            /* ==================== VIEW 1: SƠ ĐỒ BÀN & POS ==================== */
            <div
              className={`grid flex-1 min-h-0 gap-4 ${
                selectedTable
                  ? "grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                  : "grid-cols-1"
              }`}
            >
              <section
                className={`${
                  selectedTable ? "hidden lg:flex" : "flex"
                } min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={18} className="text-orange-500" aria-hidden="true" />
                    <span>Khu vực phục vụ</span>
                  </div>
                  <span className="text-xs font-bold text-orange-600">
                    Đang dùng: {tables.filter((t) => t.status === "occupied").length}/
                    {tables.length} bàn
                  </span>
                </div>

                <TableMap
                  tables={tables}
                  totals={Object.fromEntries(
                    Object.entries(ordersByTable).map(([id, items]) => [
                      id,
                      items.reduce((sum, item) => sum + item.price * item.quantity, 0),
                    ])
                  )}
                  selectedTableId={selectedTableId}
                  onSelectTable={handleSelectTable}
                />
              </section>

              {selectedTable && (
                <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-lg shadow-orange-500/5">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-700 bg-orange-50/40">
                    <div className="flex items-center gap-2">
                      <ReceiptText size={18} className="text-orange-600" aria-hidden="true" />
                      <span className="font-bold text-slate-800">
                        Chi tiết của {selectedTable.name}
                        {backendOrdersByTable[selectedTable.id] && (
                          <span className="ml-2 text-xs font-semibold text-orange-600">
                            (Đơn #{backendOrdersByTable[selectedTable.id].orderCode})
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTableId(null)}
                      title="Đóng chi tiết bàn"
                      className="flex min-h-11 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-orange-100 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      <span>Về sơ đồ bàn</span>
                      <X size={15} />
                    </button>
                  </div>

                  <InvoicePanel
                    key={selectedTable.id}
                    table={selectedTable}
                    orderItems={selectedOrder}
                    menuItems={menuItems}
                    onAddItem={handleAddItem}
                    onSelectItem={handleSelectItem}
                    onChangeQuantity={handleChangeQuantity}
                    onPayment={handleStartPayment}
                    onCancelOrder={handleCancelOrder}
                  />
                </section>
              )}
            </div>
          ) : (
            /* ==================== VIEW 2: LỊCH SỬ HÓA ĐƠN ==================== */
            <section className="flex flex-1 min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              {/* Header Lịch sử */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 p-4 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm mã đơn, số bàn, SĐT khách..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                    <span>Tổng đơn: <strong>{completedOrders.length}</strong></span>
                    <span>•</span>
                    <span>Tổng thu: <strong className="text-orange-600">{formatCurrency(totalHistoryRevenue)}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveView("tables")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition cursor-pointer"
                >
                  <LayoutGrid size={14} />
                  <span>Mở sơ đồ bàn</span>
                </button>
              </div>

              {/* Bảng Hóa đơn hoàn tất */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Mã đơn</th>
                      <th className="py-3 px-4">Bàn</th>
                      <th className="py-3 px-4">Thời gian thanh toán</th>
                      <th className="py-3 px-4">Khách hàng</th>
                      <th className="py-3 px-4">Phương thức</th>
                      <th className="py-3 px-4">Số món</th>
                      <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredHistory.map((order) => (
                      <tr key={order.id} className="hover:bg-orange-50/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          #{order.orderCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {order.tableNumber ? `Bàn ${order.tableNumber}` : "Mang về"}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {new Date(order.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {order.customerPhone ? (
                            <span className="flex items-center gap-1 text-slate-800 font-medium">
                              <User size={12} className="text-orange-500" />
                              {order.customerName ? `${order.customerName} - ` : ""}
                              {order.customerPhone}
                            </span>
                          ) : (
                            <span className="text-slate-400">Khách vãng lai</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${
                              order.paymentMethod === "VIETQR"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {order.paymentMethod === "VIETQR" ? "VietQR" : "Tiền mặt"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {(order.items || []).reduce((sum, item) => sum + item.quantity, 0)} phần
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-orange-600 tabular-nums">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailOrder(order);
                              setIsDetailModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600 transition cursor-pointer shadow-2xs"
                          >
                            <Printer size={12} />
                            <span>Chi tiết & In lại</span>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          Chưa có hóa đơn nào hoàn tất trong phiên làm việc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>

      <PosItemModal
        product={selectedModalProduct}
        isOpen={isPosItemModalOpen}
        onClose={() => setIsPosItemModalOpen(false)}
        onConfirm={handleConfirmModalSelection}
      />

      <PaymentQRModal
        key={isPaymentModalOpen ? "payment-open" : "payment-closed"}
        isOpen={isPaymentModalOpen}
        table={selectedTable}
        total={pendingPaymentData?.finalTotal ?? selectedTotal}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPendingPaymentData(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <OrderDetailModal
        order={selectedDetailOrder}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailOrder(null);
        }}
      />
    </div>
  );
}
