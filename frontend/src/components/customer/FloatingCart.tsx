"use client";

import { useState } from "react";

export interface CartItem {
  id: string;
  itemId: string;
  name: string;
  basePrice: number;
  modifierTotal: number;
  toppings: string[];
  sweetness: string;
  note: string;
  quantity: number;
}

interface FloatingCartProps {
  items: CartItem[];
  onSubmitOrder: () => void;
}

export default function FloatingCart({
  items,
  onSubmitOrder,
}: FloatingCartProps) {
  const [open, setOpen] = useState(false);

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = items.reduce(
    (sum, item) =>
      sum + (item.basePrice + item.modifierTotal) * item.quantity,
    0
  );

  const hasItems = totalQuantity > 0;

  if (!hasItems) return null;

  return (
    <>
      {/* Expanded cart */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40">
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[75vh] max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Giỏ hàng
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {totalQuantity} món
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600"
                  aria-label="Đóng giỏ hàng"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-3 px-5 py-5">
              {items.map((item) => {
                const itemPrice =
                  (item.basePrice + item.modifierTotal) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          SL: {item.quantity}
                        </p>

                        {item.toppings.length > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            Topping: {item.toppings.join(", ")}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          Độ ngọt: {item.sweetness}
                        </p>

                        {item.note && (
                          <p className="mt-1 text-xs italic text-slate-500">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-bold text-emerald-600">
                          {itemPrice.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Tổng cộng
                </span>

                <span className="text-xl font-bold text-slate-900">
                  {totalPrice.toLocaleString("vi-VN")}₫
                </span>
              </div>

              <button
                type="button"
                onClick={onSubmitOrder}
                className="min-h-14 w-full rounded-2xl bg-emerald-600 px-5 font-semibold text-white shadow-lg shadow-emerald-200 transition active:scale-[0.98] hover:bg-emerald-700"
              >
                Gửi đơn xuống bếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl px-4 pb-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-slate-900 px-5 text-white shadow-2xl shadow-slate-400/40 transition active:scale-[0.98] hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xl">
                🛒

                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {totalQuantity}
                </span>
              </div>

              <div className="text-left">
                <p className="text-xs text-slate-400">
                  Giỏ hàng
                </p>

                <p className="font-semibold">
                  {totalQuantity} món
                </p>
              </div>
            </div>

            <span className="text-lg font-bold">
              {totalPrice.toLocaleString("vi-VN")}₫
            </span>
          </button>
        </div>
      )}
    </>
  );
}