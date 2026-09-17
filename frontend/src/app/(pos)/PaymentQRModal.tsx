"use client";

import {
  useEffect,
  useState,
} from "react";

import type { RestaurantTable } from "./TableMap";

interface PaymentQRModalProps {
  open: boolean;
  table: RestaurantTable | null;
  total: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

type PaymentStatus =
  | "waiting"
  | "success";

const QR_IMAGE_URL =
  "https://placehold.co/320x320/png?text=VIETQR";

export default function PaymentQRModal({
  open,
  table,
  total,
  onClose,
  onPaymentSuccess,
}: PaymentQRModalProps) {
  const [status, setStatus] =
    useState<PaymentStatus>("waiting");

  useEffect(() => {
    if (!open) {
      setStatus("waiting");
      return;
    }

    setStatus("waiting");

    const timer = setTimeout(() => {
      setStatus("success");

      // Cho người dùng thấy trạng thái
      // "Giao dịch thành công" trong một khoảng
      // thời gian ngắn trước khi đóng modal.
      const closeTimer = setTimeout(() => {
        onPaymentSuccess();
      }, 800);

      return () => {
        clearTimeout(closeTimer);
      };
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [open, onPaymentSuccess]);

  if (!open || !table) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Thanh toán
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {table.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={status === "success"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Total */}
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">
              Số tiền cần thanh toán
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {total.toLocaleString("vi-VN")}₫
            </p>
          </div>

          {/* QR */}
          <div className="mt-6 flex justify-center">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <img
                src={QR_IMAGE_URL}
                alt="Mã thanh toán VietQR"
                className="h-64 w-64 rounded-xl object-cover sm:h-72 sm:w-72"
              />
            </div>
          </div>

          {/* Status */}
          {status === "waiting" ? (
            <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-center">
              <div className="mx-auto flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />

                <p className="font-semibold text-amber-700">
                  Đang chờ thanh toán...
                </p>
              </div>

              <p className="mt-1 text-xs text-amber-600">
                Hệ thống đang chờ webhook ngân hàng
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">
                ✓
              </div>

              <p className="mt-3 text-lg font-bold text-emerald-700">
                Giao dịch thành công
              </p>

              <p className="mt-1 text-sm text-emerald-600">
                Đang cập nhật trạng thái bàn...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}