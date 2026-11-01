"use client";

import { useState, useId } from "react";
import { AlertTriangle, ClipboardCheck, Trash2, X } from "lucide-react";
import type {
  IngredientResponse,
  InventoryAdjustmentRequest,
} from "@/lib/types/inventory";

interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: IngredientResponse[];
  selectedIngredient?: IngredientResponse | null;
  onSuccess: (req: InventoryAdjustmentRequest) => Promise<void>;
}

export default function InventoryAdjustmentModal({
  isOpen,
  onClose,
  ingredients,
  selectedIngredient,
  onSuccess,
}: InventoryAdjustmentModalProps) {
  const formId = useId();
  const [selectedId, setSelectedId] = useState<number>(() => {
    return selectedIngredient?.id || (ingredients[0]?.id ?? 0);
  });
  const [type, setType] = useState<"AUDIT_ADJUST" | "SPOILAGE">("AUDIT_ADJUST");
  const [actualStock, setActualStock] = useState<string>("");
  const [spoilageQty, setSpoilageQty] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentIng =
    ingredients.find((i) => i.id === selectedId) ||
    selectedIngredient ||
    ingredients[0];

  const currentStock = currentIng ? currentIng.currentStock : 0;
  const unit = currentIng ? currentIng.unit : "";

  // Tính chênh lệch kiểm kê realtime
  const actualNum = parseFloat(actualStock);
  const hasValidActual = !isNaN(actualNum) && actualNum >= 0;
  const auditDiff = hasValidActual ? actualNum - currentStock : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentIng) {
      setError("Vui lòng chọn nguyên liệu");
      return;
    }

    const payload: InventoryAdjustmentRequest = {
      ingredientId: currentIng.id,
      type,
      reason: reason.trim(),
    };

    if (type === "AUDIT_ADJUST") {
      if (!hasValidActual) {
        setError("Vui lòng nhập số lượng kiểm kê thực tế hợp lệ (không âm)");
        return;
      }
      payload.actualStock = actualNum;
    } else {
      const spoilNum = parseFloat(spoilageQty);
      if (isNaN(spoilNum) || spoilNum <= 0) {
        setError("Số lượng xuất hủy phải lớn hơn 0");
        return;
      }
      if (spoilNum > currentStock) {
        setError(`Số lượng xuất hủy không được vượt quá tồn kho hiện tại (${currentStock} ${unit})`);
        return;
      }
      payload.quantity = spoilNum;
      if (!reason.trim()) {
        setError("Vui lòng nhập lý do xuất hủy hàng hỏng");
        return;
      }
    }

    try {
      setLoading(true);
      await onSuccess(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                type === "AUDIT_ADJUST"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {type === "AUDIT_ADJUST" ? (
                <ClipboardCheck size={20} />
              ) : (
                <Trash2 size={20} />
              )}
            </div>
            <div>
              <h2
                id={`${formId}-title`}
                className="text-base font-bold text-slate-800"
              >
                Cân Bằng Kho & Xuất Hủy
              </h2>
              <p className="text-xs text-slate-500">
                Điều chỉnh số dư tồn kho và ghi sổ thẻ kho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-white p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setType("AUDIT_ADJUST");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
              type === "AUDIT_ADJUST"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ClipboardCheck size={16} />
            Kiểm kê thực tế (Audit)
          </button>
          <button
            type="button"
            onClick={() => {
              setType("SPOILAGE");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
              type === "SPOILAGE"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Trash2 size={16} />
            Xuất hủy hàng hỏng (Spoilage)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn nguyên liệu */}
          <div>
            <label
              htmlFor={`${formId}-ingredient`}
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Nguyên liệu
            </label>
            <select
              id={`${formId}-ingredient`}
              value={selectedId}
              onChange={(e) => {
                setSelectedId(Number(e.target.value));
                setActualStock("");
                setSpoilageQty("");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.code || "Không mã"}) - Tồn: {ing.currentStock}{" "}
                  {ing.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Thông tin tồn kho hiện tại */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3.5">
            <span className="text-xs text-slate-600 font-medium">
              Tồn kho trên hệ thống:
            </span>
            <span className="text-sm font-bold text-slate-900">
              {currentStock.toFixed(3)} {unit}
            </span>
          </div>

          {/* Input theo type */}
          {type === "AUDIT_ADJUST" ? (
            <div>
              <label
                htmlFor={`${formId}-actualStock`}
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Số lượng thực tế đếm được ({unit})
              </label>
              <input
                id={`${formId}-actualStock`}
                type="number"
                step="0.001"
                min="0"
                placeholder={`Ví dụ: ${currentStock}`}
                value={actualStock}
                onChange={(e) => setActualStock(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {hasValidActual && (
                <div
                  className={`mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg ${
                    auditDiff > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : auditDiff < 0
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span>Biến động điều chỉnh:</span>
                  <span>
                    {auditDiff > 0 ? `+${auditDiff.toFixed(3)}` : auditDiff.toFixed(3)}{" "}
                    {unit}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label
                htmlFor={`${formId}-spoilageQty`}
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Số lượng xuất hủy / hao hụt ({unit})
              </label>
              <input
                id={`${formId}-spoilageQty`}
                type="number"
                step="0.001"
                min="0.001"
                max={currentStock}
                placeholder="Nhập số lượng hao hụt"
                value={spoilageQty}
                onChange={(e) => setSpoilageQty(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Kho sẽ tự động trừ đi số lượng này sau khi xác nhận.
              </p>
            </div>
          )}

          {/* Lý do / Ghi chú */}
          <div>
            <label
              htmlFor={`${formId}-reason`}
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              {type === "SPOILAGE" ? "Lý do xuất hủy *" : "Ghi chú kiểm kê"}
            </label>
            <input
              id={`${formId}-reason`}
              type="text"
              placeholder={
                type === "SPOILAGE"
                  ? "Ví dụ: Hết hạn sử dụng, Rơi vỡ, Mốc ẩm..."
                  : "Ví dụ: Kiểm kê định kỳ cuối tuần"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={type === "SPOILAGE"}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition disabled:opacity-50 ${
                type === "AUDIT_ADJUST"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  : "bg-red-600 hover:bg-red-700 shadow-red-200"
              }`}
            >
              {loading ? "Đang xử lý..." : "Xác nhận điều chỉnh"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
