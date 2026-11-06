"use client";

import { useEffect, useRef, useState } from "react";
import { Banknote, QrCode, X, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "./InvoicePanel";
import type { RestaurantTable } from "./TableMap";

export interface PaymentQRModalProps {
  isOpen: boolean;
  table: RestaurantTable | null;
  total: number;
  onClose: () => void;
  onPaymentSuccess: (method: "CASH" | "VIETQR") => void;
}

export default function PaymentQRModal({
  isOpen,
  table,
  total,
  onClose,
  onPaymentSuccess,
}: PaymentQRModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [method, setMethod] = useState<"cash" | "qr">("cash");
  const [received, setReceived] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amount = Number(received);
  const valid =
    received !== "" && Number.isSafeInteger(amount) && amount >= total && total > 0;

  useEffect(() => {
    if (isOpen) {
      dialog.current?.showModal();
      setReceived(String(total));
      setIsSubmitting(false);
    } else {
      dialog.current?.close();
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const handleConfirmCash = () => {
    if (!valid || isSubmitting) return;
    setIsSubmitting(true);
    onPaymentSuccess("CASH");
  };

  const handleConfirmQR = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onPaymentSuccess("VIETQR");
  };

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="payment-title"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
    >
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <p className="text-xs font-semibold text-slate-500">THANH TOÁN HÓA ĐƠN</p>
          <h2 id="payment-title" className="mt-1 text-xl font-bold">
            {table?.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thanh toán"
          className="flex size-11 items-center justify-center rounded-xl hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-orange-50 p-4">
          <span className="text-sm font-medium text-slate-700">Khách cần thanh toán</span>
          <strong className="text-3xl tabular-nums font-black text-orange-600">
            {formatCurrency(total)}
          </strong>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2">
          {(
            [
              ["cash", "Tiền mặt", Banknote],
              ["qr", "VietQR / Chuyển khoản", QrCode],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={method === value}
              onClick={() => setMethod(value)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-sm font-semibold transition ${
                method === value
                  ? "border-orange-500 bg-orange-50 text-orange-700 shadow-xs ring-1 ring-orange-400"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {method === "cash" ? (
          <>
            <label className="block text-sm font-semibold" htmlFor="cash-received">
              Tiền khách đưa (đ)
            </label>
            <input
              id="cash-received"
              inputMode="numeric"
              autoComplete="off"
              value={received}
              onChange={(event) => {
                if (/^\d{0,12}$/.test(event.target.value)) setReceived(event.target.value);
              }}
              placeholder="Nhập số tiền"
              className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-3 text-lg tabular-nums outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from(
                new Set(
                  [total, 50000, 100000, 200000, 500000].filter((value) => value >= total)
                )
              )
                .sort((a, b) => a - b)
                .map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReceived(String(value))}
                    className="min-h-11 rounded-lg bg-slate-100 px-3 text-sm font-semibold hover:bg-slate-200 transition"
                  >
                    {value === total ? "Đủ tiền" : formatCurrency(value)}
                  </button>
                ))}
            </div>

            <div
              aria-live="polite"
              className={`my-5 flex justify-between rounded-xl p-4 ${
                valid ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"
              }`}
            >
              <span>{received && amount < total ? "Còn thiếu" : "Tiền thừa trả khách"}</span>
              <strong className="tabular-nums font-bold">
                {formatCurrency(
                  received && amount < total ? total - amount : Math.max(0, amount - total)
                )}
              </strong>
            </div>

            <button
              type="button"
              disabled={!valid || isSubmitting}
              onClick={handleConfirmCash}
              className="min-h-12 w-full rounded-xl bg-orange-500 px-4 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition"
            >
              {isSubmitting ? "Đang xử lý thanh toán..." : "Hoàn tất thanh toán tiền mặt"}
            </button>
          </>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
              <QrCode size={40} className="text-orange-500" />
            </div>
            <h3 className="mt-3 font-bold text-slate-800">Thanh toán qua mã VietQR</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Vui lòng yêu cầu khách quét mã thanh toán số tiền{" "}
              <strong className="text-orange-600">{formatCurrency(total)}</strong>.
            </p>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmQR}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-700 disabled:bg-slate-200 transition"
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? "Đang xác nhận..." : "Xác nhận đã nhận chuyển khoản"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 min-h-11 w-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          Quay lại hóa đơn
        </button>
      </div>
    </dialog>
  );
}
