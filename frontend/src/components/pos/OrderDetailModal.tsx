"use client";

import React, { useRef } from "react";
import { X, Printer, CheckCircle2, Clock, MapPin, Receipt, User, Tag, Sparkles } from "lucide-react";
import type { OrderResponse } from "@/lib/types/sales";

interface OrderDetailModalProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const formatCurrency = (amount?: number | null) =>
  amount !== undefined && amount !== null ? `${amount.toLocaleString("vi-VN")}đ` : "0đ";

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
}: OrderDetailModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=480,height=700");
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <div>
            <div style="font-weight: bold;">${item.name} x${item.quantity}</div>
            ${item.toppings ? `<div style="font-size: 11px; color: #666;">+ ${item.toppings}</div>` : ""}
            ${item.note ? `<div style="font-size: 11px; color: #888; font-style: italic;">* ${item.note}</div>` : ""}
          </div>
          <div style="font-weight: bold; white-space: nowrap;">
            ${(item.subTotal || item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
          </div>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Hóa đơn #${order.orderCode}</title>
          <style>
            body {
              font-family: monospace, -apple-system, sans-serif;
              padding: 20px;
              color: #111;
              font-size: 13px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .divider { border-top: 1px dashed #666; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .total { font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">SMART POS RESTAURANT</h2>
            <div style="font-size: 11px; color: #555; margin-top: 4px;">Chi nhánh chính - 0123.456.789</div>
            <div style="font-weight: bold; margin-top: 8px;">PHIẾU THANH TOÁN</div>
          </div>
          <div class="divider"></div>
          <div class="row"><span>Mã đơn:</span><strong>#${order.orderCode}</strong></div>
          <div class="row"><span>Số bàn:</span><strong>${order.tableNumber || "Mang về"}</strong></div>
          <div class="row"><span>Thời gian:</span><span>${new Date(order.createdAt).toLocaleString("vi-VN")}</span></div>
          <div class="row"><span>Phương thức:</span><strong>${order.paymentMethod === "VIETQR" ? "VietQR / Chuyển khoản" : "Tiền mặt"}</strong></div>
          ${order.customerName || order.customerPhone ? `<div class="row"><span>Khách hàng:</span><span>${order.customerName || ""} (${order.customerPhone || ""})</span></div>` : ""}
          <div class="divider"></div>
          <div style="margin-bottom: 8px; font-weight: bold;">CHI TIẾT MÓN:</div>
          ${itemsHtml}
          <div class="divider"></div>
          <div class="row"><span>Tạm tính:</span><span>${formatCurrency(order.subtotal || order.totalAmount)}</span></div>
          ${order.discountAmount ? `<div class="row" style="color: #c00;"><span>Giảm giá voucher ${order.promotionCode ? `(${order.promotionCode})` : ""}:</span><span>-${formatCurrency(order.discountAmount)}</span></div>` : ""}
          ${order.pointsDiscountAmount ? `<div class="row" style="color: #c00;"><span>Giảm giá điểm thưởng:</span><span>-${formatCurrency(order.pointsDiscountAmount)}</span></div>` : ""}
          <div class="divider"></div>
          <div class="row total">
            <span>TỔNG CỘNG:</span>
            <span style="color: #e65100;">${formatCurrency(order.totalAmount)}</span>
          </div>
          <div class="divider"></div>
          <div class="text-center" style="font-size: 11px; color: #666; margin-top: 16px;">
            Xin cảm ơn Quý khách & Hẹn gặp lại!
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Receipt className="size-5 text-orange-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Chi tiết hóa đơn</h3>
              <p className="text-xs font-semibold text-slate-500">#{order.orderCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div ref={receiptRef} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status & Table Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-orange-50/50 p-3.5 border border-orange-100">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-orange-600 shrink-0" />
              <span className="font-bold text-slate-800">
                {order.tableNumber ? `Bàn ${order.tableNumber}` : "Đơn mang về"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  order.status === "COMPLETED"
                    ? "bg-green-100 text-green-700"
                    : order.status === "CANCELLED"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <CheckCircle2 size={12} />
                {order.status === "COMPLETED"
                  ? "Đã hoàn tất"
                  : order.status === "CANCELLED"
                  ? "Đã hủy"
                  : order.status}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {order.paymentMethod === "VIETQR" ? "VietQR" : "Tiền mặt"}
              </span>
            </div>
          </div>

          {/* Time & Customer Info */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-slate-400 shrink-0" />
              <span>{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
            </div>
            {order.customerPhone ? (
              <div className="flex items-center gap-1.5 justify-end">
                <User className="size-3.5 text-orange-500 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {order.customerName ? `${order.customerName} · ` : ""}
                  {order.customerPhone}
                </span>
              </div>
            ) : (
              <div className="text-right text-slate-400">Khách vãng lai</div>
            )}
          </div>

          {/* Itemized List */}
          <div>
            <div className="flex justify-between border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Món ăn ({order.items?.length || 0})</span>
              <span>Thành tiền</span>
            </div>
            <div className="divide-y divide-slate-100">
              {(order.items || []).map((item) => (
                <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">
                      {item.name} <span className="text-orange-600 font-bold">x{item.quantity}</span>
                    </p>
                    {item.toppings && (
                      <p className="text-xs text-slate-500 mt-0.5">+ {item.toppings}</p>
                    )}
                    {item.note && (
                      <p className="text-xs text-slate-400 italic mt-0.5">* {item.note}</p>
                    )}
                  </div>
                  <span className="font-bold tabular-nums text-slate-900 shrink-0">
                    {formatCurrency(item.subTotal || item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm border border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(order.subtotal || order.totalAmount)}
              </span>
            </div>

            {order.discountAmount && order.discountAmount > 0 ? (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  <Tag className="size-3.5" />
                  Giảm giá voucher {order.promotionCode && `(${order.promotionCode})`}
                </span>
                <span className="tabular-nums">-{formatCurrency(order.discountAmount)}</span>
              </div>
            ) : null}

            {order.pointsDiscountAmount && order.pointsDiscountAmount > 0 ? (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3.5" />
                  Giảm giá điểm thưởng
                </span>
                <span className="tabular-nums">-{formatCurrency(order.pointsDiscountAmount)}</span>
              </div>
            ) : null}

            <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-base">Tổng thanh toán</span>
              <span className="text-xl font-extrabold text-orange-600 tabular-nums">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 p-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-orange-700 transition cursor-pointer"
          >
            <Printer size={16} />
            In lại hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}
