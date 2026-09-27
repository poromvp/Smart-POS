"use client";

import { useState } from "react";

export interface IngredientOption {
  id: string;
  name: string;
  unit: string;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

interface RecipeEditorProps {
  product: Product | null;
  ingredients: IngredientOption[];
  recipe: RecipeItem[];
  onRecipeChange: (
    recipe: RecipeItem[]
  ) => void;
  onSave: () => void;
  saved: boolean;
}

export default function RecipeEditor({
  product,
  ingredients,
  recipe,
  onRecipeChange,
  onSave,
  saved,
}: RecipeEditorProps) {
  const [ingredientId, setIngredientId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [editingIngredientId, setEditingIngredientId] =
    useState<string | null>(null);

  if (!product) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="text-4xl">📋</div>

        <h2 className="mt-4 text-lg font-bold">
          Chưa chọn món
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Chọn một món bên trái để cấu hình công thức.
        </p>
      </div>
    );
  }

  const selectedIngredient =
    ingredients.find(
      (ingredient) =>
        ingredient.id === ingredientId
    );

  const handleAddRecipe = () => {
    if (!selectedIngredient) {
      alert("Vui lòng chọn nguyên liệu.");
      return;
    }

    const parsedQuantity =
      Number(quantity);

    if (
      !quantity ||
      Number.isNaN(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      alert(
        "Vui lòng nhập số lượng hợp lệ."
      );
      return;
    }

    const existingItem = recipe.find(
      (item) =>
        item.ingredientId ===
        selectedIngredient.id
    );

    if (existingItem) {
      const confirmed = window.confirm(
        `${selectedIngredient.name} đã có trong công thức. Bạn có muốn cập nhật định lượng không?`
      );

      if (!confirmed) {
        return;
      }

      const updatedRecipe =
        recipe.map((item) =>
          item.ingredientId ===
          selectedIngredient.id
            ? {
                ...item,
                quantity:
                  parsedQuantity,
              }
            : item
        );

      onRecipeChange(updatedRecipe);
    } else {
      const newItem: RecipeItem = {
        ingredientId:
          selectedIngredient.id,
        ingredientName:
          selectedIngredient.name,
        quantity: parsedQuantity,
        unit: selectedIngredient.unit,
      };

      onRecipeChange([
        ...recipe,
        newItem,
      ]);
    }

    setIngredientId("");
    setQuantity("");
    setEditingIngredientId(null);
  };

  const handleEdit = (
    item: RecipeItem
  ) => {
    setIngredientId(item.ingredientId);
    setQuantity(String(item.quantity));
    setEditingIngredientId(
      item.ingredientId
    );
  };

  const handleDelete = (
    ingredientIdToDelete: string
  ) => {
    const ingredient =
      recipe.find(
        (item) =>
          item.ingredientId ===
          ingredientIdToDelete
      );

    const confirmed = window.confirm(
      `Xóa ${ingredient?.ingredientName ?? "nguyên liệu"} khỏi công thức?`
    );

    if (!confirmed) return;

    onRecipeChange(
      recipe.filter(
        (item) =>
          item.ingredientId !==
          ingredientIdToDelete
      )
    );

    if (
      editingIngredientId ===
      ingredientIdToDelete
    ) {
      setEditingIngredientId(null);
      setIngredientId("");
      setQuantity("");
    }
  };

  const totalIngredients =
    recipe.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Product Header */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Công thức đang cấu hình
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {product.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {product.category} • {totalIngredients} nguyên liệu
            </p>
          </div>

          <div className="hidden rounded-xl bg-emerald-50 px-4 py-3 text-right md:block">
            <p className="text-xs text-emerald-600">
              Trạng thái
            </p>

            <p className="mt-1 text-sm font-bold text-emerald-700">
              {saved
                ? "Đã lưu hệ thống"
                : "Đang chỉnh sửa"}
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="mb-3">
          <h3 className="font-bold text-slate-900">
            {editingIngredientId
              ? "Sửa định lượng"
              : "Thêm nguyên liệu"}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Khai báo lượng nguyên liệu sử dụng cho
            một món.
          </p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_180px_auto] items-end gap-3">
          {/* Ingredient */}
          <div>
            <label
              htmlFor="ingredient"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Nguyên liệu
            </label>

            <select
              id="ingredient"
              value={ingredientId}
              onChange={(event) =>
                setIngredientId(
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">
                -- Chọn nguyên liệu --
              </option>

              {ingredients.map(
                (ingredient) => (
                  <option
                    key={ingredient.id}
                    value={ingredient.id}
                  >
                    {ingredient.name} (
                    {ingredient.unit})
                  </option>
                )
              )}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Số lượng
            </label>

            <div className="relative">
              <input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value
                  )
                }
                placeholder="Ví dụ: 100"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              {selectedIngredient && (
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  {selectedIngredient.unit}
                </span>
              )}
            </div>
          </div>

          {/* Button */}
          <button
            type="button"
            onClick={handleAddRecipe}
            className="h-12 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            {editingIngredientId
              ? "Cập nhật"
              : "Thêm vào công thức"}
          </button>
        </div>

        {editingIngredientId && (
          <button
            type="button"
            onClick={() => {
              setIngredientId("");
              setQuantity("");
              setEditingIngredientId(
                null
              );
            }}
            className="mt-3 text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800"
          >
            Hủy chỉnh sửa
          </button>
        )}
      </div>

      {/* Recipe table */}
      <div className="p-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="font-bold text-slate-900">
              Công thức hiện tại
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Định lượng nguyên liệu cho 1 phần.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {recipe.length} nguyên liệu
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="w-16 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  #
                </th>

                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nguyên liệu
                </th>

                <th className="w-40 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                  Định lượng
                </th>

                <th className="w-32 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                  Đơn vị
                </th>

                <th className="w-40 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {recipe.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center"
                  >
                    <div className="text-3xl">
                      📦
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Chưa có nguyên liệu
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Hãy thêm nguyên liệu ở
                      phần trên.
                    </p>
                  </td>
                </tr>
              ) : (
                recipe.map(
                  (item, index) => (
                    <tr
                      key={
                        item.ingredientId
                      }
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-slate-400">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {item.ingredientName}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-slate-900">
                          {item.quantity.toLocaleString(
                            "vi-VN"
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                          {item.unit}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item.ingredientId
                              )
                            }
                            className="min-h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Save */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Hoàn tất cấu hình BOM
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Thay đổi chỉ được ghi nhận sau khi
              bấm lưu hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={onSave}
            className="min-h-12 rounded-xl bg-slate-900 px-7 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
          >
            Lưu hệ thống
          </button>
        </div>
      </div>
    </div>
  );
}