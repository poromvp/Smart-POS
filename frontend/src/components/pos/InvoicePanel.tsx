"use client";

import { useState } from "react";
import { Flame, Minus, Plus, ShoppingBag } from "lucide-react";
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

export default function InvoicePanel({
  table,
  orderItems,
  menuItems,
  onAddItem,
  onChangeQuantity,
  onPayment,
}: InvoicePanelProps) {
  const [spicyLevel, setSpicyLevel] = useState("Cấp 3");
  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasOrder = orderItems.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-100 px-4 py-4 lg:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:text-xs">Hóa đơn tại bàn</p>
            <h2 className="mt-1 text-[20px] font-bold tracking-tight text-slate-900 lg:text-2xl">{table?.name ?? "Chưa chọn bàn"}</h2>
          </div>
          <span className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold lg:px-3 lg:text-xs ${table?.status === "occupied" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
            {table?.status === "occupied" ? "Đang phục vụ" : "Bàn trống"}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 lg:px-5 lg:py-4">
        {hasOrder ? (
          <div className="space-y-2.5 lg:space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 lg:p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-slate-800 lg:text-base">{item.name}</p>
                    {item.spicyLevel && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-orange-600 lg:text-xs">
                        <Flame size={13} aria-hidden="true" /> {item.spicyLevel}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-500 lg:text-xs">{formatCurrency(item.price)} / phần</p>
                  </div>
                  <p className="shrink-0 text-[15px] font-bold text-slate-900 lg:text-base">{formatCurrency(item.price * item.quantity)}</p>
                </div>
                <div className="mt-2.5 flex items-center justify-between lg:mt-3">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${item.name}`}
                      onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
                      className="flex size-7 items-center justify-center rounded-l-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:size-8"
                    >
                      <Minus size={15} aria-hidden="true" />
                    </button>
                    <span className="w-7 text-center text-[13px] font-bold lg:w-8 lg:text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${item.name}`}
                      onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
                      className="flex size-7 items-center justify-center rounded-r-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:size-8"
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center lg:min-h-36">
            <ShoppingBag size={28} className="text-slate-300" aria-hidden="true" />
            <p className="mt-2 text-[13px] font-semibold text-slate-600 lg:text-sm">Chưa có món trong hóa đơn</p>
            <p className="mt-1 text-[11px] text-slate-400 lg:text-xs">Chọn món nhanh ở bên dưới để bắt đầu đơn hàng.</p>
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-3 lg:mt-5 lg:pt-4">
          <div className="mb-2.5 flex items-center justify-between lg:mb-3">
            <h3 className="text-[15px] font-bold text-slate-800 lg:text-base">Thêm món nhanh</h3>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 lg:text-xs">
              <Flame size={14} aria-hidden="true" />
              <select
                value={spicyLevel}
                onChange={(event) => setSpicyLevel(event.target.value)}
                className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-orange-700 outline-none focus:ring-2 focus:ring-orange-300"
                aria-label="Cấp độ cay cho món mì cay"
              >
                {Array.from({ length: 8 }, (_, index) => `Cấp ${index}`).map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:gap-2.5">
            {menuItems.map((menuItem) => {
              const isSpicyDish = Boolean(menuItem.spicyLevels);

              return (
                <button
                  key={menuItem.id}
                  type="button"
                  onClick={() => onAddItem(menuItem, isSpicyDish ? spicyLevel : undefined)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-orange-300 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300 lg:py-2.5"
                >
                  <span className="block truncate text-[13px] font-bold text-slate-800 lg:text-sm">{menuItem.name}</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-orange-600 lg:text-xs">{formatCurrency(menuItem.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-4 lg:p-5">
        <div className="mb-3 flex items-end justify-between lg:mb-4">
          <div>
            <p className="text-[13px] font-medium text-slate-500 lg:text-sm">Tổng thanh toán</p>
            <p className="mt-0.5 text-[11px] text-slate-400 lg:text-xs">{itemCount} món trong hóa đơn</p>
          </div>
          <p className="text-[22px] font-extrabold tracking-tight text-orange-600 lg:text-2xl">{formatCurrency(total)}</p>
        </div>
        <button
          type="button"
          onClick={onPayment}
          disabled={!table || !hasOrder}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none lg:py-4 lg:text-base"
        >
          <ShoppingBag size={20} aria-hidden="true" />
          Tính tiền
        </button>
      </div>
    </div>
  );
}
