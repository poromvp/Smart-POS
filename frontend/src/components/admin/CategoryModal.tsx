"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Edit2, Check, AlertCircle, LoaderCircle } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { CategoryResponse } from "@/lib/types/menu";
import { createCategory, updateCategory, deleteCategory } from "@/lib/api";

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryResponse[];
  onChanged: () => void;
}

export default function CategoryModal({
  open,
  onClose,
  categories,
  onChanged,
}: CategoryModalProps) {
  if (!open) return null;

  return (
    <CategoryModalDialog
      categories={categories}
      onClose={onClose}
      onChanged={onChanged}
    />
  );
}

function CategoryModalDialog({
  categories,
  onClose,
  onChanged,
}: {
  categories: CategoryResponse[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(categories.length + 1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createCategory({
        name: name.trim(),
        displayOrder,
        isActive: true,
      });
      toast.success("Thành công", `Đã tạo danh mục '${name}'.`);
      setName("");
      setDisplayOrder(categories.length + 2);
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tạo danh mục thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (cat: CategoryResponse) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditOrder(cat.displayOrder);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await updateCategory(id, {
        name: editName.trim(),
        displayOrder: editOrder,
        isActive: true,
      });
      toast.success("Thành công", "Đã cập nhật danh mục.");
      setEditingId(null);
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Cập nhật danh mục thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: CategoryResponse) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục '${cat.name}'?`)) return;

    setLoading(true);
    setError(null);
    try {
      await deleteCategory(cat.id);
      toast.success("Thành công", `Đã xóa danh mục '${cat.name}'.`);
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xóa danh mục thất bại (có thể đang có món ăn)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quản lý Danh mục Thực đơn</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Thêm, sửa tên và sắp xếp thứ tự hiển thị của các nhóm món ăn
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form thêm danh mục mới */}
          <form onSubmit={handleCreate} className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-900">
              Thêm danh mục mới
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên danh mục (VD: Cà phê, Trà sữa...)"
                className="flex-1 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  placeholder="Thứ tự"
                  title="Thứ tự hiển thị"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-center focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Thêm</span>
              </button>
            </div>
          </form>

          {/* Danh sách danh mục hiện có */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Danh sách hiện có ({categories.length})
            </h3>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Chưa có danh mục nào.</p>
            ) : (
              categories.map((cat) => {
                const isEditing = editingId === cat.id;

                if (isEditing) {
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 border border-orange-200 rounded-xl"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        value={editOrder}
                        onChange={(e) => setEditOrder(Number(e.target.value))}
                        className="w-16 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-center focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={loading}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        title="Lưu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 text-[11px] font-bold text-gray-500">
                        {cat.displayOrder}
                      </span>
                      <span className="text-xs font-bold text-gray-800">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition cursor-pointer"
                        title="Sửa tên"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
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
