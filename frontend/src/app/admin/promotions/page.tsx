"use client";

import React, { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Percent,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fetchPromotions,
  createPromotion,
  togglePromotionStatus,
  deletePromotion,
} from "@/lib/api";
import type { PromotionResponse, PromotionCreateRequest } from "@/lib/types/sales";
import { formatCurrency } from "@/components/pos/OrderDetailModal";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  // Modal tạo mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PromotionCreateRequest>({
    code: "",
    name: "",
    discountPercent: 10,
    maxDiscountAmount: 50000,
    minOrderAmount: 100000,
    startDate: new Date().toISOString().slice(0, 10) + "T00:00",
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + "T23:59",
    usageLimit: 100,
    isActive: true,
  });

  const toast = useToast();

  const loadData = async () => {
    try {
      const data = await fetchPromotions();
      setPromotions(data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách khuyến mãi:", err);
      toast.error(
        "Lỗi tải dữ liệu",
        err instanceof Error ? err.message : "Không thể tải danh sách khuyến mãi"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    toast.info("Đã đồng bộ", "Dữ liệu khuyến mãi đã được cập nhật mới nhất");
  };

  const handleToggleStatus = async (promo: PromotionResponse) => {
    try {
      const nextStatus = !promo.isActive;
      await togglePromotionStatus(promo.id, nextStatus);
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: nextStatus } : p))
      );
      toast.success(
        nextStatus ? "Đã kích hoạt khuyến mãi" : "Đã tạm dừng khuyến mãi",
        `Mã ${promo.code} hiện ${nextStatus ? "đang có hiệu lực" : "đã ngưng áp dụng"}.`
      );
    } catch (err) {
      toast.error(
        "Lỗi cập nhật",
        err instanceof Error ? err.message : "Không thể thay đổi trạng thái"
      );
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã khuyến mãi ${code}?`)) return;
    try {
      await deletePromotion(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      toast.success("Đã xóa mã khuyến mãi", `Mã ${code} đã được xóa hoặc ngưng hoạt động.`);
    } catch (err) {
      toast.error("Lỗi khi xóa", err instanceof Error ? err.message : "Không thể xóa khuyến mãi");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.warning("Thiếu thông tin", "Vui lòng nhập đầy đủ mã và tên khuyến mãi");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPromotion({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        startDate: formData.startDate.length === 16 ? `${formData.startDate}:00` : formData.startDate,
        endDate: formData.endDate.length === 16 ? `${formData.endDate}:00` : formData.endDate,
      });

      setPromotions((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      toast.success("Tạo mã khuyến mãi thành công!", `Mã ${created.code} đã sẵn sàng áp dụng.`);
      // Reset form
      setFormData({
        code: "",
        name: "",
        discountPercent: 10,
        maxDiscountAmount: 50000,
        minOrderAmount: 100000,
        startDate: new Date().toISOString().slice(0, 10) + "T00:00",
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + "T23:59",
        usageLimit: 100,
        isActive: true,
      });
    } catch (err) {
      toast.error("Lỗi khi tạo mã", err instanceof Error ? err.message : "Không thể tạo mã khuyến mãi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPromotions = promotions.filter((p) => {
    if (filterActiveOnly && !p.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Quản lý mã khuyến mãi & Giảm giá
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập các voucher giảm giá theo %, điều kiện đơn tối thiểu và hạn sử dụng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold px-3.5 py-2.5 rounded-xl shadow-2xs transition cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-orange-600" : ""} />
            <span>Đồng bộ</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Tạo mã voucher mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên voucher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filterActiveOnly}
              onChange={(e) => setFilterActiveOnly(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 size-4"
            />
            <span>Chỉ hiện mã đang hoạt động</span>
          </label>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                <th className="py-3.5 px-6">Mã Voucher</th>
                <th className="py-3.5 px-6">Tên chương trình</th>
                <th className="py-3.5 px-6">Mức giảm</th>
                <th className="py-3.5 px-6">Đơn tối thiểu</th>
                <th className="py-3.5 px-6">Thời hạn áp dụng</th>
                <th className="py-3.5 px-6">Lượt dùng</th>
                <th className="py-3.5 px-6">Trạng thái</th>
                <th className="py-3.5 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {filteredPromotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-orange-50/25 transition">
                  <td className="py-4 px-6 font-extrabold text-orange-600 tracking-wide">
                    {promo.code}
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-900">
                    {promo.name}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {promo.discountPercent}%
                    {promo.maxDiscountAmount && (
                      <span className="block text-xs font-normal text-gray-500">
                        (Tối đa {formatCurrency(promo.maxDiscountAmount)})
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-700">
                    {promo.minOrderAmount ? formatCurrency(promo.minOrderAmount) : "Không"}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">
                    <div>Từ: {new Date(promo.startDate).toLocaleDateString("vi-VN")}</div>
                    <div>Đến: {new Date(promo.endDate).toLocaleDateString("vi-VN")}</div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    {promo.usedCount} / {promo.usageLimit ?? "∞"}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(promo)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold cursor-pointer transition ${
                        promo.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {promo.isActive ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Đang áp dụng</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} />
                          <span>Tạm ngưng</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(promo.id, promo.code)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Xóa voucher"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPromotions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <Tag size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-600">Chưa có mã khuyến mãi nào</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Bấm "+ Tạo mã voucher mới" để phát hành chương trình giảm giá.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Voucher Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Tag className="size-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">Tạo mã khuyến mãi mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mã Voucher *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: GIAM10, TET2026"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm uppercase font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phần trăm giảm (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.discountPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPercent: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên chương trình khuyến mãi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Khai xuân đón lộc giảm 10%"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Không giới hạn"
                    value={formData.maxDiscountAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.minOrderAmount || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Giới hạn số lượt dùng (bỏ trống nếu vô hạn)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Không giới hạn"
                  value={formData.usageLimit || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimit: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Đang tạo..." : "Lưu & Kích hoạt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
