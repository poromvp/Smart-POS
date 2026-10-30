"use client";

import React, { useState } from "react";
import { IngredientResponse, IngredientCreateRequest, IngredientUpdateRequest } from "@/lib/types/inventory";
import { X, Save, AlertCircle } from "lucide-react";

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCreate: (data: IngredientCreateRequest) => Promise<void>;
  onSaveUpdate: (id: number, data: IngredientUpdateRequest) => Promise<void>;
  ingredientToEdit: IngredientResponse | null;
}

export default function IngredientModal({
  isOpen,
  onClose,
  onSaveCreate,
  onSaveUpdate,
  ingredientToEdit,
}: IngredientModalProps) {
  const isEdit = !!ingredientToEdit;

  const [name, setName] = useState(ingredientToEdit?.name ?? "");
  const [code, setCode] = useState(ingredientToEdit?.code ?? "");
  const [unit, setUnit] = useState(ingredientToEdit?.unit ?? "g");
  const [currentStock, setCurrentStock] = useState<number | string>(ingredientToEdit?.currentStock ?? 0);
  const [minThreshold, setMinThreshold] = useState<number | string>(ingredientToEdit?.minThreshold ?? 0);
  const [costPerUnit, setCostPerUnit] = useState<number | string>(ingredientToEdit?.costPerUnit ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên nguyên liệu");
      return;
    }
    if (!unit.trim()) {
      setError("Vui lòng nhập đơn vị tính");
      return;
    }

    try {
      setLoading(true);
      if (isEdit && ingredientToEdit) {
        await onSaveUpdate(ingredientToEdit.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          unit: unit.trim(),
          minThreshold: Number(minThreshold) || 0,
          costPerUnit: Number(costPerUnit) || 0,
        });
      } else {
        await onSaveCreate({
          name: name.trim(),
          code: code.trim() || undefined,
          unit: unit.trim(),
          currentStock: Number(currentStock) || 0,
          minThreshold: Number(minThreshold) || 0,
          costPerUnit: Number(costPerUnit) || 0,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Tên nguyên liệu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cà phê hạt Robusta, Sữa đặc..."
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Mã nguyên liệu (Code)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: NL-CF01"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm uppercase outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Đơn vị tính <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: g, ml, kg, lon..."
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                required
              />
              {isEdit && (
                <p className="mt-1 text-[11px] text-gray-400">
                  * Không đổi được đơn vị nếu đã phát sinh công thức/sổ kho
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Tồn kho ban đầu
              </label>
              <input
                type="number"
                step="any"
                min="0"
                disabled={isEdit}
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
              {isEdit && (
                <p className="mt-1 text-[10px] text-gray-400">Chỉ đổi qua Nhập/Trừ kho</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Ngưỡng cảnh báo
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Giá vốn / Đơn vị (đ)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-orange-700 transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo nguyên liệu"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
