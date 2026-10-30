"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, AlertCircle, LoaderCircle } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { ModifierGroupResponse, ModifierOptionInput } from "@/lib/types/menu";
import { createModifierGroup, deleteModifierGroup } from "@/lib/api";

interface ModifierGroupModalProps {
  open: boolean;
  onClose: () => void;
  groups: ModifierGroupResponse[];
  onChanged: () => void;
}

export default function ModifierGroupModal({
  open,
  onClose,
  groups,
  onChanged,
}: ModifierGroupModalProps) {
  if (!open) return null;

  return (
    <ModifierGroupModalDialog
      groups={groups}
      onClose={onClose}
      onChanged={onChanged}
    />
  );
}

function ModifierGroupModalDialog({
  groups,
  onClose,
  onChanged,
}: {
  groups: ModifierGroupResponse[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [isMultiple, setIsMultiple] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<ModifierOptionInput[]>([
    { name: "", price: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    setOptions([...options, { name: "", price: 0 }]);
  };

  const handleUpdateOption = (
    index: number,
    field: keyof ModifierOptionInput,
    val: string | number
  ) => {
    const next = [...options];
    next[index] = { ...next[index], [field]: val };
    setOptions(next);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên nhóm không được để trống");
      return;
    }

    const validOptions = options
      .filter((o) => o.name.trim().length > 0)
      .map((o) => ({
        name: o.name.trim(),
        price: Number(o.price) || 0,
      }));

    setLoading(true);
    setError(null);
    try {
      await createModifierGroup({
        name: name.trim(),
        isMultiple,
        isRequired,
        options: validOptions,
      });
      toast.success("Thành công", `Đã tạo nhóm tùy chọn '${name}'.`);
      setName("");
      setOptions([{ name: "", price: 0 }]);
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tạo nhóm tùy chọn thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (group: ModifierGroupResponse) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhóm '${group.name}'?`)) return;

    setLoading(true);
    setError(null);
    try {
      await deleteModifierGroup(group.id);
      toast.success("Thành công", `Đã xóa nhóm '${group.name}'.`);
      onChanged();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Xóa nhóm thất bại (có thể đang có món ăn hoặc công thức liên kết)"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quản lý Nhóm Tùy Chọn & Topping</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Cấu hình các nhóm topping, mức đường, mức đá để gắn vào món ăn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form thêm nhóm mới */}
          <form onSubmit={handleCreate} className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-900">
              Tạo nhóm tùy chọn mới
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Tên nhóm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Topping Mì, Lượng Đường..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-4 pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isMultiple}
                    onChange={(e) => setIsMultiple(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>Chọn nhiều (Topping)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>Bắt buộc chọn</span>
                </label>
              </div>
            </div>

            {/* Danh sách các options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-600">
                  Các tùy chọn con trong nhóm
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm tùy chọn</span>
                </button>
              </div>

              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) => handleUpdateOption(idx, "name", e.target.value)}
                    placeholder="Tên tùy chọn (VD: Trân châu đen, 50% đường)"
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <div className="w-32 relative">
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={opt.price}
                      onChange={(e) => handleUpdateOption(idx, "price", Number(e.target.value))}
                      placeholder="+0"
                      className="w-full pl-2.5 pr-6 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-orange-600 focus:ring-2 focus:ring-orange-500 outline-none text-right"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-semibold">
                      đ
                    </span>
                  </div>
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Tạo nhóm tùy chọn</span>
              </button>
            </div>
          </form>

          {/* Danh sách nhóm hiện có */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Nhóm tùy chọn hiện có ({groups.length})
            </h3>
            {groups.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Chưa có nhóm nào.</p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className="p-3.5 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{group.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {group.isMultiple ? "Cho chọn nhiều" : "Chỉ chọn 1"} •{" "}
                        {group.isRequired ? "Bắt buộc chọn" : "Không bắt buộc"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(group)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Xóa nhóm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {group.options.map((opt) => (
                      <span
                        key={opt.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-700"
                      >
                        {opt.name}
                        {opt.price > 0 && (
                          <span className="ml-1 text-orange-600 font-semibold">
                            (+{opt.price.toLocaleString("vi-VN")}đ)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
