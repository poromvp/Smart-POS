import type { RestaurantTable } from "./TableMap";

interface PaymentQRModalProps {
  open: boolean;
  table: RestaurantTable | null;
  total: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentQRModal({
  open,
  table,
  total,
  onClose,
  onPaymentSuccess,
}: PaymentQRModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Thanh toán</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{table?.name ?? "Hóa đơn"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-2xl leading-none text-slate-400 hover:text-slate-700">×</button>
        </div>
        <div className="mx-auto my-6 flex h-44 w-44 items-center justify-center border-8 border-slate-900 bg-white text-center text-xs font-semibold text-slate-700">
          QR THANH TOÁN
        </div>
        <p className="text-center text-2xl font-bold text-slate-900">{total.toLocaleString("vi-VN")}₫</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700">Hủy</button>
          <button type="button" onClick={onPaymentSuccess} className="rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Đã thanh toán</button>
        </div>
      </div>
    </div>
  );
}
