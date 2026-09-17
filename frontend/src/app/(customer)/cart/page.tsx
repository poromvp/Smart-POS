"use client";

import { ArrowLeft, CreditCard, MessageCircleMore, Minus, Plus, QrCode, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGuestCart } from "@/components/customer/guestCartStore";

const formatCurrency = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;

export default function GuestCartPage() {
  const router = useRouter();
  const { cartItems, totalPrice, updateNote, updateQuantity: changeQuantity, clearCart } = useGuestCart();

  const handleCashPayment = () => {
    alert("Đã chọn thanh toán tiền mặt");
    clearCart();
  };

  const handleVietQrPayment = () => {
    alert("Đã chọn thanh toán VietQR");
    clearCart();
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition active:scale-[0.98] hover:bg-slate-200"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Khách vãng lai
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Giỏ hàng</h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
            <ShoppingBag size={20} aria-hidden="true" />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 pb-36 pt-4">
        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <MessageCircleMore size={16} className="text-emerald-600" aria-hidden="true" />
            Ghi chú sẽ được lưu riêng cho từng món.
          </div>
        </div>

        <div className="space-y-3">
          {cartItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 shadow-sm">
              Chưa có món nào trong giỏ hàng. Quay lại menu để chọn món nhé.
            </div>
          ) : (
            cartItems.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">{formatCurrency(item.basePrice + item.modifierTotal)}</p>
                </div>

                <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, -1)}
                    className="flex h-9 w-9 items-center justify-center rounded-l-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label={`Giảm số lượng ${item.name}`}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-r-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label={`Tăng số lượng ${item.name}`}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <input
                  type="text"
                  value={item.note}
                  onChange={(event) => updateNote(item.id, event.target.value)}
                  placeholder="Nhập ghi chú cho món này..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  aria-label={`Ghi chú cho ${item.name}`}
                />
              </div>
            </article>
            ))
          )}
        </div>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/98 px-4 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng thanh toán</p>
              <p className="mt-1 text-xs text-slate-400">{cartItems.length} món trong giỏ</p>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-orange-600">{formatCurrency(totalPrice)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCashPayment}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-bold text-white shadow-lg shadow-orange-200 transition active:scale-[0.98] hover:bg-orange-600"
            >
              <CreditCard size={18} aria-hidden="true" />
              Thanh toán Tiền mặt
            </button>

            <button
              type="button"
              onClick={handleVietQrPayment}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition active:scale-[0.98] hover:bg-emerald-700"
            >
              <QrCode size={18} aria-hidden="true" />
              Thanh toán VietQR
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
