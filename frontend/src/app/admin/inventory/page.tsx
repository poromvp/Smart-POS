"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { IngredientResponse, IngredientCreateRequest, IngredientUpdateRequest } from "@/lib/types/inventory";
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  deductInventory,
} from "@/lib/api";
import IngredientModal from "@/components/admin/IngredientModal";

export default function InventoryPage() {
  const toast = useToast();
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientResponse | null>(null);

  // Simulation Deduct Modal State
  const [isDeductOpen, setIsDeductOpen] = useState(false);
  const [testOrderCode, setTestOrderCode] = useState("ORD-100001");
  const [testProductId, setTestProductId] = useState("1");
  const [testQty, setTestQty] = useState("1");
  const [deductLoading, setDeductLoading] = useState(false);
  const [deductResult, setDeductResult] = useState<string | null>(null);

  const loadData = useCallback(() => {
    fetchIngredients(searchQuery.trim() || undefined)
      .then((data) => {
        setIngredients(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        toast.error("Không thể tải nguyên liệu", err instanceof Error ? err.message : "Lỗi kết nối");
        setLoading(false);
      });
  }, [searchQuery, toast]);

  useEffect(() => {
    let ignore = false;
    fetchIngredients(searchQuery.trim() || undefined)
      .then((data) => {
        if (!ignore) {
          setIngredients(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          toast.error("Không thể tải nguyên liệu", err instanceof Error ? err.message : "Lỗi kết nối");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [searchQuery, toast]);

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

  // Tính toán thống kê
  const totalCount = ingredients.length;
  const lowStockCount = ingredients.filter((i) => i.lowStock).length;
  const totalAssetValue = useMemo(() => {
    return ingredients.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
  }, [ingredients]);

  const displayedList = ingredients.filter((i) => {
    if (filterLowStockOnly && !i.lowStock) return false;
    return true;
  });

  const handleTestDeduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeductLoading(true);
    setDeductResult(null);
    try {
      const res = await deductInventory({
        orderCode: testOrderCode.trim(),
        items: [
          {
            productId: Number(testProductId),
            quantity: Number(testQty) || 1,
            modifierOptionIds: [],
          },
        ],
      });
      toast.success("Trừ kho thành công!", `Đã trừ kho đơn ${res.orderCode}`);
      setDeductResult(`✅ Đã trừ kho thành công đơn ${res.orderCode}. Chi tiết: ${res.deductions.map(d => `${d.ingredientName} (-${d.quantityDeducted} ${d.unit})`).join(", ")}`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi trừ kho";
      toast.error("Trừ kho thất bại", msg);
      setDeductResult(`❌ Thất bại: ${msg}`);
    } finally {
      setDeductLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Tổng số nguyên liệu"
          value={String(totalCount)}
          icon={Package}
        />
        <StatCard
          label="Nguyên liệu sắp hết"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          isWarning={lowStockCount > 0}
        />
        <StatCard
          label="Ước tính giá trị tồn"
          value={totalAssetValue.toLocaleString("vi-VN") + " đ"}
          icon={Wallet}
        />
      </div>

      {/* Thanh công cụ tìm kiếm và Thao tác */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mã nguyên liệu..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              filterLowStockOnly
                ? "bg-red-50 text-red-600 border-red-300"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {filterLowStockOnly ? "Đang lọc: Sắp hết hàng" : "Lọc cảnh báo thiếu"}
          </button>

          <button
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            title="Làm mới"
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
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

      {/* Bảng danh sách nguyên liệu */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                <th className="px-6 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5">Nguyên liệu</th>
                <th className="px-4 py-3.5">Mã</th>
                <th className="px-4 py-3.5 text-center">ĐVT</th>
                <th className="px-4 py-3.5 text-right">Tồn kho hiện tại</th>
                <th className="px-4 py-3.5 text-right">Ngưỡng cảnh báo</th>
                <th className="px-4 py-3.5 text-right">Giá vốn / Đơn vị</th>
                <th className="px-6 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && ingredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Đang tải danh sách nguyên liệu...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Không tìm thấy nguyên liệu nào phù hợp.
                  </td>
                </tr>
              ) : (
                displayedList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/75 transition">
                    <td className="px-6 py-4 text-center text-xs text-gray-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      {item.lowStock && (
                        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" /> Tồn thấp
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs font-mono text-gray-500">
                      {item.code || "—"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`font-bold font-mono text-sm ${
                          item.lowStock ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {item.currentStock.toLocaleString("vi-VN")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-xs text-gray-500 font-mono">
                      {item.minThreshold.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-4 text-right text-xs text-gray-700 font-mono">
                      {item.costPerUnit.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingIngredient(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Xóa"
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

      {/* Modal Thêm / Sửa nguyên liệu - Mount fresh when key changes */}
      {isModalOpen && (
        <IngredientModal
          key={editingIngredient?.id ?? "new"}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveCreate={handleSaveCreate}
          onSaveUpdate={handleSaveUpdate}
          ingredientToEdit={editingIngredient}
        />
      )}

      {/* Modal Mô Phỏng Trừ Kho (Test Giai đoạn 2.3) */}
      {isDeductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-orange-500" />
                Mô phỏng Trừ kho Tự động (Core 2.3)
              </h3>
              <button
                onClick={() => setIsDeductOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTestDeduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mã đơn hàng (Order Code)
                </label>
                <input
                  type="text"
                  value={testOrderCode}
                  onChange={(e) => setTestOrderCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Kiểm tra tính Idempotent: Gửi lại mã cũ sẽ bị từ chối 409
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    ID Món ăn
                  </label>
                  <input
                    type="number"
                    value={testProductId}
                    onChange={(e) => setTestProductId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={testQty}
                    onChange={(e) => setTestQty(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              {deductResult && (
                <div
                  className={`p-3 rounded-xl text-xs border ${
                    deductResult.startsWith("✅")
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {deductResult}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeductOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-gray-300 rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={deductLoading}
                  className="px-4 py-2 text-xs font-bold bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {deductLoading ? "Đang xử lý..." : "Thực hiện trừ kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
