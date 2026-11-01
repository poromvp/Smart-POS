"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Package,
  AlertTriangle,
  Wallet,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Play,
  ArrowRight,
  Truck,
  TrendingDown,
  TrendingUp,
  History,
  CheckCircle2,
  Layers,
  Calendar,
} from "lucide-react";
import {
  IngredientResponse,
  IngredientCreateRequest,
  IngredientUpdateRequest,
  LowStockAlertResponse,
  InventoryTransactionResponse,
  InventoryTransactionType,
} from "@/lib/types/inventory";
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  toggleIngredientStatus,
  deductInventory,
  fetchLowStockAlerts,
  fetchInventoryTransactions,
} from "@/lib/api";
import IngredientModal from "@/components/admin/IngredientModal";
import InventoryAdjustmentModal from "@/components/admin/InventoryAdjustmentModal";
import { adjustInventory } from "@/lib/api";
import type { InventoryAdjustmentRequest } from "@/lib/types/inventory";
import { ClipboardCheck } from "lucide-react";

type InventoryTab = "stock" | "alerts" | "ledger";

export default function InventoryPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<InventoryTab>("stock");
  const [loading, setLoading] = useState(true);

  // Data states
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlertResponse[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransactionResponse[]>([]);

  // Filters for Tab 1: Kho nguyên liệu
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Filters for Tab 3: Sổ thẻ kho
  const [txTypeFilter, setTxTypeFilter] = useState<InventoryTransactionType | "ALL">("ALL");
  const [txIngredientFilter, setTxIngredientFilter] = useState<number | "ALL">("ALL");
  const [txSearch, setTxSearch] = useState("");
  const [txFromDate, setTxFromDate] = useState("");
  const [txToDate, setTxToDate] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientResponse | null>(null);

  // Simulation Deduct Modal State
  const [isDeductOpen, setIsDeductOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentIngredient, setAdjustmentIngredient] = useState<IngredientResponse | null>(null);
  const [testOrderCode, setTestOrderCode] = useState("ORD-100001");
  const [testProductId, setTestProductId] = useState("1");
  const [testQty, setTestQty] = useState("1");
  const [deductLoading, setDeductLoading] = useState(false);
  const [deductResult, setDeductResult] = useState<string | null>(null);

  // Tải dữ liệu tổng hợp
  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchIngredients(),
      fetchLowStockAlerts(),
      fetchInventoryTransactions(),
    ])
      .then(([ings, lowAlerts, txs]) => {
        setIngredients(ings);
        setAlerts(lowAlerts);
        setTransactions(txs);
        setLoading(false);
      })
      .catch((err: unknown) => {
        toast.error("Không thể tải dữ liệu kho", err instanceof Error ? err.message : "Lỗi kết nối");
        setLoading(false);
      });
  }, [toast]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetchIngredients(),
      fetchLowStockAlerts(),
      fetchInventoryTransactions(),
    ])
      .then(([ings, lowAlerts, txs]) => {
        if (!ignore) {
          setIngredients(ings);
          setAlerts(lowAlerts);
          setTransactions(txs);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          toast.error("Không thể tải dữ liệu kho", err instanceof Error ? err.message : "Lỗi kết nối");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [toast]);

  const handleSaveCreate = async (req: IngredientCreateRequest) => {
    await createIngredient(req);
    toast.success("Thành công", `Đã tạo nguyên liệu "${req.name}"`);
    loadData();
  };

  const handleSaveUpdate = async (id: number, req: IngredientUpdateRequest) => {
    await updateIngredient(id, req);
    toast.success("Thành công", `Đã cập nhật nguyên liệu "${req.name}"`);
    loadData();
  };

  const handleDelete = async (ing: IngredientResponse) => {
    if (!confirm(`Bạn có chắc muốn xóa nguyên liệu "${ing.name}"?`)) return;
    try {
      await deleteIngredient(ing.id);
      toast.success("Đã xóa", `Đã xóa nguyên liệu "${ing.name}"`);
      loadData();
    } catch (err: unknown) {
      toast.error("Không thể xóa", err instanceof Error ? err.message : "Lỗi không xác định");
    }
  };

  const handleAdjustmentSuccess = async (req: InventoryAdjustmentRequest) => {
    const res = await adjustInventory(req);
    toast.success(
      req.type === "SPOILAGE" ? "Xuất hủy thành công" : "Cân bằng kho thành công",
      `${res.ingredientName}: ${res.diffQuantity > 0 ? "+" : ""}${res.diffQuantity.toFixed(3)} ${res.unit} (Tồn mới: ${res.stockAfter.toFixed(3)} ${res.unit})`
    );
    loadData();
  };

  const handleToggleStatus = async (ing: IngredientResponse) => {
    const nextStatus = !ing.isActive;
    try {
      await toggleIngredientStatus(ing.id, nextStatus);
      toast.success(
        "Cập nhật trạng thái",
        `Đã chuyển nguyên liệu "${ing.name}" sang ${nextStatus ? "Đang sử dụng" : "Ngừng sử dụng"}`
      );
      setIngredients((prev) =>
        prev.map((item) => (item.id === ing.id ? { ...item, isActive: nextStatus } : item))
      );
    } catch (err: unknown) {
      toast.error("Lỗi cập nhật", err instanceof Error ? err.message : "Thao tác thất bại");
    }
  };

  // Xử lý mô phỏng trừ kho
  const handleRunDeductSimulation = async () => {
    if (!testOrderCode.trim()) {
      toast.error("Lỗi", "Vui lòng nhập mã đơn hàng");
      return;
    }
    const pId = Number(testProductId);
    const qty = Number(testQty);
    if (!pId || !qty || qty <= 0) {
      toast.error("Lỗi", "ID món và số lượng bán phải hợp lệ");
      return;
    }

    try {
      setDeductLoading(true);
      setDeductResult(null);
      const res = await deductInventory({
        orderCode: testOrderCode.trim(),
        items: [
          {
            productId: pId,
            quantity: qty,
            modifierOptionIds: [],
          },
        ],
      });

      if (res.deductions.length === 0) {
        setDeductResult(`Món ID ${pId} chưa được cấu hình công thức định lượng (BOM). Không có nguyên liệu nào bị trừ.`);
      } else {
        const details = res.deductions
          .map(
            (d) =>
              `- ${d.ingredientName}: trừ ${d.quantityDeducted} ${d.unit} (Tồn trước: ${d.stockBefore} -> Tồn sau: ${d.stockAfter})`
          )
          .join("\n");
        setDeductResult(`Đã trừ kho thành công cho đơn [${res.orderCode}]:\n${details}`);
      }
      toast.success("Mô phỏng thành công", "Kho đã được trừ thành công theo công thức");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi trừ kho";
      setDeductResult(`TRỪ KHO THẤT BẠI:\n${msg}`);
      toast.error("Mô phỏng thất bại", msg);
    } finally {
      setDeductLoading(false);
    }
  };

  // Tính toán số liệu thống kê
  const totalAssetValue = useMemo(() => {
    return ingredients.reduce((sum, item) => {
      const stock = item.currentStock || 0;
      const cost = item.costPerUnit || 0;
      return sum + stock * cost;
    }, 0);
  }, [ingredients]);

  const totalDeficitCost = useMemo(() => {
    return alerts.reduce((sum, a) => sum + (a.estimatedReorderCost || 0), 0);
  }, [alerts]);

  // Danh sách hiển thị theo tìm kiếm & bộ lọc Tab 1
  const displayedIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchSearch =
        searchQuery === "" ||
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ing.code && ing.code.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchLowStock = !filterLowStockOnly || ing.lowStock;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && ing.isActive) ||
        (statusFilter === "INACTIVE" && !ing.isActive);
      return matchSearch && matchLowStock && matchStatus;
    });
  }, [ingredients, searchQuery, filterLowStockOnly, statusFilter]);

  // Danh sách hiển thị Tab 3: Sổ thẻ kho
  const filteredTransactions = useMemo(() => {
    const q = txSearch.toLowerCase().trim();
    return transactions.filter((tx) => {
      const matchType = txTypeFilter === "ALL" || tx.transactionType === txTypeFilter;
      const matchIngredient = txIngredientFilter === "ALL" || tx.ingredientId === txIngredientFilter;
      const matchSearch =
        !q ||
        (tx.orderCode && tx.orderCode.toLowerCase().includes(q)) ||
        tx.ingredientName.toLowerCase().includes(q) ||
        (tx.ingredientCode && tx.ingredientCode.toLowerCase().includes(q));

      let matchDate = true;
      if (txFromDate) {
        const from = new Date(txFromDate);
        from.setHours(0, 0, 0, 0);
        matchDate = matchDate && new Date(tx.createdAt) >= from;
      }
      if (txToDate) {
        const to = new Date(txToDate);
        to.setHours(23, 59, 59, 999);
        matchDate = matchDate && new Date(tx.createdAt) <= to;
      }

      return matchType && matchIngredient && matchSearch && matchDate;
    });
  }, [transactions, txTypeFilter, txIngredientFilter, txSearch, txFromDate, txToDate]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-orange-500" />
            Quản Lý Kho Hàng & Định Lượng
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi tồn kho nguyên vật liệu, cảnh báo thiếu hụt và kiểm toán lịch sử biến động thẻ kho.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-500" : ""}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdjustmentIngredient(null);
              setIsAdjustmentOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-200" />
            <span>Cân bằng kho & Xuất hủy</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTestOrderCode("ORD-" + Math.floor(100000 + Math.random() * 900000).toString());
              setDeductResult(null);
              setIsDeductOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-orange-400" />
            <span>Mô phỏng trừ kho</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingIngredient(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 transition shadow-xs shadow-orange-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nguyên liệu</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Tổng nguyên liệu"
          value={String(ingredients.length)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Nguyên liệu sắp hết"
          value={String(alerts.length)}
          isWarning={alerts.length > 0}
        />
        <StatCard
          icon={Wallet}
          label="Ước tính giá trị tồn"
          value={totalAssetValue.toLocaleString("vi-VN") + " đ"}
        />
        <StatCard
          icon={History}
          label="Tổng giao dịch thẻ kho"
          value={String(transactions.length)}
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "stock"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Package className="w-4 h-4 text-orange-400" />
          <span>Danh Mục Tồn Kho</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {ingredients.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "alerts"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Cảnh Báo Thiếu Hụt (Phase 4)</span>
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold">
              {alerts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "ledger"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <History className="w-4 h-4 text-blue-400" />
          <span>Sổ Thẻ Kho (Audit Ledger)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {transactions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DANH MỤC TỒN KHO */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          {/* Thanh công cụ tìm kiếm và lọc */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc mã nguyên liệu..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            {/* Bộ lọc trạng thái */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Tất cả ({ingredients.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === "ACTIVE"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-gray-600 hover:text-emerald-700"
                }`}
              >
                Đang dùng ({ingredients.filter((i) => i.isActive).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === "INACTIVE"
                    ? "bg-gray-700 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Ngừng dùng ({ingredients.filter((i) => !i.isActive).length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                filterLowStockOnly
                  ? "bg-red-50 text-red-600 border-red-300"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {filterLowStockOnly ? "Đang lọc: Sắp hết hàng" : "Lọc cảnh báo thiếu"}
            </button>
          </div>

          {/* Bảng danh sách nguyên liệu */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                    <th className="px-6 py-3.5 w-12 text-center">#</th>
                    <th className="px-4 py-3.5">Nguyên liệu</th>
                    <th className="px-4 py-3.5">Mã</th>
                    <th className="px-4 py-3.5 text-center">ĐVT</th>
                    <th className="px-4 py-3.5 text-right">Tồn kho hiện tại</th>
                    <th className="px-4 py-3.5 text-right">Ngưỡng cảnh báo</th>
                    <th className="px-4 py-3.5 text-right">Giá vốn / Đơn vị</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                    <th className="px-6 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                        Đang tải danh sách nguyên liệu...
                      </td>
                    </tr>
                  ) : displayedIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400">
                        Không tìm thấy nguyên liệu nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    displayedIngredients.map((ing, idx) => (
                      <tr key={ing.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-3.5 text-center text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-xs">{ing.name}</span>
                            {ing.lowStock && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                                Sắp hết
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                          {ing.code || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2.5 py-1 rounded bg-gray-100 text-xs font-semibold text-gray-600">
                            {ing.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs">
                          <span
                            className={`font-bold ${
                              ing.lowStock ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {ing.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-500">
                          {ing.minThreshold}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-700">
                          {ing.costPerUnit.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(ing)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                              ing.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                            }`}
                            title="Nhấn để đổi trạng thái"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ing.isActive ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                            />
                            {ing.isActive ? "Đang dùng" : "Ngừng dùng"}
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingIngredient(ing);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition cursor-pointer"
                              title="Chỉnh sửa nguyên liệu"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ing)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Xóa nguyên liệu"
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

      {/* TAB 2: CẢNH BÁO THIẾU HỤT & ĐỀ XUẤT NHẬP HÀNG */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {/* Banner Tóm tắt Ngân sách */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-white rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Có {alerts.length} nguyên liệu chạm hoặc dưới ngưỡng an toàn!
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Ước tính cần chuẩn bị:{" "}
                  <strong className="text-amber-800 font-mono text-sm">
                    {totalDeficitCost.toLocaleString("vi-VN")} đ
                  </strong>{" "}
                  để bù đắp lượng thiếu hụt đạt ngưỡng tối thiểu.
                </p>
              </div>
            </div>

            <Link
              href="/admin/purchasing"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-xs self-start sm:self-auto shrink-0"
            >
              <Truck className="w-4 h-4 text-orange-400" />
              <span>Lập đơn nhập kho ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Bảng chi tiết cảnh báo */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                    <th className="px-5 py-3.5 w-12 text-center">#</th>
                    <th className="px-4 py-3.5">Nguyên Liệu</th>
                    <th className="px-4 py-3.5 text-right">Tồn Hiện Tại</th>
                    <th className="px-4 py-3.5 text-right">Ngưỡng An Toàn</th>
                    <th className="px-4 py-3.5 w-44">Tỷ Lệ Tồn Kho (%)</th>
                    <th className="px-4 py-3.5 text-right">Thiếu Hụt</th>
                    <th className="px-4 py-3.5 text-right">Chi Phí Bù Thiếu</th>
                    <th className="px-4 py-3.5 text-right">Gợi Ý Đặt Hàng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        Tuyệt vời! Tất cả nguyên liệu đều đang ở trên ngưỡng an toàn.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((item, idx) => {
                      const pct = Math.min(100, Math.max(0, item.stockPercentage || 0));
                      const isDanger = pct < 50;

                      return (
                        <tr key={item.ingredientId} className="hover:bg-gray-50/50 transition">
                          <td className="px-5 py-3.5 text-center text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-gray-900 text-xs">{item.ingredientName}</div>
                            <div className="text-[11px] font-mono text-gray-400">{item.ingredientCode || "—"}</div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-xs text-red-600">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-600">
                            {item.minThreshold} {item.unit}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className={isDanger ? "text-red-600" : "text-amber-600"}>
                                  {pct}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isDanger ? "bg-red-500" : "bg-amber-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-xs text-red-700">
                            -{item.deficit} {item.unit}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-xs text-gray-900">
                            {(item.estimatedReorderCost || 0).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="inline-block px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg font-mono font-bold text-xs">
                              +{item.suggestedReorderQuantity} {item.unit}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SỔ THẺ KHO (AUDIT LEDGER) */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Bộ lọc thẻ kho */}
          <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Loại giao dịch */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txTypeFilter === "ALL"
                      ? "bg-slate-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Tất cả ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("IMPORT")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txTypeFilter === "IMPORT"
                      ? "bg-green-600 text-white"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  Nhập kho (IMPORT)
                </button>
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("SALE_DEDUCT")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txTypeFilter === "SALE_DEDUCT"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  Xuất bán (SALE)
                </button>
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("AUDIT_ADJUST")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txTypeFilter === "AUDIT_ADJUST"
                      ? "bg-purple-600 text-white"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  Kiểm kê (AUDIT)
                </button>
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("SPOILAGE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txTypeFilter === "SPOILAGE"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  Xuất hủy (SPOILAGE)
                </button>
              </div>

              {/* Tìm kiếm & Lọc nguyên liệu */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Mã đơn / Mã PO..."
                    className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <select
                  value={txIngredientFilter}
                  onChange={(e) =>
                    setTxIngredientFilter(
                      e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                    )
                  }
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="ALL">-- Tất cả nguyên liệu --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lọc khoảng thời gian */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
              <span className="font-bold text-gray-500 uppercase text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                Khoảng thời gian:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={txFromDate}
                  onChange={(e) => setTxFromDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-800 outline-none focus:bg-white focus:border-orange-500"
                />
                <span className="text-gray-400">đến</span>
                <input
                  type="date"
                  value={txToDate}
                  onChange={(e) => setTxToDate(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-800 outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
              {(txFromDate || txToDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setTxFromDate("");
                    setTxToDate("");
                  }}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline ml-1"
                >
                  Xóa lọc ngày
                </button>
              )}
            </div>
          </div>

          {/* Bảng Sổ Thẻ Kho */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                    <th className="px-5 py-3.5 w-12 text-center">#</th>
                    <th className="px-4 py-3.5">Thời Gian</th>
                    <th className="px-4 py-3.5">Nguyên Liệu</th>
                    <th className="px-4 py-3.5 text-center">Nghiệp Vụ</th>
                    <th className="px-4 py-3.5 text-right">Biến Động</th>
                    <th className="px-4 py-3.5 text-center">Mã Chứng Từ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Chưa có giao dịch biến động nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, idx) => {
                      const isPositive = Number(tx.quantity) > 0;

                      return (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-5 py-3.5 text-center text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-600 font-mono">
                            {new Date(tx.createdAt).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-gray-900 text-xs">{tx.ingredientName}</span>
                            <span className="text-gray-400 text-xs ml-1 font-mono">({tx.ingredientCode || "—"})</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                tx.transactionType === "IMPORT"
                                  ? "bg-green-100 text-green-700"
                                  : tx.transactionType === "SALE_DEDUCT"
                                  ? "bg-blue-100 text-blue-700"
                                  : tx.transactionType === "AUDIT_ADJUST"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {tx.transactionType === "IMPORT" ? (
                                <>
                                  <TrendingUp className="w-3 h-3" /> Nhập kho
                                </>
                              ) : tx.transactionType === "SALE_DEDUCT" ? (
                                <>
                                  <TrendingDown className="w-3 h-3" /> Xuất bán
                                </>
                              ) : tx.transactionType === "AUDIT_ADJUST" ? (
                                <>
                                  <Layers className="w-3 h-3" /> Kiểm kê
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" /> Xuất hủy
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-xs">
                            <span className={isPositive ? "text-green-600" : "text-red-600"}>
                              {isPositive ? `+${tx.quantity}` : tx.quantity} {tx.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700">
                              {tx.orderCode || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cân Bằng Kho & Xuất Hủy */}
      <InventoryAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        ingredients={ingredients}
        selectedIngredient={adjustmentIngredient}
        onSuccess={handleAdjustmentSuccess}
      />

      {/* Modal Thêm / Chỉnh sửa Nguyên liệu */}
      <IngredientModal
        key={editingIngredient ? `edit-${editingIngredient.id}` : "new"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ingredientToEdit={editingIngredient}
        onSaveCreate={handleSaveCreate}
        onSaveUpdate={handleSaveUpdate}
      />

      {/* Modal Mô Phỏng Trừ Kho */}
      {isDeductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900 text-base">Mô Phỏng Trừ Kho Tự Động (BOM)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeductOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-gray-500 leading-relaxed bg-orange-50/60 p-3 rounded-xl border border-orange-100">
                Tính năng này sẽ gọi trực tiếp endpoint <code>POST /api/inventory/deduct</code> để kiểm tra: khóa bi quan, tính toán nguyên liệu tiêu hao, trừ kho và ngăn chặn trừ trùng lặp theo mã đơn.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mã đơn hàng (orderCode)</label>
                <input
                  type="text"
                  value={testOrderCode}
                  onChange={(e) => setTestOrderCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-800 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ID Món ăn (Product ID)</label>
                  <input
                    type="number"
                    value={testProductId}
                    onChange={(e) => setTestProductId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-800 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Số lượng bán</label>
                  <input
                    type="number"
                    min="1"
                    value={testQty}
                    onChange={(e) => setTestQty(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-800 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {deductResult && (
                <div className="mt-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kết quả từ Backend:</label>
                  <pre className="p-3 bg-slate-900 text-green-400 text-xs font-mono rounded-xl whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {deductResult}
                  </pre>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDeductOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleRunDeductSimulation}
                  disabled={deductLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {deductLoading ? "Đang xử lý..." : "Bắn Request Trừ Kho"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
