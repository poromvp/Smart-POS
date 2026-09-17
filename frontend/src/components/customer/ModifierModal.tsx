"use client";

import { useState } from "react";
import type { MenuItemData } from "./MenuItem";

export interface ToppingOption {
  id: string;
  label: string;
  price: number;
}

export interface ModifierSelection {
  toppings: ToppingOption[];
  sweetness: string;
  note: string;
}

interface ModifierModalProps {
  item: MenuItemData | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (selection: ModifierSelection) => void;
}

const TOPPINGS: ToppingOption[] = [
  {
    id: "t1",
    label: "Trân châu",
    price: 5000,
  },
  {
    id: "t2",
    label: "Thạch trái cây",
    price: 7000,
  },
  {
    id: "t3",
    label: "Kem cheese",
    price: 10000,
  },
];

const SWEETNESS_LEVELS = [
  "100% đường",
  "70% đường",
  "50% đường",
  "30% đường",
  "Không đường",
];

export default function ModifierModal({
  item,
  open,
  onClose,
  onAddToCart,
}: ModifierModalProps) {
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [sweetness, setSweetness] = useState("100% đường");
  const [note, setNote] = useState("");

  if (!open || !item) return null;

  const toggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  const selectedToppingData = TOPPINGS.filter((topping) =>
    selectedToppings.includes(topping.id)
  );

  const modifierTotal = selectedToppingData.reduce(
    (sum, topping) => sum + topping.price,
    0
  );

  const totalPrice = item.price + modifierTotal;

  const handleAdd = () => {
    onAddToCart({
      toppings: selectedToppingData,
      sweetness,
      note,
    });

    // Reset form
    setSelectedToppings([]);
    setSweetness("100% đường");
    setNote("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modifier-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="modifier-title"
                className="text-xl font-bold text-slate-900"
              >
                {item.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tùy chỉnh món theo sở thích
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-6 px-5 py-5">
          {/* Topping */}
          <section>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Topping
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Có thể chọn nhiều
              </p>
            </div>

            <div className="space-y-2">
              {TOPPINGS.map((topping) => {
                const checked = selectedToppings.includes(topping.id);

                return (
                  <label
                    key={topping.id}
                    className={`flex min-h-14 cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                      checked
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTopping(topping.id)}
                        className="h-5 w-5 accent-emerald-600"
                      />

                      <span className="text-sm font-medium text-slate-800">
                        {topping.label}
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-emerald-600">
                      +{topping.price.toLocaleString("vi-VN")}₫
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Sweetness */}
          <section>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Độ ngọt
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SWEETNESS_LEVELS.map((level) => {
                const active = sweetness === level;

                return (
                  <label
                    key={level}
                    className={`flex min-h-12 cursor-pointer items-center rounded-xl border px-3 transition ${
                      active
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sweetness"
                      value={level}
                      checked={active}
                      onChange={(event) => setSweetness(event.target.value)}
                      className="h-4 w-4 accent-emerald-600"
                    />

                    <span className="ml-2 text-sm font-medium text-slate-800">
                      {level}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Note */}
          <section>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Ghi chú
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Ví dụ: ít đá, không hành, ...
              </p>
            </div>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nhập ghi chú cho bếp..."
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4">
          <button
            type="button"
            onClick={handleAdd}
            className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-emerald-600 px-5 text-white shadow-lg shadow-emerald-200 transition active:scale-[0.98] hover:bg-emerald-700"
          >
            <span className="font-semibold">Thêm vào giỏ</span>

            <span className="text-lg font-bold">
              {totalPrice.toLocaleString("vi-VN")}₫
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}