"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, ReceiptText, RefreshCw, X } from "lucide-react";
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
import {
  fetchMenu,
  fetchOrders,
  createOrder,
  completeOrder,
  updateOrderPayment,
} from "@/lib/api";
import type { OrderResponse, OrderItemResponse, PaymentMethod } from "@/lib/types/sales";

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
  const num = tableStr.replace(/[^0-9]/g, "");
  return num ? `table-${num}` : tableStr.trim().toLowerCase();
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

      // Lọc các đơn chưa hoàn tất hoặc hủy
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

      // Cập nhật trạng thái từng bàn
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

      // Đồng bộ items
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

  useEffect(() => {
    loadActiveOrders();
    const interval = setInterval(loadActiveOrders, 6000);
    return () => clearInterval(interval);
  }, [loadActiveOrders]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadActiveOrders();
    setIsRefreshing(false);
    toast.info("Đã đồng bộ", "Dữ liệu đơn hàng và bàn ăn đã được cập nhật mới nhất");
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

  // Thanh toán thực tế: Gọi API Sales Service & Trừ kho tự động
  const handlePaymentSuccess = async (method: "CASH" | "VIETQR") => {
    if (!selectedTableId) return;

    const paidTableId = selectedTableId;
    const paidTableName = selectedTable?.name ?? "Bàn";
    const paymentMethod: PaymentMethod = method === "VIETQR" ? "VIETQR" : "CASH";

    try {
      const existingBackendOrder = backendOrdersByTable[paidTableId];

      let orderCode = "";
      if (existingBackendOrder) {
        // Cập nhật trạng thái thanh toán
        await updateOrderPayment(existingBackendOrder.id, {
          paymentStatus: "PAID",
          paymentMethod,
        });

        // Hoàn tất đơn hàng và tự động trừ kho
        await completeOrder(existingBackendOrder.id);
        orderCode = existingBackendOrder.orderCode;
      } else {
        // Đơn tạo trực tiếp tại POS (chưa lưu vào DB)
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

      // Xóa đơn local & chuyển bàn về trống
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

      toast.success(
        `Thanh toán thành công ${paidTableName}!`,
        `Đơn hàng ${orderCode ? `#${orderCode} ` : ""}đã hoàn tất (${selectedTotal.toLocaleString("vi-VN")}đ) và tự động trừ kho nguyên liệu.`
      );

      // Đồng bộ lại danh sách
      await loadActiveOrders();
    } catch (err) {
      console.error("Lỗi khi xử lý thanh toán:", err);
      toast.error(
        "Lỗi thanh toán",
        err instanceof Error ? err.message : "Không thể hoàn tất thanh toán và trừ kho"
      );
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900">
      <TopHeader
        title="Màn hình thu ngân (POS)"
        branchName="Chi nhánh 01"
        rightContent={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="Đồng bộ đơn hàng từ máy khách & bếp"
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
                    <ReceiptText
                      size={18}
                      className="text-orange-600"
                      aria-hidden="true"
                    />
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
                  onPayment={() => setIsPaymentModalOpen(true)}
                />
              </section>
            )}
          </div>
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
        total={selectedTotal}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
