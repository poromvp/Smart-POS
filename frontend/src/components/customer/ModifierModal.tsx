"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Utensils, X, Check } from "lucide-react";
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

export interface ModifierSelection {
  variant?: ProductVariantResponse;
  modifiers: SelectedModifierOption[];
  note: string;
}

interface ModifierModalProps {
  item: ProductDetailResponse | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (selection: ModifierSelection) => void;
}

export default function ModifierModal({
  item,
  open,
  onClose,
  onAddToCart,
}: ModifierModalProps) {
  if (!open || !item) return null;

  return (
    <ModifierModalDialog
      key={item.id}
      item={item}
      onClose={onClose}
      onAddToCart={onAddToCart}
    />
  );
}

function ModifierModalDialog({
  item,
  onClose,
  onAddToCart,
}: {
  item: ProductDetailResponse;
  onClose: () => void;
  onAddToCart: (selection: ModifierSelection) => void;
}) {
  // State biến thể (Size)
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantResponse | null>(() =>
      item.variants && item.variants.length > 0 ? item.variants[0] : null
    );

  // State các tùy chọn (Modifier Options): Map<groupId, optionId[]>
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number[]>
  >({});

  // State ghi chú
  const [note, setNote] = useState("");

  // Xử lý chọn/bỏ chọn một Option trong Group
  const handleToggleOption = (
    groupId: number,
    optionId: number,
    isMultiple: boolean
  ) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];

      if (!isMultiple) {
        // Chọn 1: thay thế bằng option mới
        return { ...prev, [groupId]: [optionId] };
      }

      // Chọn nhiều: toggle
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

  // Tính tổng tiền các modifier đã chọn
  const { modifierTotal, selectedModifierList } = useMemo(() => {
    if (!item || !item.modifierGroups) {
      return { modifierTotal: 0, selectedModifierList: [] };
    }

    let total = 0;
    const list: SelectedModifierOption[] = [];

    item.modifierGroups.forEach((group) => {
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
  }, [item, selectedOptions]);

  // Giá gốc (theo size được chọn hoặc giá base)
  const basePrice = selectedVariant
    ? selectedVariant.finalPrice
    : item?.basePrice || 0;

  const totalPrice = basePrice + modifierTotal;

  if (!open || !item) return null;

  const handleAdd = () => {
    onAddToCart({
      variant: selectedVariant || undefined,
      modifiers: selectedModifierList,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 sm:items-center sm:p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modifier-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#fffdfa] shadow-2xl sm:rounded-3xl"
      >
        {/* Header với ảnh món */}
        <div className="relative border-b border-orange-100 bg-[#fffdfa] p-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-stone-900"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>

          <div className="flex gap-4 items-start pr-8">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized={item.imageUrl.startsWith("http")}
                />
              ) : (
                <Utensils size={28} className="text-orange-300" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                {item.categoryName}
              </span>
              <h2
                id="modifier-title"
                className="mt-1 text-lg font-bold text-stone-900 leading-snug"
              >
                {item.name}
              </h2>
              {item.description && (
                <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Thân tùy chọn */}
        <div className="space-y-6 px-5 py-5">
          {/* 1. Chọn Size (Variants) */}
          {item.variants && item.variants.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-stone-900">
                  Kích cỡ
                </h3>
                <span className="text-xs text-stone-400">Chọn 1</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {item.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#b42318] bg-red-50/70 ring-1 ring-[#b42318]"
                          : "border-orange-100 bg-white hover:border-orange-200"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-bold text-stone-800">
                          {v.sizeName}
                        </span>
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#b42318] text-white">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="mt-2 text-xs font-semibold text-[#b42318]">
                        {v.finalPrice.toLocaleString("vi-VN")}₫
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 2. Nhóm Tùy chọn (Modifier Groups) */}
          {item.modifierGroups &&
            item.modifierGroups.map((group) => {
              const currentChosen = selectedOptions[group.id] || [];

              return (
                <section key={group.id} className="pt-2 border-t border-orange-50">
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-stone-900">
                        {group.name}
                      </h3>
                      {group.isRequired && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          Bắt buộc
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-400">
                      {group.isMultiple ? "Có thể chọn nhiều" : "Chọn 1"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.options.map((opt) => {
                      const isChecked = currentChosen.includes(opt.id);

                      return (
                        <label
                          key={opt.id}
                          className={`flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 transition ${
                            isChecked
                              ? "border-[#b42318] bg-red-50/50"
                              : "border-orange-100 bg-white hover:border-orange-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type={group.isMultiple ? "checkbox" : "radio"}
                              name={`group-${group.id}`}
                              checked={isChecked}
                              onChange={() =>
                                handleToggleOption(
                                  group.id,
                                  opt.id,
                                  group.isMultiple
                                )
                              }
                              className="h-4 w-4 accent-[#b42318]"
                            />
                            <span className="text-sm font-medium text-stone-800">
                              {opt.name}
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-[#b42318]">
                            {opt.price > 0
                              ? `+${opt.price.toLocaleString("vi-VN")}₫`
                              : "Miễn phí"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}

          {/* 3. Ghi chú cho bếp */}
          <section className="pt-2 border-t border-orange-50">
            <h3 className="text-sm font-bold text-stone-900 mb-2">
              Ghi chú cho bếp
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít ngọt, không hành, để đá riêng..."
              rows={2}
              className="w-full resize-none rounded-xl border border-orange-100 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#b42318] focus:ring-1 focus:ring-red-100"
            />
          </section>
        </div>

        {/* Footer: Nút Thêm vào giỏ */}
        <div className="sticky bottom-0 border-t border-orange-100 bg-[#fffdfa]/95 backdrop-blur p-4">
          <button
            type="button"
            onClick={handleAdd}
            className="flex min-h-12 w-full items-center justify-between rounded-xl bg-[#b42318] px-5 text-white shadow-lg shadow-red-200 transition active:scale-[0.98] hover:bg-[#8f1d15]"
          >
            <span className="font-semibold text-sm">Thêm vào giỏ hàng</span>
            <span className="text-base font-bold">
              {totalPrice.toLocaleString("vi-VN")}₫
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
