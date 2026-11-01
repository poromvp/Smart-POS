"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import StatCard from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Truck,
  Building2,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  SupplierResponse,
  SupplierCreateRequest,
  SupplierUpdateRequest,
  PurchaseOrderResponse,
  PurchaseOrderCreateRequest,
  PurchaseOrderUpdateRequest,
  PurchaseOrderStatus,
} from "@/lib/types/purchasing";
import { IngredientResponse } from "@/lib/types/inventory";
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  toggleSupplierStatus,
  deleteSupplier,
  fetchPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  completePurchaseOrder,
  cancelPurchaseOrder,
  fetchIngredients,
} from "@/lib/api";
import SupplierModal from "@/components/admin/SupplierModal";
import PurchaseOrderModal from "@/components/admin/PurchaseOrderModal";

type ActiveTab = "orders" | "suppliers";

export default function PurchasingPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>("orders");
  const [loading, setLoading] = useState(true);

  // Data states
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "ALL">("ALL");
  const [supplierFilter, setSupplierFilter] = useState<number | "ALL">("ALL");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [activeOnlySupplier, setActiveOnlySupplier] = useState(false);

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierResponse | null>(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderResponse | null>(null);

  // Tải dữ liệu ban đầu
  const loadAllData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchSuppliers(),
      fetchPurchaseOrders(),
      fetchIngredients(),
    ])
      .then(([sups, pos, ings]) => {
        setSuppliers(sups);
        setOrders(pos);
        setIngredients(ings);
        setLoading(false);
      })
      .catch((err: unknown) => {
        toast.error("Lỗi tải dữ liệu", err instanceof Error ? err.message : "Lỗi kết nối");
        setLoading(false);
      });
  }, [toast]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetchSuppliers(),
      fetchPurchaseOrders(),
      fetchIngredients(),
    ])
      .then(([sups, pos, ings]) => {
        if (!ignore) {
          setSuppliers(sups);
          setOrders(pos);
          setIngredients(ings);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          toast.error("Lỗi tải dữ liệu", err instanceof Error ? err.message : "Lỗi kết nối");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [toast]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const draftOrders = orders.filter((o) => o.status === "DRAFT").length;
    const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
    const totalSuppliers = suppliers.length;
    const totalValue = orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { totalOrders, draftOrders, completedOrders, totalSuppliers, totalValue };
  }, [orders, suppliers]);

  // Lọc danh sách Đơn nhập
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const matchSupplier =
        supplierFilter === "ALL" || o.supplierId === supplierFilter;
      return matchStatus && matchSupplier;
    });
  }, [orders, statusFilter, supplierFilter]);

  // Lọc danh sách Nhà cung cấp
  const filteredSuppliers = useMemo(() => {
    const q = searchSupplier.toLowerCase().trim();
    return suppliers.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q));
      const matchActive = !activeOnlySupplier || s.isActive;
      return matchSearch && matchActive;
    });
  }, [suppliers, searchSupplier, activeOnlySupplier]);

  // Xử lý Nhà cung cấp
  const handleSaveSupplier = async (
    data: SupplierCreateRequest | SupplierUpdateRequest
  ) => {
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, data as SupplierUpdateRequest);
      toast.success("Thành công", `Đã cập nhật nhà cung cấp "${data.name}"`);
    } else {
      await createSupplier(data as SupplierCreateRequest);
      toast.success("Thành công", `Đã thêm nhà cung cấp "${data.name}"`);
    }
    loadAllData();
  };

  const handleToggleSupplier = async (id: number, currentStatus: boolean) => {
    try {
      await toggleSupplierStatus(id, !currentStatus);
      toast.success("Thành công", "Đã cập nhật trạng thái hoạt động");
      loadAllData();
    } catch (err: unknown) {
      toast.error("Thao tác thất bại", err instanceof Error ? err.message : "Lỗi hệ thống");
    }
  };

  const handleDeleteSupplier = async (sup: SupplierResponse) => {
    if (!confirm(`Bạn có chắc muốn xóa nhà cung cấp "${sup.name}"?`)) return;
    try {
      await deleteSupplier(sup.id);
      toast.success("Thành công", `Đã xóa nhà cung cấp "${sup.name}"`);
      loadAllData();
    } catch (err: unknown) {
      toast.error("Không thể xóa", err instanceof Error ? err.message : "Lỗi hệ thống");
    }
  };

  // Xử lý Phiếu nhập kho
  const handleSaveOrder = async (
    data: PurchaseOrderCreateRequest | PurchaseOrderUpdateRequest
  ) => {
    if (selectedOrder && selectedOrder.status === "DRAFT") {
      await updatePurchaseOrder(selectedOrder.id, data as PurchaseOrderUpdateRequest);
      toast.success("Thành công", "Đã cập nhật phiếu nhập kho");
    } else {
      await createPurchaseOrder(data as PurchaseOrderCreateRequest);
      toast.success("Thành công", "Đã tạo phiếu nhập kho mới (Draft)");
    }
    loadAllData();
  };

  const handleCompleteOrder = async (order: PurchaseOrderResponse) => {
    const confirmed = confirm(
      `Xác nhận NHẬP KHO thực tế cho phiếu "${order.poNumber}"?\n\n` +
      `* Hệ thống sẽ tự động khóa kho, cộng dồn tồn kho và tính lại giá vốn bình quân gia quyền cho từng nguyên liệu.`
    );
    if (!confirmed) return;

    try {
      await completePurchaseOrder(order.id);
      toast.success("Nhập kho thành công", `Phiếu "${order.poNumber}" đã hoàn tất nhập kho và cập nhật giá vốn.`);
      loadAllData();
    } catch (err: unknown) {
      toast.error("Nhập kho thất bại", err instanceof Error ? err.message : "Lỗi hệ thống");
    }
  };

  const handleCancelOrder = async (order: PurchaseOrderResponse) => {
    if (!confirm(`Bạn có chắc muốn HỦY phiếu nhập "${order.poNumber}"?`)) return;
    try {
      await cancelPurchaseOrder(order.id);
      toast.success("Đã hủy phiếu", `Phiếu "${order.poNumber}" đã chuyển sang trạng thái HỦY.`);
      loadAllData();
    } catch (err: unknown) {
      toast.error("Không thể hủy", err instanceof Error ? err.message : "Lỗi hệ thống");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-orange-500" />
            Nhập Kho & Mua Hàng
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý nhà cung cấp, lập đơn nhập kho và tự động cập nhật giá vốn bình quân gia quyền.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAllData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-500" : ""}`} />
            <span>Làm mới</span>
          </button>

          {activeTab === "orders" ? (
            <button
              type="button"
              onClick={() => {
                setSelectedOrder(null);
                setIsOrderModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition shadow-xs shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lập phiếu nhập mới</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingSupplier(null);
                setIsSupplierModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition shadow-xs shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhà cung cấp</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Tổng đơn nhập"
          value={String(stats.totalOrders)}
        />
        <StatCard
          icon={Clock}
          label="Chờ duyệt nhập (Draft)"
          value={String(stats.draftOrders)}
          isWarning={stats.draftOrders > 0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Đã nhập kho"
          value={String(stats.completedOrders)}
        />
        <StatCard
          icon={Building2}
          label="Nhà cung cấp"
          value={String(stats.totalSuppliers)}
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "orders"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <FileText className="w-4 h-4 text-orange-400" />
          <span>Phiếu Nhập Kho</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("suppliers")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "suppliers"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Building2 className="w-4 h-4 text-orange-400" />
          <span>Danh Sách Nhà Cung Cấp</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {suppliers.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PHIẾU NHẬP KHO */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Bộ lọc đơn nhập */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Tất cả ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DRAFT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "DRAFT"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Chờ duyệt ({orders.filter((o) => o.status === "DRAFT").length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "COMPLETED"
                    ? "bg-green-600 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                Đã nhập kho ({orders.filter((o) => o.status === "COMPLETED").length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("CANCELLED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "CANCELLED"
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Đã hủy ({orders.filter((o) => o.status === "CANCELLED").length})
              </button>
            </div>

            {/* Lọc theo NCC */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase text-gray-500 shrink-0">NCC:</label>
              <select
                value={supplierFilter}
                onChange={(e) =>
                  setSupplierFilter(
                    e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                  )
                }
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="ALL">-- Tất cả nhà cung cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bảng danh sách phiếu nhập kho */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                    <th className="px-5 py-3.5 w-12 text-center">#</th>
                    <th className="px-4 py-3.5">Mã Phiếu</th>
                    <th className="px-4 py-3.5">Nhà Cung Cấp</th>
                    <th className="px-4 py-3.5">Ngày Đặt</th>
                    <th className="px-4 py-3.5">Ngày Nhận</th>
                    <th className="px-4 py-3.5 text-right">Tổng Tiền</th>
                    <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                        Đang tải danh sách phiếu nhập...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        Không tìm thấy phiếu nhập nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o, idx) => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3.5 text-center text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-xs text-gray-900">
                          {o.poNumber}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-gray-900 text-xs">{o.supplierName}</div>
                          {o.note && (
                            <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {o.note}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">
                          {o.orderDate || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">
                          {o.deliveryDate || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-xs text-gray-900">
                          {(o.totalAmount || 0).toLocaleString("vi-VN")} đ
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              o.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : o.status === "CANCELLED"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {o.status === "COMPLETED" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : o.status === "CANCELLED" ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {o.status === "COMPLETED"
                              ? "Đã nhập kho"
                              : o.status === "CANCELLED"
                              ? "Đã hủy"
                              : "Chờ duyệt (Draft)"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Xem chi tiết */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(o);
                                setIsOrderModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                              title="Xem chi tiết phiếu nhập"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Nút Duyệt nhập kho (chỉ hiển thị khi là DRAFT) */}
                            {o.status === "DRAFT" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCompleteOrder(o)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                                  title="Duyệt nhập kho & cập nhật giá vốn"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Duyệt nhập</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(o)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                  title="Hủy phiếu nhập"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DANH SÁCH NHÀ CUNG CẤP */}
      {activeTab === "suppliers" && (
        <div className="space-y-4">
          {/* Bộ lọc tìm kiếm nhà cung cấp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchSupplier}
                onChange={(e) => setSearchSupplier(e.target.value)}
                placeholder="Tìm nhà cung cấp theo tên, số điện thoại, email..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-gray-800 outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activeOnlySupplier}
                onChange={(e) => setActiveOnlySupplier(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-700">Chỉ hiện NCC đang hợp tác</span>
            </label>
          </div>

          {/* Bảng danh sách nhà cung cấp */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                    <th className="px-5 py-3.5 w-12 text-center">#</th>
                    <th className="px-4 py-3.5">Tên Nhà Cung Cấp</th>
                    <th className="px-4 py-3.5">Số Điện Thoại</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Địa Chỉ</th>
                    <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                        Đang tải danh sách nhà cung cấp...
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Không tìm thấy nhà cung cấp nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3.5 text-center text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-gray-900 text-xs">{s.name}</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                          {s.phone || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">
                          {s.email || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 max-w-xs truncate">
                          {s.address || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={s.isActive}
                              onChange={() => handleToggleSupplier(s.id, s.isActive)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                          </label>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSupplier(s);
                                setIsSupplierModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition cursor-pointer"
                              title="Chỉnh sửa nhà cung cấp"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(s)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Xóa nhà cung cấp"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhà Cung Cấp */}
      <SupplierModal
        key={editingSupplier ? `edit-${editingSupplier.id}` : "new"}
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplier={editingSupplier}
        onSave={handleSaveSupplier}
      />

      {/* Modal Phiếu Nhập Kho */}
      <PurchaseOrderModal
        key={selectedOrder ? `order-${selectedOrder.id}` : "new-order"}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={selectedOrder}
        suppliers={suppliers}
        ingredients={ingredients}
        onSave={handleSaveOrder}
      />
    </div>
  );
}
