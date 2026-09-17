"use client";

import { useMemo, useState } from "react";
import TableMap, {
  type RestaurantTable,
} from "@/components/pos/TableMap";

import InvoicePanel, {
  type OrderItem,
} from "@/components/pos/InvoicePanel";

import PaymentQRModal from "@/components/pos/PaymentQRModal";

const INITIAL_TABLES: RestaurantTable[] = [
  {
    id: "t01",
    name: "Bàn 01",
    status: "empty",
  },
  {
    id: "t02",
    name: "Bàn 02",
    status: "occupied",
  },
  {
    id: "t03",
    name: "Bàn 03",
    status: "empty",
  },
  {
    id: "t04",
    name: "Bàn 04",
    status: "occupied",
  },
  {
    id: "t05",
    name: "Bàn 05",
    status: "empty",
  },
  {
    id: "t06",
    name: "Bàn 06",
    status: "empty",
  },
  {
    id: "t07",
    name: "Bàn 07",
    status: "occupied",
  },
  {
    id: "t08",
    name: "Bàn 08",
    status: "empty",
  },
  {
    id: "t09",
    name: "Bàn 09",
    status: "empty",
  },
  {
    id: "t10",
    name: "Bàn 10",
    status: "empty",
  },
];

const ORDERS: Record<string, OrderItem[]> = {
  t02: [
    {
      id: "o01",
      name: "Cơm chiên hải sản",
      quantity: 1,
      price: 65000,
    },
    {
      id: "o02",
      name: "Coca Cola",
      quantity: 2,
      price: 15000,
    },
    {
      id: "o03",
      name: "Gà sốt cay Hàn Quốc",
      quantity: 1,
      price: 89000,
    },
  ],
};

export default function CashierPage() {
  const [tables, setTables] =
    useState<RestaurantTable[]>(INITIAL_TABLES);

  const [selectedTableId, setSelectedTableId] =
    useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] =
    useState(false);

  const selectedTable = useMemo(
    () =>
      tables.find(
        (table) => table.id === selectedTableId
      ) ?? null,
    [tables, selectedTableId]
  );

  const selectedOrder =
    selectedTableId !== null
      ? ORDERS[selectedTableId] ?? []
      : [];

  const handleSelectTable = (
    table: RestaurantTable
  ) => {
    if (table.status !== "occupied") {
      setSelectedTableId(null);
      return;
    }

    setSelectedTableId(table.id);
  };

  const handleSplitTable = () => {
    if (!selectedTable) return;

    alert(
      `Đang mô phỏng chức năng Tách bàn cho ${selectedTable.name}`
    );
  };

  const handleOpenPayment = () => {
    if (!selectedTable || selectedOrder.length === 0) {
      return;
    }

    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    if (!selectedTableId) return;

    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === selectedTableId
          ? {
              ...table,
              status: "empty",
            }
          : table
      )
    );

    setSelectedTableId(null);
    setIsPaymentModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-5 lg:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-600">
              SmartPOS
            </p>

            <h1 className="text-xl font-bold text-slate-900">
              Màn hình thu ngân
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                Thu ngân
              </p>

              <p className="text-xs text-slate-500">
                Ca sáng
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              TN
            </div>
          </div>
        </div>
      </header>

      {/* POS Layout */}
      <section className="h-[calc(100vh-4rem)] p-3 md:p-4 lg:p-5">
        <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-[3fr_2fr]">
          {/* LEFT - TABLE MAP */}
          <section className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <TableMap
              tables={tables}
              selectedTableId={selectedTableId}
              onSelectTable={handleSelectTable}
            />
          </section>

          {/* RIGHT - INVOICE */}
          <section className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <InvoicePanel
              table={selectedTable}
              orderItems={selectedOrder}
              onSplitTable={handleSplitTable}
              onPayment={handleOpenPayment}
            />
          </section>
        </div>
      </section>

      {/* PAYMENT MODAL */}
      <PaymentQRModal
        open={isPaymentModalOpen}
        table={selectedTable}
        total={selectedOrder.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </main>
  );
}