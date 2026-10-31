"use client";

import { useEffect, useRef, useState } from "react";
import { Banknote, QrCode, X } from "lucide-react";
import { formatCurrency } from "./InvoicePanel";
import type { RestaurantTable } from "./TableMap";

export interface PaymentQRModalProps {
  isOpen: boolean;
  table: RestaurantTable | null;
  total: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentQRModal({ isOpen, table, total, onClose, onPaymentSuccess }: PaymentQRModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [method, setMethod] = useState<"cash" | "qr">("cash");
  const [received, setReceived] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const amount = Number(received);
  const valid = received !== "" && Number.isSafeInteger(amount) && amount >= total && total > 0;
  useEffect(() => {
    if (isOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="payment-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-semibold text-slate-500">THANH TOÁN</p><h2 id="payment-title" className="mt-1 text-xl font-bold">{table?.name}</h2></div><button type="button" onClick={onClose} aria-label="Đóng thanh toán" className="flex size-11 items-center justify-center rounded-xl hover:bg-slate-100"><X size={20} /></button></div>
      <div className="p-5">
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Chế độ demo — không ghi nhận giao dịch thực tế.</p>
        <div className="my-5 flex items-center justify-between"><span className="text-sm text-slate-600">Khách cần trả</span><strong className="text-3xl tabular-nums text-orange-600">{formatCurrency(total)}</strong></div>
        <div className="mb-5 grid grid-cols-2 gap-2">{([["cash", "Tiền mặt", Banknote], ["qr", "Chuyển khoản / QR", QrCode]] as const).map(([value, label, Icon]) => <button key={value} type="button" aria-pressed={method === value} onClick={() => setMethod(value)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-sm font-semibold ${method === value ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600"}`}><Icon size={18} />{label}</button>)}</div>
        {method === "cash" ? <>
          <label className="block text-sm font-semibold" htmlFor="cash-received">Tiền khách đưa (đ)</label>
          <input id="cash-received" inputMode="numeric" autoComplete="off" value={received} onChange={(event) => { if (/^\d{0,12}$/.test(event.target.value)) setReceived(event.target.value); }} placeholder="Nhập số tiền" className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-3 text-lg tabular-nums outline-none focus:ring-2 focus:ring-orange-300" />
          <div className="mt-3 flex flex-wrap gap-2">{Array.from(new Set([total, 50000, 100000, 200000, 500000].filter((value) => value >= total))).sort((a, b) => a - b).map((value) => <button key={value} type="button" onClick={() => setReceived(String(value))} className="min-h-11 rounded-lg bg-slate-100 px-3 text-sm font-semibold hover:bg-slate-200">{value === total ? "Đủ tiền" : formatCurrency(value)}</button>)}</div>
          <div aria-live="polite" className={`my-5 flex justify-between rounded-xl p-4 ${valid ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"}`}><span>{received && amount < total ? "Còn thiếu" : "Tiền thừa trả khách"}</span><strong className="tabular-nums">{formatCurrency(received && amount < total ? total - amount : Math.max(0, amount - total))}</strong></div>
          <button type="button" disabled={!valid || confirmed} onClick={() => { if (!valid || confirmed) return; setConfirmed(true); onPaymentSuccess(); }} className="min-h-12 w-full rounded-xl bg-orange-500 px-4 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Hoàn tất thanh toán demo</button>
        </> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><QrCode size={40} className="mx-auto text-slate-400" /><h3 className="mt-3 font-bold">Chưa kết nối thanh toán QR</h3><p className="mt-2 text-sm leading-6 text-slate-500">Hóa đơn được giữ nguyên. Chỉ xác nhận chuyển khoản sau khi tích hợp và nhận kết quả từ hệ thống thanh toán.</p></div>}
        <button type="button" onClick={onClose} className="mt-3 min-h-11 w-full text-sm font-semibold text-slate-600">Quay lại hóa đơn</button>
      </div>
    </dialog>
  );
}
