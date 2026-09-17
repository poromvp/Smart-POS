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
  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Hóa đơn</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          {table ? table.name : "Chưa chọn bàn"}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {!table || orderItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Chọn bàn có khách để xem hóa đơn.</p>
        ) : (
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.quantity} x {item.price.toLocaleString("vi-VN")}₫</p>
                </div>
                <p className="shrink-0 font-semibold text-slate-900">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-medium text-slate-600">Tổng cộng</span>
          <span className="text-xl font-bold text-slate-900">{total.toLocaleString("vi-VN")}₫</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onSplitTable} disabled={!table} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Tách bàn</button>
          <button type="button" onClick={onPayment} disabled={!table || orderItems.length === 0} className="rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Thanh toán</button>
        </div>
      </div>
    </div>
  );
}
