"use client";

import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Calendar, FileText, Check, AlertCircle } from "lucide-react";
import {
  PurchaseOrderResponse,
  PurchaseOrderCreateRequest,
  PurchaseOrderUpdateRequest,
  SupplierResponse,
} from "@/lib/types/purchasing";
import { IngredientResponse } from "@/lib/types/inventory";

interface LocalItemRow {
  ingredientId: number;
  quantity: string | number;
  unitPrice: string | number;
  expiryDate?: string;
}

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrderResponse | null;
  suppliers: SupplierResponse[];
  ingredients: IngredientResponse[];
  onSave: (data: PurchaseOrderCreateRequest | PurchaseOrderUpdateRequest) => Promise<void>;
}

export default function PurchaseOrderModal({
  isOpen,
  onClose,
  order,
  suppliers,
  ingredients,
  onSave,
}: PurchaseOrderModalProps) {
  const isViewOnly = Boolean(order && order.status !== "DRAFT");

  const [supplierId, setSupplierId] = useState<number | "">(() => {
    if (order) return order.supplierId;
    return suppliers.find((s) => s.isActive)?.id || "";
  });

  const [orderDate, setOrderDate] = useState(() => {
    if (order?.orderDate) return order.orderDate;
    return new Date().toISOString().split("T")[0];
  });

  const [deliveryDate, setDeliveryDate] = useState(order?.deliveryDate || "");
  const [note, setNote] = useState(order?.note || "");

  const [items, setItems] = useState<LocalItemRow[]>(() => {
    if (order && order.items.length > 0) {
      return order.items.map((it) => ({
        ingredientId: it.ingredientId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        expiryDate: it.expiryDate || "",
      }));
    }
    if (ingredients.length > 0) {
      return [
        {
          ingredientId: ingredients[0].id,
          quantity: 10,
          unitPrice: ingredients[0].costPerUnit || 10000,
        },
      ];
    }
    return [];
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddRow = () => {
    if (ingredients.length === 0) return;
    const existingIds = new Set(items.map((i) => i.ingredientId));
    const available = ingredients.find((i) => i.isActive && !existingIds.has(i.id));
    if (!available) {
      setError("Đã thêm toàn bộ nguyên liệu khả dụng vào danh sách");
      return;
    }
    setError(null);
    setItems((prev) => [
      ...prev,
      {
        ingredientId: available.id,
        quantity: 10,
        unitPrice: available.costPerUnit || 10000,
        expiryDate: "",
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: "ingredientId" | "quantity" | "unitPrice" | "expiryDate",
    val: string | number
  ) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === "ingredientId") {
        const ingId = Number(val);
        const ing = ingredients.find((i) => i.id === ingId);
        next[index] = {
          ...next[index],
          ingredientId: ingId,
          unitPrice: ing?.costPerUnit || next[index].unitPrice,
        };
      } else {
        next[index] = { ...next[index], [field]: val };
      }
      return next;
    });
  };

  const totalCalculated = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = parseFloat(String(it.quantity)) || 0;
      const p = parseFloat(String(it.unitPrice)) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) {
      onClose();
      return;
    }

    if (!supplierId) {
      setError("Vui lòng chọn nhà cung cấp");
      return;
    }

    if (items.length === 0) {
      setError("Vui lòng thêm ít nhất một nguyên liệu vào phiếu nhập");
      return;
    }

    // Check duplicate
    const ids = items.map((i) => i.ingredientId);
    if (new Set(ids).size !== ids.length) {
      setError("Có nguyên liệu bị trùng lặp trong phiếu nhập");
      return;
    }

    // Validate quantities & prices
    const parsedItems = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const q = parseFloat(String(it.quantity));
      const p = parseFloat(String(it.unitPrice));
      const ing = ingredients.find((x) => x.id === it.ingredientId);

      if (isNaN(q) || q <= 0) {
        setError(`Số lượng của "${ing?.name || "nguyên liệu"}" phải lớn hơn 0`);
        return;
      }
      if (isNaN(p) || p < 0) {
        setError(`Đơn giá của "${ing?.name || "nguyên liệu"}" không được âm`);
        return;
      }

      parsedItems.push({
        ingredientId: it.ingredientId,
        quantity: q,
        unitPrice: p,
        expiryDate: it.expiryDate || null,
      });
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        supplierId: Number(supplierId),
        staffId: 1, // Demo admin staff ID
        orderDate: orderDate || undefined,
        deliveryDate: deliveryDate || null,
        note: note.trim() || undefined,
        items: parsedItems,
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
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                {order
                  ? `Phiếu Nhập: ${order.poNumber}`
                  : "Lập Phiếu Nhập Kho Mới (Purchase Order)"}
              </h3>
              {order && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : order.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.status === "COMPLETED"
                      ? "Đã nhập kho"
                      : order.status === "CANCELLED"
                      ? "Đã hủy"
                      : "Bản nháp (Draft)"}
                  </span>
                  <span className="text-xs text-gray-400">
                    Tạo ngày: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Thông tin chung */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Nhà Cung Cấp <span className="text-red-500">*</span>
              </label>
              <select
                disabled={isViewOnly}
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-orange-500 disabled:bg-gray-100"
              >
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} disabled={!s.isActive}>
                    {s.name} {!s.isActive ? "(Ngừng HT)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Ngày đặt hàng
              </label>
              <input
                type="date"
                disabled={isViewOnly}
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Ngày giao nhận
              </label>
              <input
                type="date"
                disabled={isViewOnly}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-orange-500 disabled:bg-gray-100"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ghi chú</label>
              <input
                type="text"
                disabled={isViewOnly}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Nhập thịt tươi đầu tuần, kiểm tra tem niêm phong..."
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-orange-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Bảng Mặt Hàng Nhập */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Chi tiết nguyên liệu nhập kho ({items.length})
              </h4>
              {!isViewOnly && (
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition border border-orange-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dòng</span>
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold">
                    <th className="px-4 py-2.5 w-10 text-center">#</th>
                    <th className="px-3 py-2.5">Nguyên liệu</th>
                    <th className="px-3 py-2.5 w-24 text-right">Số lượng</th>
                    <th className="px-3 py-2.5 w-16 text-center">ĐVT</th>
                    <th className="px-3 py-2.5 w-28 text-right">Đơn giá nhập</th>
                    <th className="px-3 py-2.5 w-28 text-right">Thành tiền</th>
                    <th className="px-3 py-2.5 w-32 text-center">Hạn sử dụng</th>
                    {!isViewOnly && <th className="px-3 py-2.5 w-10 text-center">Xóa</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={isViewOnly ? 7 : 8} className="py-6 text-center text-gray-400">
                        Chưa có nguyên liệu nào trong phiếu nhập.
                      </td>
                    </tr>
                  ) : (
                    items.map((row, idx) => {
                      const ing = ingredients.find((i) => i.id === row.ingredientId);
                      const q = parseFloat(String(row.quantity)) || 0;
                      const p = parseFloat(String(row.unitPrice)) || 0;
                      const lineTotal = q * p;

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-center text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            {isViewOnly ? (
                              <span className="font-semibold text-gray-900">
                                {ing?.name || `ID: ${row.ingredientId}`}
                              </span>
                            ) : (
                              <select
                                value={row.ingredientId}
                                onChange={(e) =>
                                  handleUpdateItem(idx, "ingredientId", e.target.value)
                                }
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-800 outline-none focus:border-orange-500"
                              >
                                {ingredients.map((ingItem) => {
                                  const isAlreadySelected = items.some(
                                    (item, i) => i !== idx && item.ingredientId === ingItem.id
                                  );
                                  return (
                                    <option
                                      key={ingItem.id}
                                      value={ingItem.id}
                                      disabled={!ingItem.isActive || isAlreadySelected}
                                    >
                                      {ingItem.name} {ingItem.code ? `(${ingItem.code})` : ""}
                                      {!ingItem.isActive
                                        ? " (Ngừng HT)"
                                        : isAlreadySelected
                                        ? " (Đã chọn)"
                                        : ""}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {isViewOnly ? (
                              <span className="font-mono font-bold text-gray-800">{q}</span>
                            ) : (
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                value={row.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(idx, "quantity", e.target.value)
                                }
                                className="w-20 text-right font-mono bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:border-orange-500"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-bold text-gray-600">
                              {ing?.unit || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {isViewOnly ? (
                              <span className="font-mono text-gray-800">
                                {p.toLocaleString("vi-VN")} đ
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="100"
                                min="0"
                                value={row.unitPrice}
                                onChange={(e) =>
                                  handleUpdateItem(idx, "unitPrice", e.target.value)
                                }
                                className="w-24 text-right font-mono bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:border-orange-500"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                            {lineTotal.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {isViewOnly ? (
                              <span className="font-mono text-gray-700 text-xs">
                                {row.expiryDate
                                  ? new Date(row.expiryDate).toLocaleDateString("vi-VN")
                                  : "—"}
                              </span>
                            ) : (
                              <input
                                type="date"
                                value={row.expiryDate || ""}
                                onChange={(e) =>
                                  handleUpdateItem(idx, "expiryDate", e.target.value)
                                }
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 outline-none focus:border-orange-500"
                              />
                            )}
                          </td>
                          {!isViewOnly && (
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(idx)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Summary */}
          <div className="flex items-center justify-between p-4 bg-orange-50/70 rounded-xl border border-orange-100">
            <span className="text-xs font-bold text-orange-950 uppercase">
              Tổng giá trị phiếu nhập:
            </span>
            <span className="text-lg font-mono font-bold text-orange-600">
              {totalCalculated.toLocaleString("vi-VN")} đ
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            >
              {isViewOnly ? "Đóng" : "Hủy"}
            </button>
            {!isViewOnly && (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? "Đang lưu..." : "Lưu Phiếu Nháp (Draft)"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
