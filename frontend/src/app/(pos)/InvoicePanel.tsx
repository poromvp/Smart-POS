"use client";

import type { RestaurantTable } from "./TableMap";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface InvoicePanelProps {
  table: RestaurantTable | null;
  orderItems: OrderItem[];
  onSplitTable: () => void;
  onPayment: () => void;
}

export default function InvoicePanel({
  table,
  orderItems,
  onSplitTable,
  onPayment,
}: InvoicePanelProps) {
  const subtotal = orderItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const serviceFee = 0;
  const total = subtotal + serviceFee;

  if (!table) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">
            🧾
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Chưa chọn bàn
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Chọn một bàn đang phục vụ trên sơ đồ
            để xem hóa đơn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hóa đơn hiện tại
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {table.name}
            </h2>
          </div>

          <div className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700">
            Đang phục vụ
          </div>
        </div>
      </div>

      {/* Order list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3 p-5">
          {orderItems.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
              Chưa có món trong hóa đơn.
            </div>
          ) : (
            orderItems.map((item) => {
              const lineTotal =
                item.price * item.quantity;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {item.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span>
                          {item.price.toLocaleString(
                            "vi-VN"
                          )}
                          ₫
                        </span>

                        <span>×</span>

                        <span>{item.quantity}</span>
                      </div>
                    </div>

                    <p className="shrink-0 font-bold text-slate-900">
                      {lineTotal.toLocaleString(
                        "vi-VN"
                      )}
                      ₫
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Tạm tính
            </span>

            <span className="font-semibold text-slate-800">
              {subtotal.toLocaleString("vi-VN")}₫
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Phí dịch vụ
            </span>

            <span className="font-semibold text-slate-800">
              {serviceFee.toLocaleString("vi-VN")}₫
            </span>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Tổng cộng
              </span>

              <span className="text-2xl font-bold text-emerald-600">
                {total.toLocaleString("vi-VN")}₫
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSplitTable}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            Tách bàn
          </button>

          <button
            type="button"
            disabled={orderItems.length === 0}
            onClick={onPayment}
            className="min-h-12 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Tính tiền
          </button>
        </div>
      </div>
    </div>
  );
}