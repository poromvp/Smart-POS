"use client";

import React, { useState } from "react";
import { X, Building2, Phone, Mail, MapPin, Check } from "lucide-react";
import { SupplierResponse, SupplierCreateRequest, SupplierUpdateRequest } from "@/lib/types/purchasing";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierResponse | null;
  onSave: (data: SupplierCreateRequest | SupplierUpdateRequest) => Promise<void>;
}

export default function SupplierModal({
  isOpen,
  onClose,
  supplier,
  onSave,
}: SupplierModalProps) {
  const [name, setName] = useState(supplier?.name || "");
  const [phone, setPhone] = useState(supplier?.phone || "");
  const [email, setEmail] = useState(supplier?.email || "");
  const [address, setAddress] = useState(supplier?.address || "");
  const [isActive, setIsActive] = useState(supplier?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên nhà cung cấp");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        isActive,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">
              {supplier ? "Cập nhật Nhà Cung Cấp" : "Thêm Nhà Cung Cấp Mới"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Tên Nhà Cung Cấp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Công ty TNHH Thực Phẩm Nam An"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 outline-none focus:bg-white focus:border-orange-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: contact@naman.vn"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              Địa chỉ kho / văn phòng
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123 Kha Vạn Cân, TP. Thủ Đức"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 outline-none focus:bg-white focus:border-orange-500 transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase">Trạng thái hợp tác:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              <span className="ml-2 text-xs font-semibold text-gray-600">
                {isActive ? "Đang hợp tác" : "Ngừng hợp tác"}
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? "Đang lưu..." : "Lưu Nhà Cung Cấp"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
