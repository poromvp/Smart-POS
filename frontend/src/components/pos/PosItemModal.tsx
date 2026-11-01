"use client";

import { useState, useMemo, useId } from "react";
import { Check, Flame, Minus, Plus, X } from "lucide-react";
import type {
  ProductDetailResponse,
  ProductVariantResponse,
  ModifierOptionResponse,
} from "@/lib/types/menu";

export interface SelectedModifierOption {
  groupId: number;
  groupName: string;
  optionId: number;
  optionName: string;
  price: number;
}

export interface PosItemSelection {
  product: ProductDetailResponse;
  variant?: ProductVariantResponse;
  modifiers: SelectedModifierOption[];
  quantity: number;
  note: string;
  unitPrice: number;
  totalPrice: number;
}

interface PosItemModalProps {
  product: ProductDetailResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: PosItemSelection) => void;
}

export const formatCurrency = (amount: number) =>
  `${amount.toLocaleString("vi-VN")}đ`;

export default function PosItemModal({
  product,
  isOpen,
  onClose,
  onConfirm,
}: PosItemModalProps) {
  const formId = useId();

  if (!isOpen || !product) return null;

  return (
    <PosItemModalDialog
      key={product.id}
      product={product}
      formId={formId}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function PosItemModalDialog({
  product,
  formId,
  onClose,
  onConfirm,
}: {
  product: ProductDetailResponse;
  formId: string;
  onClose: () => void;
  onConfirm: (selection: PosItemSelection) => void;
}) {
  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantResponse | null>(() =>
      hasVariants ? product.variants[0] : null
    );

  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number[]>
  >(() => {
    // Tự động chọn option đầu tiên cho nhóm bắt buộc 1 lựa chọn
    const initial: Record<number, number[]> = {};
    if (product.modifierGroups) {
      product.modifierGroups.forEach((group) => {
        if (group.isRequired && !group.isMultiple && group.options.length > 0) {
          initial[group.id] = [group.options[0].id];
        }
      });
    }
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const handleToggleOption = (
    groupId: number,
    optionId: number,
    isMultiple: boolean,
    isRequired: boolean
  ) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];

      if (!isMultiple) {
        if (current.includes(optionId)) {
          // Nếu không bắt buộc, cho phép bấm lại để bỏ chọn
          if (!isRequired) {
            return { ...prev, [groupId]: [] };
          }
          return prev;
        }
        return { ...prev, [groupId]: [optionId] };
      }

      // Chọn nhiều (Topping)
      if (current.includes(optionId)) {
        return {
          ...prev,
          [groupId]: current.filter((id) => id !== optionId),
        };
      } else {
        return {
          ...prev,
          [groupId]: [...current, optionId],
        };
      }
    });
  };

  // Tính tổng tiền modifiers
  const { modifierTotal, selectedModifierList } = useMemo(() => {
    if (!product.modifierGroups) {
      return { modifierTotal: 0, selectedModifierList: [] };
    }

    let total = 0;
    const list: SelectedModifierOption[] = [];

    product.modifierGroups.forEach((group) => {
      const chosenIds = selectedOptions[group.id] || [];
      group.options.forEach((opt) => {
        if (chosenIds.includes(opt.id)) {
          total += opt.price || 0;
          list.push({
            groupId: group.id,
            groupName: group.name,
            optionId: opt.id,
            optionName: opt.name,
            price: opt.price || 0,
          });
        }
      });
    });

    return { modifierTotal: total, selectedModifierList: list };
  }, [product, selectedOptions]);

  // Kiểm tra nhóm bắt buộc
  const missingRequiredGroups = useMemo(() => {
    if (!product.modifierGroups) return [];
    return product.modifierGroups.filter(
      (g) =>
        g.isRequired &&
        (!selectedOptions[g.id] || selectedOptions[g.id].length === 0)
    );
  }, [product, selectedOptions]);

  const basePrice = selectedVariant
    ? selectedVariant.finalPrice
    : product.basePrice;
  const unitPrice = basePrice + modifierTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    if (missingRequiredGroups.length > 0) return;
    onConfirm({
      product,
      variant: selectedVariant || undefined,
      modifiers: selectedModifierList,
      quantity,
      note: note.trim(),
      unitPrice,
      totalPrice,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div>
            <h2
              id={`${formId}-title`}
              className="text-lg font-bold text-slate-900"
            >
              {product.name}
            </h2>
            <p className="text-xs text-orange-600 font-semibold mt-0.5">
              Giá gốc: {formatCurrency(product.basePrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Chọn Size / Biến thể */}
          {hasVariants && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Kích cỡ / Phân loại (Size) *
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border text-center transition cursor-pointer ${
                        isSelected
                          ? "border-orange-500 bg-orange-50 text-orange-950 font-bold ring-2 ring-orange-400/20 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-sm font-semibold">{v.sizeName}</span>
                      <span
                        className={`text-xs mt-0.5 ${
                          isSelected ? "text-orange-600 font-bold" : "text-slate-500"
                        }`}
                      >
                        {formatCurrency(v.finalPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Các nhóm Topping & Tùy chọn */}
          {product.modifierGroups &&
            product.modifierGroups.map((group) => {
              const chosen = selectedOptions[group.id] || [];
              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {group.name}
                    </p>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        group.isRequired
                          ? chosen.length > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600 font-extrabold"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {group.isRequired
                        ? chosen.length > 0
                          ? "Đã chọn"
                          : "Bắt buộc chọn"
                        : group.isMultiple
                        ? "Chọn nhiều"
                        : "Tùy chọn"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.options.map((opt) => {
                      const isSelected = chosen.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            handleToggleOption(
                              group.id,
                              opt.id,
                              group.isMultiple,
                              group.isRequired
                            )
                          }
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/80 text-orange-950 ring-1 ring-orange-500"
                              : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`size-4 rounded-md flex items-center justify-center border text-white text-[10px] ${
                                isSelected
                                  ? "bg-orange-500 border-orange-500"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="text-xs font-semibold truncate">
                              {opt.name}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold shrink-0 ml-2 ${
                              opt.price > 0
                                ? "text-orange-600"
                                : "text-slate-400 font-normal"
                            }`}
                          >
                            {opt.price > 0
                              ? `+${formatCurrency(opt.price)}`
                              : "0đ"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* Ghi chú */}
          <div>
            <label
              htmlFor={`${formId}-note`}
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Ghi chú cho bếp / pha chế
            </label>
            <input
              id={`${formId}-note`}
              type="text"
              placeholder="Ví dụ: Ít đá, không hành lá, mang về..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5 flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex size-9 items-center justify-center rounded-l-2xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
            >
              <Minus size={15} />
            </button>
            <span className="w-10 text-center text-sm font-bold text-slate-800">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex size-9 items-center justify-center rounded-r-2xl text-slate-500 hover:bg-slate-100 transition"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={missingRequiredGroups.length > 0}
            className="flex-1 py-3 px-5 rounded-2xl bg-orange-500 text-white font-extrabold text-sm shadow-md shadow-orange-200 hover:bg-orange-600 disabled:bg-slate-300 disabled:shadow-none transition flex items-center justify-between cursor-pointer"
          >
            <span>
              {missingRequiredGroups.length > 0
                ? `Chọn: ${missingRequiredGroups[0].name}`
                : "Thêm vào đơn"}
            </span>
            <span className="text-base tracking-tight font-black">
              {formatCurrency(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
