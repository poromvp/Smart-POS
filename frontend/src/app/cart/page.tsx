"use client";

import { ArrowLeft, CheckCircle2, LoaderCircle, MapPin, MessageCircleMore, Minus, Plus, ShoppingBag } from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGuestCart } from "@/components/customer/guestCartStore";
import { getGuestTableId, getGuestTableLabel, getGuestTableQuery } from "@/components/customer/guestTable";

const formatCurrency = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;

export default function GuestCartPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#fffaf5]" aria-label="Đang tải giỏ hàng" />}>
      <GuestCartContent />
    </Suspense>
  );
}

function GuestCartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = getGuestTableId(searchParams.get("table"));
  const tableLabel = getGuestTableLabel(tableId);
  const tableQuery = getGuestTableQuery(tableId);
  const { cartItems, totalPrice, updateNote, updateQuantity: changeQuantity, clearCart } = useGuestCart(tableId ?? "unassigned");
  const [submissionState, setSubmissionState] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmitOrder = () => {
    if (!tableId || cartItems.length === 0 || submissionState !== "idle") return;

    setSubmissionState("submitting");

    // Local demo only: no order API or kitchen integration exists yet.
    window.setTimeout(() => {
      clearCart();
      setSubmissionState("success");
    }, 650);
  };

  const handleBackToMenu = () => {
    setSubmissionState("idle");
    router.push(`/menu${tableQuery}`);
  };

  if (submissionState === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4 text-stone-900">
        <section className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-7 text-center shadow-xl shadow-orange-100/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-red-50 text-[#b42318]">
            <CheckCircle2 size={36} aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#b42318]">{tableLabel ?? "Chưa xác định bàn"}</p>
          <h1 className="mt-2 text-2xl font-extrabold">Đã ghi nhận yêu cầu gọi món</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Yêu cầu gọi món đã được ghi nhận trong phiên bản demo cho {tableLabel ?? "bàn chưa xác định"} trên thiết bị này.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Hệ thống hiện chưa kết nối gửi đơn trực tiếp đến bếp.
          </p>
          <button
            type="button"
            onClick={handleBackToMenu}
            className="mt-7 min-h-14 w-full rounded-xl bg-[#b42318] px-5 font-bold text-white shadow-lg shadow-red-200 transition active:scale-[0.98] hover:bg-[#8f1d15]"
          >
            Quay lại thực đơn
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] text-stone-900">
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-[#fffdf9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-stone-700 shadow-sm transition active:scale-[0.98] hover:bg-orange-100"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b42318]">Nhà hàng Mì Cay</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Xác nhận đơn</h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#b42318] shadow-sm">
            <ShoppingBag size={20} aria-hidden="true" />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 pb-36 pt-4">
        <div className="mb-4 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-stone-600 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <MapPin size={16} className="text-[#b42318]" aria-hidden="true" />
            {tableLabel ? `Đơn này dành cho ${tableLabel}` : "Chưa xác định bàn"}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <MessageCircleMore size={15} className="text-[#b42318]" aria-hidden="true" />
            {tableLabel ? "Ghi chú được lưu riêng cho từng món." : "Quét mã QR tại bàn để đơn được gắn đúng bàn."}
          </div>
        </div>

        <div className="space-y-3">
          {cartItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 shadow-sm">
              Chưa có món nào trong giỏ hàng. Quay lại menu để chọn món nhé.
            </div>
          ) : (
            cartItems.map((item) => (
            <article key={item.id} className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-[#b42318]">{formatCurrency(item.basePrice + item.modifierTotal)}</p>
                  {item.toppings.length > 0 && <p className="mt-1 text-xs text-slate-500">Topping: {item.toppings.join(", ")}</p>}
                  <p className="mt-1 text-xs text-slate-500">Độ ngọt: {item.sweetness}</p>
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

              <div className="mt-4 rounded-lg border border-orange-100 bg-[#fffaf5] px-3 py-3">
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

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-[#fffdf9]/98 px-4 py-4 shadow-[0_-8px_30px_rgba(120,53,15,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng thanh toán</p>
              <p className="mt-1 text-xs text-slate-400">{cartItems.length} món trong giỏ</p>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-[#b42318]">{formatCurrency(totalPrice)}</p>
          </div>

          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={!tableId || cartItems.length === 0 || submissionState !== "idle"}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#b42318] px-4 text-sm font-bold text-white shadow-lg shadow-red-200 transition active:scale-[0.98] hover:bg-[#8f1d15] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
          >
            {submissionState === "submitting" ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
            {submissionState === "submitting" ? "Đang ghi nhận..." : tableLabel ? "Xác nhận gọi món" : "Quét mã QR để xác nhận đơn"}
          </button>
        </div>
      </footer>
    </main>
  );
}
