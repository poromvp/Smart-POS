"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, ReceiptText } from "lucide-react";
import InvoicePanel, {
  type MenuItem,
  type OrderItem,
} from "@/components/pos/InvoicePanel";
import PaymentQRModal from "@/components/pos/PaymentQRModal";
import TableMap, { type RestaurantTable } from "@/components/pos/TableMap";
import TopHeader from "@/components/layout/TopHeader";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";

export const SPICY_LEVELS = Array.from({ length: 8 }, (_, index) => `Cấp ${index}`);

export const MENU_ITEMS: MenuItem[] = [
  { id: "spicy-beef-noodles", name: "Mì cay bò", price: 75000, spicyLevels: SPICY_LEVELS },
  { id: "spicy-seafood-noodles", name: "Mì cay hải sản", price: 85000, spicyLevels: SPICY_LEVELS },
  { id: "peach-lemongrass-tea", name: "Trà đào cam sả", price: 25000 },
  { id: "pepsi", name: "Pepsi", price: 15000 },
];

export const INITIAL_TABLES: RestaurantTable[] = Array.from({ length: 12 }, (_, index) => {
  const tableNumber = index + 1;
  const occupiedTableNumbers = [1, 3, 6, 9];

  return {
    id: `table-${tableNumber}`,
    name: `Bàn ${tableNumber}`,
    status: occupiedTableNumbers.includes(tableNumber) ? "occupied" : "empty",
  };
});

export const INITIAL_ORDERS: Record<string, OrderItem[]> = {
  "table-1": [
    {
      id: "spicy-beef-noodles-cap-3",
      menuItemId: "spicy-beef-noodles",
      name: "Mì cay bò",
      price: 75000,
      quantity: 2,
      spicyLevel: "Cấp 3",
    },
    {
      id: "peach-lemongrass-tea",
      menuItemId: "peach-lemongrass-tea",
      name: "Trà đào cam sả",
      price: 25000,
      quantity: 2,
    },
  ],
  "table-3": [
    {
      id: "spicy-seafood-noodles-cap-1",
      menuItemId: "spicy-seafood-noodles",
      name: "Mì cay hải sản",
      price: 85000,
      quantity: 1,
      spicyLevel: "Cấp 1",
    },
  ],
  "table-6": [
    { id: "pepsi", menuItemId: "pepsi", name: "Pepsi", price: 15000, quantity: 3 },
  ],
  "table-9": [
    {
      id: "spicy-beef-noodles-cap-5",
      menuItemId: "spicy-beef-noodles",
      name: "Mì cay bò",
      price: 75000,
      quantity: 1,
      spicyLevel: "Cấp 5",
    },
  ],
};

export default function PosPage() {
  const [tables, setTables] = useState<RestaurantTable[]>(INITIAL_TABLES);
  const [ordersByTable, setOrdersByTable] = useState<Record<string, OrderItem[]>>(INITIAL_ORDERS);
  const [selectedTableId, setSelectedTableId] = useState("table-1");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const toast = useToast();

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tables]
  );
  const selectedOrder = ordersByTable[selectedTableId] ?? [];
  const selectedTotal = selectedOrder.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleAddItem = (menuItem: MenuItem, spicyLevel?: string) => {
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
    setOrdersByTable((currentOrders) => {
      const nextTableOrder = (currentOrders[selectedTableId] ?? [])
        .map((item) => (item.id === orderItemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);

      return { ...currentOrders, [selectedTableId]: nextTableOrder };
    });
  };

  const handlePaymentSuccess = () => {
    const paidTableId = selectedTableId;
    const paidTableName = selectedTable?.name ?? "Bàn";

    setOrdersByTable((currentOrders) => ({ ...currentOrders, [paidTableId]: [] }));
    setTables((currentTables) =>
      currentTables.map((table) =>
        table.id === paidTableId ? { ...table, status: "empty" } : table
      )
    );
    setIsPaymentModalOpen(false);

    toast.success(
      `Thanh toán thành công ${paidTableName}`,
      `Tổng thu: ${selectedTotal.toLocaleString("vi-VN")}đ. Bàn đã chuyển về trạng thái trống.`
    );
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900">
      <TopHeader
        title="Màn hình thu ngân (POS)"
        branchName="Chi nhánh 01"
        rightContent={<StatusBadge label="Ca đang hoạt động" variant="serving" />}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WorkspaceSidebar defaultCollapsed={true} />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 min-h-0 flex-col p-3.5 lg:p-4">
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-[117.65%] w-[117.65%] origin-top-left scale-[0.85]">
              <div className="grid h-full min-h-0 gap-3.5 lg:grid-cols-[3fr_2fr] lg:gap-4">
                <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-600 lg:px-5 lg:py-3 lg:text-sm">
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={18} className="text-orange-500" aria-hidden="true" />
                      <span>Khu vực phục vụ</span>
                    </div>
                    <span className="text-xs font-medium text-orange-600">
                      Đang dùng: {tables.filter((t) => t.status === "occupied").length}/{tables.length} bàn
                    </span>
                  </div>
                  <TableMap
                    tables={tables}
                    selectedTableId={selectedTableId}
                    onSelectTable={(table) => setSelectedTableId(table.id)}
                  />
                </section>

                <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-600 lg:px-5 lg:py-3 lg:text-sm">
                    <ReceiptText size={18} className="text-orange-500" aria-hidden="true" />
                    <span>Đơn hàng hiện tại</span>
                  </div>
                  <InvoicePanel
                    table={selectedTable}
                    orderItems={selectedOrder}
                    menuItems={MENU_ITEMS}
                    onAddItem={handleAddItem}
                    onChangeQuantity={handleChangeQuantity}
                    onPayment={() => setIsPaymentModalOpen(true)}
                  />
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>

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