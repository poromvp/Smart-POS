"use client";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MessageCircleMore,
  Minus,
  Plus,
  ShoppingBag,
  AlertCircle,
  Tag,
  Check,
  X,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGuestCart } from "@/components/customer/guestCartStore";
import { getGuestTableId, getGuestTableLabel, getGuestTableQuery } from "@/components/customer/guestTable";
import { createOrder, applyPromotion } from "@/lib/api";
import type { OrderResponse, ApplyPromotionResponse } from "@/lib/types/sales";

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
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Khuyến mãi / Voucher
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<ApplyPromotionResponse | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const discountAmount = appliedPromo?.valid && appliedPromo.discountAmount ? appliedPromo.discountAmount : 0;
  const finalTotalPrice = Math.max(0, totalPrice - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || totalPrice <= 0) return;
    setIsApplyingPromo(true);
    setPromoMessage(null);
    try {
      const res = await applyPromotion({
        code: promoCodeInput.trim(),
        subtotal: totalPrice,
      });

      if (res.valid) {
        setAppliedPromo(res);
        setPromoMessage({ text: res.message || "Áp dụng voucher thành công!", isError: false });
      } else {
        setAppliedPromo(null);
        setPromoMessage({ text: res.message || "Mã không hợp lệ", isError: true });
      }
    } catch (err) {
      setAppliedPromo(null);
      setPromoMessage({
        text: err instanceof Error ? err.message : "Không thể áp dụng mã giảm giá",
        isError: true,
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoMessage(null);
    setPromoCodeInput("");
  };

  const handleSubmitOrder = async () => {
    if (!tableId || cartItems.length === 0 || submissionState !== "idle") return;

    setSubmissionState("submitting");
    setErrorMessage(null);

    try {
      const items = cartItems.map((item) => {
        const numericProductId = parseInt(item.itemId, 10);
        return {
          productId: !isNaN(numericProductId) ? numericProductId : 1,
          variantId: item.variantId,
          modifierOptionIds: item.modifierOptionIds || [],
          name: item.name,
          quantity: item.quantity,
          basePrice: item.basePrice,
          modifierTotal: item.modifierTotal || 0,
          toppings: item.toppings,
          sweetness: item.sweetness,
          note: item.note,
        };
      });

      const response = await createOrder({
        tableNumber: tableId,
        orderType: "DINE_IN",
        promotionCode: appliedPromo?.code,
        items,
      });

      setCreatedOrder(response);
      clearCart();
      setSubmissionState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Không thể gửi đơn hàng. Vui lòng thử lại!");
      setSubmissionState("idle");
    }
  };

  const handleBackToMenu = () => {
    setSubmissionState("idle");
    router.push(`/menu${tableQuery}`);
  };

  if (submissionState === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-4 text-stone-900">
        <section className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-7 text-center shadow-xl shadow-orange-100/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={36} aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#b42318]">{tableLabel ?? "Chưa xác định bàn"}</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Đã gửi đơn hàng thành công!</h1>
          {createdOrder && (
            <div className="mt-3 inline-block rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
              Mã đơn: #{createdOrder.orderCode}
            </div>
          )}
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Đơn gọi món của quý khách đã được chuyển thẳng tới quầy Thu ngân và Bếp để chế biến.
          </p>
          <button
            type="button"
            onClick={handleBackToMenu}
            className="mt-7 min-h-14 w-full rounded-xl bg-[#b42318] px-5 font-bold text-white shadow-lg shadow-red-200 transition active:scale-[0.98] hover:bg-[#8f1d15] cursor-pointer"
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
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-stone-700 shadow-sm transition active:scale-[0.98] hover:bg-orange-100 cursor-pointer"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b42318]">Smart POS Restaurant</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Xác nhận đơn</h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#b42318] shadow-sm">
            <ShoppingBag size={20} aria-hidden="true" />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 pb-48 pt-4">
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

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

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
                    <p className="mt-1 text-sm font-semibold text-[#b42318]">{formatCurrency(item.basePrice + (item.modifierTotal || 0))}</p>
                    {item.sizeName && (
                      <span className="inline-block mt-1 text-[11px] font-semibold text-orange-800 bg-orange-100/70 px-2 py-0.5 rounded">
                        {item.sizeName}
                      </span>
                    )}
                    {item.toppings && item.toppings.length > 0 && (
                      <p className="mt-1 text-xs text-stone-500">
                        Tùy chọn: {item.toppings.join(", ")}
                      </p>
                    )}
                    {item.sweetness && (
                      <p className="mt-0.5 text-xs text-stone-500">
                        Độ ngọt: {item.sweetness}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, -1)}
                      className="flex h-9 w-9 items-center justify-center rounded-l-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      aria-label={`Giảm số lượng ${item.name}`}
                    >
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-r-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
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

        {/* Ô nhập mã khuyến mãi (Voucher) */}
        {cartItems.length > 0 && (
          <div className="mt-4 rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Tag size={15} className="text-[#b42318]" />
                Mã giảm giá / Khuyến mãi
              </span>
              {appliedPromo && (
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {!appliedPromo ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã voucher (VD: GIAM10)..."
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    className="flex-1 rounded-xl border border-orange-200 bg-[#fffaf5] px-3 py-2 text-xs uppercase outline-none focus:border-[#b42318]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoCodeInput.trim()}
                    className="rounded-xl bg-[#b42318] px-4 py-2 text-xs font-bold text-white hover:bg-[#8f1d15] disabled:opacity-50 cursor-pointer transition shadow-sm"
                  >
                    {isApplyingPromo ? "..." : "Áp dụng"}
                  </button>
                </div>

                {promoMessage && (
                  <p
                    className={`text-[11px] font-medium ${
                      promoMessage.isError ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <Check size={14} />
                  Mã {appliedPromo.code} (-{appliedPromo.discountPercent}%)
                </span>
                <span className="font-bold text-emerald-800">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer Thanh toán */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-[#fffdf9]/98 px-4 py-4 shadow-[0_-8px_30px_rgba(120,53,15,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-stone-600 border-b border-orange-100 pb-2">
              <span>Tạm tính: <strong>{formatCurrency(totalPrice)}</strong></span>
              <span className="text-emerald-700 font-semibold">Giảm giá: -{formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng thanh toán</p>
              <p className="mt-0.5 text-xs text-slate-400">{cartItems.length} món trong giỏ</p>
            </div>
            <p className="text-2xl font-black tracking-tight text-[#b42318]">
              {formatCurrency(finalTotalPrice)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={!tableId || cartItems.length === 0 || submissionState !== "idle"}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#b42318] px-4 text-sm font-bold text-white shadow-lg shadow-red-200 transition active:scale-[0.98] hover:bg-[#8f1d15] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none cursor-pointer"
          >
            {submissionState === "submitting" ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
            {submissionState === "submitting" ? "Đang gửi đơn..." : tableLabel ? "Xác nhận gọi món" : "Quét mã QR để xác nhận đơn"}
          </button>
          {errorMessage && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          )}
        </div>
      </footer>
    </main>
  );
}
