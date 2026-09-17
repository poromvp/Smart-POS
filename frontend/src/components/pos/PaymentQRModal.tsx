"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, QrCode, X } from "lucide-react";
import { formatCurrency } from "./InvoicePanel";
import type { RestaurantTable } from "./TableMap";

export type PaymentStatus = "waiting" | "success";

export interface PaymentQRModalProps {
  isOpen: boolean;
  table: RestaurantTable | null;
  total: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

function MockQrImage() {
  return (
    <svg viewBox="0 0 180 180" className="size-52 rounded-xl bg-white p-3 shadow-sm" role="img" aria-label="Mã QR thanh toán mô phỏng">
      <rect width="180" height="180" fill="white" />
      <g fill="#172554">
        <path d="M8 8h48v48H8zM16 16h32v32H16zM24 24h16v16H24zM124 8h48v48h-48zM132 16h32v32h-32zM140 24h16v16h-16zM8 124h48v48H8zM16 132h32v32H16zM24 140h16v16H24z" />
        <path d="M68 8h12v12H68zM92 8h12v12H92zM68 24h12v12H68zM84 24h12v12H84zM100 24h12v12h-12zM68 40h12v12H68zM92 40h20v12H92zM68 64h12v12H68zM84 64h12v12H84zM108 64h12v12h-12zM132 64h12v12h-12zM148 64h24v12h-24zM64 84h16v16H64zM88 84h12v12H88zM108 84h12v12h-12zM132 84h12v12h-12zM156 84h16v12h-16zM68 108h12v12H68zM92 108h24v12H92zM124 108h12v12h-12zM148 108h12v12h-12zM64 132h12v12H64zM84 132h12v12H84zM108 132h12v12h-12zM124 132h24v12h-24zM64 156h20v12H64zM92 156h12v12H92zM116 156h12v12h-12zM140 156h32v12h-32z" />
      </g>
    </svg>
  );
}

export default function PaymentQRModal({
  isOpen,
  table,
  total,
  onClose,
  onPaymentSuccess,
}: PaymentQRModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("waiting");

  useEffect(() => {
    if (!isOpen) return undefined;

    // Mô phỏng webhook ngân hàng xác nhận sau 3 giây.
    const confirmationTimer = window.setTimeout(() => {
      setPaymentStatus("success");
    }, 3000);
    const closeTimer = window.setTimeout(() => {
      onPaymentSuccess();
    }, 4500);

    return () => {
      window.clearTimeout(confirmationTimer);
      window.clearTimeout(closeTimer);
    };
  }, [isOpen, onPaymentSuccess]);

  if (!isOpen) return null;

  const isSuccess = paymentStatus === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="payment-title" className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {isSuccess ? (
          <div className="px-7 py-10 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={44} aria-hidden="true" />
            </div>
            <h2 id="payment-title" className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Giao dịch thành công ✅</h2>
            <p className="mt-2 text-sm text-slate-500">{table?.name} đã thanh toán {formatCurrency(total)}.</p>
            <p className="mt-5 text-xs font-medium text-slate-400">Đang hoàn tất hóa đơn và trả bàn...</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">Thanh toán QR</p>
                <h2 id="payment-title" className="mt-1 text-xl font-extrabold text-slate-900">{table?.name ?? "Hóa đơn"}</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng thanh toán">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-6 text-center">
              <div className="mx-auto flex w-fit flex-col items-center rounded-3xl border border-orange-100 bg-orange-50 p-4">
                <MockQrImage />
                <span className="mt-3 flex items-center gap-1.5 text-xs font-bold text-orange-700"><QrCode size={15} aria-hidden="true" /> Quét mã để thanh toán</span>
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">Số tiền cần thanh toán</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-orange-600">{formatCurrency(total)}</p>
              <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                <Clock3 size={17} className="animate-pulse text-orange-500" aria-hidden="true" />
                Đang chờ xác nhận từ ngân hàng...
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
