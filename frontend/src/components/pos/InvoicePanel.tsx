"use client";

import { useState } from "react";
import { Minus, Plus, Search, ShoppingBag, ArrowLeft } from "lucide-react";
import type { RestaurantTable } from "./TableMap";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  spicyLevels?: string[];
}
export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  spicyLevel?: string;
}
export interface InvoicePanelProps {
  table: RestaurantTable | null;
  orderItems: OrderItem[];
  menuItems: MenuItem[];
  onAddItem: (menuItem: MenuItem, spicyLevel?: string) => void;
  onChangeQuantity: (orderItemId: string, quantity: number) => void;
  onPayment: () => void;
}
export const formatCurrency = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;

export default function InvoicePanel({ table, orderItems, menuItems, onAddItem, onChangeQuantity, onPayment }: InvoicePanelProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  const filteredMenu = menuItems.filter((item) => normalize(item.name).includes(normalize(query.trim())));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div><h2 className="text-xl font-bold">{table?.name}</h2><p className="mt-1 text-xs text-slate-500">{orderItems.length} loại món · {count} phần</p></div>
        <button type="button" onClick={() => { setShowMenu(!showMenu); setPendingItem(null); }} className="flex min-h-11 items-center gap-2 rounded-xl bg-orange-50 px-4 text-sm font-bold text-orange-700 hover:bg-orange-100">
          {showMenu ? <ArrowLeft size={18} /> : <Plus size={18} />}{showMenu ? "Về hóa đơn" : "Thêm món"}
        </button>
      </div>
      {showMenu ? (
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <label className="mb-3 flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={18} className="text-slate-400" /><input autoFocus aria-label="Tìm món" placeholder="Tìm tên món…" value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 outline-none" /></label>
          {pendingItem ? <div className="overflow-y-auto rounded-xl bg-slate-50 p-4"><h3 className="font-bold">{pendingItem.name}</h3><p className="mt-1 text-sm text-slate-500">Chọn tùy chọn để thêm món</p><div className="mt-4 flex flex-wrap gap-2">{pendingItem.spicyLevels?.map((level) => <button key={level} type="button" onClick={() => { onAddItem(pendingItem, level); setPendingItem(null); }} className="min-h-11 rounded-lg border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-700 hover:bg-orange-50">{level}</button>)}</div><button type="button" onClick={() => setPendingItem(null)} className="mt-4 min-h-11 text-sm text-slate-600">Quay lại danh mục</button></div> : <div className="min-h-0 flex-1 overflow-y-auto"><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{filteredMenu.map((item) => <button key={item.id} type="button" onClick={() => item.spicyLevels?.length ? setPendingItem(item) : onAddItem(item)} className="flex min-h-20 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-orange-300 hover:bg-orange-50"><span><span className="block text-sm font-semibold">{item.name}</span><span className="mt-1 block text-sm text-orange-700">{formatCurrency(item.price)}</span></span><Plus size={18} className="shrink-0 text-orange-600" /></button>)}</div>{filteredMenu.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy món phù hợp.</p>}</div>}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex justify-between border-b border-slate-100 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"><span>Món / số lượng</span><span>Thành tiền</span></div>
          {orderItems.map((item) => <div key={item.id} className="border-b border-slate-100 py-3">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.spicyLevel && `${item.spicyLevel} · `}{formatCurrency(item.price)} / phần</p></div><p className="shrink-0 text-sm font-bold tabular-nums">{formatCurrency(item.price * item.quantity)}</p></div>
            <div className="mt-2 flex items-center gap-3"><div className="inline-flex items-center rounded-lg border border-slate-200"><button type="button" aria-label={`Giảm số lượng ${item.name}`} onClick={() => item.quantity === 1 ? setRemoveId(item.id) : onChangeQuantity(item.id, item.quantity - 1)} className="flex size-11 items-center justify-center rounded-l-lg hover:bg-slate-100"><Minus size={16} /></button><span className="w-9 text-center text-sm font-bold tabular-nums">{item.quantity}</span><button type="button" aria-label={`Tăng số lượng ${item.name}`} onClick={() => onChangeQuantity(item.id, item.quantity + 1)} className="flex size-11 items-center justify-center rounded-r-lg hover:bg-slate-100"><Plus size={16} /></button></div></div>
            {removeId === item.id && <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"><p>Xóa {item.name} khỏi hóa đơn?</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => { onChangeQuantity(item.id, 0); setRemoveId(null); }} className="min-h-11 rounded-lg bg-red-600 px-4 font-semibold text-white">Xóa món</button><button type="button" onClick={() => setRemoveId(null)} className="min-h-11 rounded-lg bg-white px-4">Giữ lại</button></div></div>}
          </div>)}
          {orderItems.length === 0 && <div className="py-16 text-center"><ShoppingBag size={32} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-600">Chưa có món trong hóa đơn</p><button type="button" onClick={() => setShowMenu(true)} className="mt-3 min-h-11 text-sm font-bold text-orange-600">+ Thêm món đầu tiên</button></div>}
        </div>
      )}
      <div className="shrink-0 border-t border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-slate-600">Tổng thanh toán</p><p className="mt-1 text-xs text-slate-500">{count} phần · {orderItems.length} loại món</p></div><p className="text-2xl font-extrabold tabular-nums text-orange-600">{formatCurrency(total)}</p></div>
        <button type="button" onClick={onPayment} disabled={!table || orderItems.length === 0} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><ShoppingBag size={20} />Thanh toán</button>
      </div>
    </div>
  );
}
