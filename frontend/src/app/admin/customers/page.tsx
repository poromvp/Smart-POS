"use client";

import React, { useEffect, useState } from "react";
import {
  UserCheck,
  Search,
  UserPlus,
  RefreshCw,
  Sparkles,
  Phone,
  Clock,
  History,
  X,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fetchCustomers,
  createCustomer,
  fetchCustomerTransactions,
} from "@/lib/api";
import type { CustomerResponse, PointTransactionResponse } from "@/lib/types/sales";
import { formatCurrency } from "@/components/pos/OrderDetailModal";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Đăng ký mới
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Lịch sử Điểm
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);
  const [transactions, setTransactions] = useState<PointTransactionResponse[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const toast = useToast();

  const loadData = async (query?: string) => {
    try {
      const data = await fetchCustomers(query);
      setCustomers(data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách khách hàng:", err);
      toast.error(
        "Lỗi tải dữ liệu",
        err instanceof Error ? err.message : "Không thể tải danh sách khách hàng"
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
    await loadData(searchQuery);
    toast.info("Đã đồng bộ", "Dữ liệu khách hàng đã được cập nhật mới nhất");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(searchQuery);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      toast.warning("Thiếu SĐT", "Vui lòng nhập số điện thoại");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCustomer({
        phone: newPhone.trim(),
        fullName: newName.trim() || undefined,
      });

      setCustomers((prev) => [res, ...prev]);
      setIsRegisterOpen(false);
      setNewPhone("");
      setNewName("");
      toast.success(
        "Đăng ký khách hàng thành công!",
        `Khách hàng ${res.fullName || res.phone} đã được thêm vào hệ thống.`
      );
    } catch (err) {
      toast.error(
        "Đăng ký thất bại",
        err instanceof Error ? err.message : "Số điện thoại đã tồn tại hoặc không hợp lệ"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTransactions = async (cust: CustomerResponse) => {
    setSelectedCustomer(cust);
    setIsTxModalOpen(true);
    setIsLoadingTx(true);
    try {
      const txList = await fetchCustomerTransactions(cust.id);
      setTransactions(txList || []);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử điểm:", err);
      toast.error("Không thể tải lịch sử điểm", err instanceof Error ? err.message : "");
    } finally {
      setIsLoadingTx(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Khách hàng thân thiết & Điểm thưởng
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý khách hàng, số điểm tích lũy và theo dõi lịch sử tích / tiêu điểm.
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
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus size={16} />
            <span>+ Đăng ký khách hàng mới</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số điện thoại hoặc tên khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl cursor-pointer transition shadow-2xs"
        >
          Tìm kiếm
        </button>
      </form>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                <th className="py-3.5 px-6">Khách hàng</th>
                <th className="py-3.5 px-6">Số điện thoại</th>
                <th className="py-3.5 px-6">Điểm tích lũy</th>
                <th className="py-3.5 px-6">Tổng chi tiêu</th>
                <th className="py-3.5 px-6">Ngày tham gia</th>
                <th className="py-3.5 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-orange-50/25 transition">
                  <td className="py-4 px-6 font-bold text-gray-900">
                    {cust.fullName || "Khách quen"}
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400" />
                      {cust.phone}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-extrabold text-orange-600 tabular-nums">
                    <span className="flex items-center gap-1">
                      <Sparkles size={14} className="text-orange-500" />
                      {cust.currentPoints} điểm
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900 tabular-nums">
                    {formatCurrency(cust.totalSpent || 0)}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">
                    {new Date(cust.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenTransactions(cust)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:border-orange-400 hover:text-orange-600 text-xs font-semibold text-gray-700 transition cursor-pointer shadow-2xs"
                    >
                      <History size={13} />
                      <span>Lịch sử điểm</span>
                    </button>
                  </td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <UserCheck size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-600">Chưa có khách hàng nào</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Đăng ký khách hàng mới tại đây hoặc ngay tại quầy thu ngân POS.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Đăng ký khách hàng mới */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <UserPlus className="size-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">Đăng ký khách hàng mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0901234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên khách hàng
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Đăng ký"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lịch sử Điểm */}
      {isTxModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Lịch sử điểm thưởng
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedCustomer.fullName || "Khách hàng"} ({selectedCustomer.phone}) · Hiện có:{" "}
                  <strong className="text-orange-600">{selectedCustomer.currentPoints} điểm</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTxModalOpen(false);
                  setSelectedCustomer(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isLoadingTx ? (
                <div className="py-8 text-center text-sm text-gray-500">Đang tải lịch sử...</div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center ${
                            tx.pointsChange > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tx.pointsChange > 0 ? (
                            <TrendingUp size={16} />
                          ) : (
                            <TrendingDown size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {tx.type === "EARN" ? "Tích điểm khi mua hàng" : "Dùng điểm giảm giá"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {tx.orderCode ? `Đơn #${tx.orderCode} · ` : ""}
                            {new Date(tx.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`font-black text-sm tabular-nums ${
                          tx.pointsChange > 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange} điểm
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Sparkles size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-600">Chưa có giao dịch điểm nào</p>
                  <p className="text-xs text-gray-400">
                    Điểm sẽ tự động tích lũy khi khách hàng hoàn tất hóa đơn.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setIsTxModalOpen(false);
                  setSelectedCustomer(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
