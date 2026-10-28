"use client";

import { useState } from "react";
import type { CartItem } from "./guestCartStore";

interface FloatingCartProps {
  items: CartItem[];
  onViewCart: () => void;
}

export default function FloatingCart({
  items,
  onViewCart,
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
      {/* Expanded cart drawer */}
      {open && (
        <div className="fixed inset-0 z-40 bg-stone-950/45">
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[75vh] max-w-2xl overflow-y-auto rounded-t-2xl bg-[var(--surface-warm)] shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-[var(--border-light)] bg-[var(--surface-warm)] px-5 py-4">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-orange-200" />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    Giỏ hàng
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {totalQuantity} món
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-xl text-stone-600"
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
                    className="rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)]">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-sm text-[var(--muted)]">
                          SL: {item.quantity}
                        </p>

                        {item.toppings.length > 0 && (
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Topping: {item.toppings.join(", ")}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Độ ngọt: {item.sweetness}
                        </p>

                        {item.note && (
                          <p className="mt-1 text-xs italic text-[var(--muted)]">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-bold text-[var(--brand)]">
                          {itemPrice.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 border-t border-[var(--border-light)] bg-[var(--surface-warm)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--muted)]">
                  Tổng cộng
                </span>

                <span className="text-xl font-bold text-[var(--foreground)]">
                  {totalPrice.toLocaleString("vi-VN")}₫
                </span>
              </div>

              <button
                type="button"
                onClick={onViewCart}
                className="min-h-14 w-full rounded-xl bg-[var(--brand)] px-5 font-semibold text-white shadow-lg shadow-red-200 transition active:scale-[0.98] hover:bg-[var(--brand-dark)]"
              >
                Xem và xác nhận đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      {!open && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl px-4 pb-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-14 w-full items-center justify-center rounded-xl bg-[var(--brand)] px-5 text-white shadow-xl shadow-red-200/60 transition active:scale-[0.98] hover:bg-[var(--brand-dark)]"
          >
            <span className="text-base font-semibold">
              Xem giỏ hàng ({totalQuantity} món) · {totalPrice.toLocaleString("vi-VN")}₫
            </span>
          </button>
        </div>
      )}
    </>
  );
}
